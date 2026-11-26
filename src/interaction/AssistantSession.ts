import type { InterpretResult } from "@/application/assistant/InterpretSentenceService";
import { assistantContent, draftsReady, greeting, savedSummary, unparsedNote } from "@/content/assistant.content";
import { DRAFT_LIMITS } from "@/domain/assistant/DraftValidator";
import type { ParsedDraft, ParseFailure } from "@/domain/assistant/ParsedDraft";

/**
 * 초안 카드 한 장 — 파서가 만든 초안에 사용자가 고친 값이 얹힌다.
 * 소비 이유 · 기분 · 메모는 파서가 채우지 않는다. 사용자가 직접 고른 값만 들어온다.
 * id는 저장할 때 기록 번호가 된다(80 K16) — 저장이 중간에 실패해 다시 눌러도 같은 번호라 중복되지 않는다
 */
export type DraftCard = ParsedDraft & {
  id: string;
  reason: string | null;
  feeling: string | null;
  memo: string | null;
  /** OpenAI가 만들거나 카테고리를 채운 카드 — 「AI가 정리」 표시 */
  ai: boolean;
  /** 저장을 마친 카드는 더 고치지 못한다 */
  saved: boolean;
};

export type AssistantMessage =
  /** 도우미의 정형 안내. offerManual이면 「직접 입력으로 전환」 버튼을 함께 보여 준다(못 알아들음 2회 연속) */
  | { type: "notice"; text: string; offerManual: boolean }
  /** 사용자가 보낸 문장. 화면에 보여 주기만 하고 저장하지 않는다 */
  | { type: "user"; text: string }
  /** 도우미가 정리한 초안 카드 묶음. notes는 카드 아래에 덧붙이는 안내(알아듣지 못한 부분, 뺀 항목 등) */
  | { type: "drafts"; cards: DraftCard[]; notes: string[] }
  /** 저장 완료 요약. date는 「달력에서 확인」이 갈 날짜 */
  | { type: "saved"; text: string; date: string };

export type AssistantPhase = "idle" | "parsing" | "draftsReady" | "saving" | "saved" | "parseFailed";
export type SaveGroup = { date: string; cards: DraftCard[] };
export type SaveOutcome = { count: number; days: { date: string; count: number }[]; dayExpense: number | null };

const c = assistantContent;
const notice = (text: string, offerManual = false): AssistantMessage => ({ type: "notice", text, offerManual });

// 대화 패널의 상태 (앱 RecordChatSession에서 옮김). 화면과 떼어 두어 화면 없이 시험할 수 있다.
// 불변 — 바꿀 때마다 새 객체. 대화 내역은 여기 메모리에만 있다. 패널을 닫으면 사라진다(저장하지 않는다)
export class AssistantSession {
  private constructor(
    /** 기록할 날짜(화면 날짜). 문장에 날짜를 적지 않은 카드는 이 날짜로 저장된다 */
    readonly screenDate: string,
    /** 실제 오늘(Asia/Seoul) */
    readonly today: string,
    readonly messages: readonly AssistantMessage[],
    readonly phase: AssistantPhase,
    private readonly failStreak: number,
  ) {}

  static start(screenDate: string, today: string): AssistantSession {
    return new AssistantSession(screenDate, today, [notice(greeting(screenDate, today))], "idle", 0);
  }

  /** 아직 저장하지 않은 카드 전부(여러 번 보낸 문장의 카드가 이어 붙는다) */
  get pending(): DraftCard[] {
    return this.messages.flatMap((m) => (m.type === "drafts" ? m.cards.filter((card) => !card.saved) : []));
  }

  get busy(): boolean {
    return this.phase === "parsing" || this.phase === "saving";
  }

  /** 문장을 보낸다 — 사용자 말풍선을 붙이고 정리 중으로. 빈 문장이거나 바쁘면 그대로 */
  send(text: string): AssistantSession {
    if (!text.trim() || this.busy) return this;
    return this.with([...this.messages, { type: "user", text: text.trim() }], "parsing");
  }

  /** 정리 결과를 받는다. 검증을 통과한 초안만 카드가 된다. [newId]는 카드 번호(UUID)를 만든다 */
  receive(result: InterpretResult, newId: () => string): AssistantSession {
    if (this.phase !== "parsing") return this;
    if (!result.drafts.length) {
      // 날짜 탓에 뺀 것은 못 알아들은 것이 아니다
      if (result.invalidDateCount > 0) return this.fail(c.invalidDate, false);
      return this.fail(result.invalidCount > 0 ? c.invalidAmount : c.amountNotFound, true);
    }
    // 이어 붙여서 20건까지
    const taken = result.drafts.slice(0, Math.max(0, DRAFT_LIMITS.maxDrafts - this.pending.length));
    const cut = result.drafts.length - taken.length + result.overflowCount;
    if (!taken.length) return this.with([...this.messages, notice(c.tooMany)], "draftsReady");
    const notes = [
      ...(result.unparsed.length ? [unparsedNote(result.unparsed)] : []),
      ...(result.invalidCount > 0 ? [c.invalidAmount] : []),
      ...(result.invalidDateCount > 0 ? [c.invalidDate] : []),
      ...(cut > 0 ? [c.tooMany] : []),
    ];
    const cards = taken.map((d): DraftCard => ({ ...d, id: newId(), reason: null, feeling: null, memo: null, saved: false }));
    return new AssistantSession(this.screenDate, this.today, [...this.messages, notice(draftsReady(cards.length)), { type: "drafts", cards, notes }], "draftsReady", 0);
  }

  /** 정리하지 못했다(길이 초과 · 요청 제한 · 서버 오류). 길이 초과 · 요청 제한은 「못 알아들음」 횟수에 세지 않는다 */
  failed(failure: ParseFailure): AssistantSession {
    if (this.phase !== "parsing") return this;
    if (failure === "rateLimited") return this.fail(c.rateLimited, false);
    return failure === "inputTooLong" ? this.fail(c.tooLong, false) : this.fail(c.parserFailed, true);
  }

  /** 방금 보낸 문장으로 카드가 생겼는가 — 안 생겼으면 화면이 문장을 입력칸에 되돌린다 */
  get lastSendMadeCards(): boolean {
    return this.messages.at(-1)?.type === "drafts";
  }

  private fail(text: string, countsAsMiss: boolean): AssistantSession {
    const streak = this.failStreak + (countsAsMiss ? 1 : 0);
    const phase = this.pending.length ? "draftsReady" : "parseFailed";
    return new AssistantSession(this.screenDate, this.today, [...this.messages, notice(text, streak >= 2)], phase, streak);
  }

  /** 카드를 지운다 */
  remove(id: string): AssistantSession {
    const next = this.mapCards((cards) => cards.filter((card) => card.id !== id || card.saved));
    return next.with(next.messages, next.pending.length ? "draftsReady" : "idle");
  }

  /** 카드의 값을 고친다(수정 시트의 「적용」). 저장을 마친 카드는 고치지 않는다 */
  update(id: string, patch: Partial<DraftCard>): AssistantSession {
    return this.mapCards((cards) => cards.map((card) => (card.id === id && !card.saved ? { ...card, ...patch, id: card.id, saved: false } : card)));
  }

  /** 이유 칩. 같은 칩을 다시 누르면 풀리고, 기분도 같이 지운다 — 기분은 이유의 꼬리질문이다 */
  pickReason(id: string, reason: string): AssistantSession {
    const card = this.pending.find((x) => x.id === id);
    if (!card || card.kind !== "expense") return this;
    return this.update(id, card.reason === reason ? { reason: null, feeling: null } : { reason });
  }

  /** 기분 칩(이유를 고른 뒤에만). 같은 칩을 다시 누르면 풀린다 */
  pickFeeling(id: string, feeling: string): AssistantSession {
    const card = this.pending.find((x) => x.id === id);
    if (!card || card.reason === null) return this;
    return this.update(id, { feeling: card.feeling === feeling ? null : feeling });
  }

  /** 저장할 카드를 날짜별로 묶는다(날짜 순). 문장에 적은 날짜가 없으면 화면 날짜다 */
  get saveGroups(): SaveGroup[] {
    const byDate = new Map<string, DraftCard[]>();
    for (const card of this.pending) byDate.set(card.date ?? this.screenDate, [...(byDate.get(card.date ?? this.screenDate) ?? []), card]);
    return [...byDate.keys()].sort().map((date) => ({ date, cards: byDate.get(date)! }));
  }

  beginSaving(): AssistantSession {
    return this.busy || !this.pending.length ? this : this.with(this.messages, "saving");
  }

  /** 저장 실패 — 카드를 그대로 둔다. 다시 누르면 같은 번호로 들어간다 */
  saveFailed(): AssistantSession {
    return this.phase === "saving" ? this.with(this.messages, "draftsReady") : this;
  }

  /** 저장을 마쳤다 — 카드를 잠그고 요약을 붙인다 */
  markSaved(outcome: SaveOutcome): AssistantSession {
    if (this.phase !== "saving") return this;
    const locked = this.mapCards((cards) => cards.map((card) => ({ ...card, saved: true })));
    const date = outcome.days.length === 1 ? outcome.days[0].date : this.today;
    const summary: AssistantMessage = { type: "saved", text: savedSummary(outcome.count, outcome.days, outcome.dayExpense, this.today), date };
    return locked.with([...locked.messages, summary], "saved");
  }

  private mapCards(fn: (cards: DraftCard[]) => DraftCard[]): AssistantSession {
    return this.with(this.messages.map((m) => (m.type === "drafts" ? { ...m, cards: fn(m.cards) } : m)), this.phase);
  }

  private with(messages: readonly AssistantMessage[], phase: AssistantPhase): AssistantSession {
    return new AssistantSession(this.screenDate, this.today, messages, phase, this.failStreak);
  }
}
