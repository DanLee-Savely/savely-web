import type { CardReply, InterpretOutcome, InterpretResult, RecurringReply } from "@/application/assistant/InterpretSentenceService";
import type { QueryListItem, QueryReply } from "@/application/assistant/AnswerRecordQueryService";
import { assistantContent, cardRegistered, draftsReady, greeting, queryAnswer, recurringRegistered, savedSummary, unparsedNote } from "@/content/assistant.content";
import type { UnfilledRecords } from "@/domain/assistant/AssistantInsights";
import { DRAFT_LIMITS } from "@/domain/assistant/DraftValidator";
import type { ParsedDraft, ParseFailure } from "@/domain/assistant/ParsedDraft";
import type { RecordQuery } from "@/domain/assistant/RecordQueryParser";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import type { RecurringDraft } from "@/domain/recurring/RecurringCommandParser";
import type { RecurringDue, RecurringItemData } from "@/domain/recurring/RecurringItem";

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

/**
 * 고정지출 등록 카드 한 장 — 문장에서 읽은 값에 사용자가 고친 값이 얹힌다.
 * 기록 초안이 아니다. 저장 대상(pending)에 들어가지 않고, 「등록하기」를 눌러야 등록된다
 */
export type RecurringCard = {
  id: string;
  kind: ParsedDraft["kind"];
  amount: number;
  dayOfMonth: number | null;
  title: string | null;
  categoryId: string | null;
  paymentMethod: string | null;
  cardName: string | null;
  registered: boolean;
};

export type AssistantMessage =
  /** 도우미의 정형 안내. offerManual이면 「직접 입력으로 전환」 버튼을 함께 보여 준다(못 알아들음 2회 연속) */
  | { type: "notice"; text: string; offerManual: boolean }
  /** 사용자가 보낸 문장. 화면에 보여 주기만 하고 저장하지 않는다 */
  | { type: "user"; text: string }
  /** 도우미가 정리한 초안 카드 묶음. notes는 카드 아래에 덧붙이는 안내(알아듣지 못한 부분, 뺀 항목 등) */
  | { type: "drafts"; cards: DraftCard[]; notes: string[] }
  /** 저장 완료 요약. date는 「달력에서 확인」이 갈 날짜 */
  | { type: "saved"; text: string; date: string }
  /** 「할 수 있는 일」 안내 — 목록과 예시 문장(F) */
  | { type: "help" }
  /** 채우지 않은 기록 알림 — 첫 안내 자리에 대신 선다(B). 여기 실린 것은 이미 저장된 기록이다 */
  | { type: "unfilled"; unfilled: UnfilledRecords }
  /** 고정지출 최초 질문 — 첫 안내 자리에 대신 선다(C). candidates는 지난 두 달 모두 적은 항목이다 */
  | { type: "recurringAsk"; candidates: RecurringDraft[] }
  /** 나가는 날이 된 고정지출을 묻는 블록 — 첫 안내 자리에 대신 선다(C). 한 번에 하나씩, queue의 맨 앞이 지금 묻는 항목이다 */
  | { type: "recurringDue"; queue: RecurringDue[] }
  /** 고정지출 등록 카드 묶음 */
  | { type: "recurringDrafts"; cards: RecurringCard[]; notes: string[] }
  /** 등록한 고정지출 목록. 줄을 눌러 고치거나 지운다 */
  | { type: "recurringList"; items: RecurringItemData[] }
  /** 지울 고정지출을 확인하는 묶음. 「삭제하기」를 눌러야 지워진다 */
  | { type: "recurringRemove"; candidates: RecurringItemData[]; removedIds: string[]; kept: boolean }
  /** 질문의 답(H) — 한 줄 답, 그날 목록(하루를 물었을 때만), 줄인 건수, 「자세히 보기」가 갈 화면. 저장되는 것은 없다 */
  | { type: "answer"; text: string; items: QueryListItem[]; more: number; href: string }
  /** 등록할 카드 한 장 — 이름과 종류(신용 · 체크). 「등록하기」를 눌러야 등록된다 */
  | { type: "cardDraft"; id: string; name: string; method: string; registered: boolean };

/** 들어왔을 때 먼저 말을 거는 블록. 하나만 보여 준다 — 우선순위: 채우지 않은 기록 → 나가는 날이 된 고정지출 → 최초 질문 → 첫 안내 */
export type EntryBlock = Extract<AssistantMessage, { type: "unfilled" | "recurringAsk" | "recurringDue" }>;

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

  /** 문장 한 번의 결과를 받는다 — 도움말 · 고정지출 · 카드 등록 · 기록 초안 가운데 하나 */
  receiveOutcome(outcome: InterpretOutcome, newId: () => string): AssistantSession {
    if (this.phase !== "parsing") return this;
    if (outcome.type === "drafts") return this.receive(outcome.result, newId);
    const reply =
      outcome.type === "help" ? [{ type: "help" } as const]
      : outcome.type === "card" ? cardMessages(outcome.reply, newId)
      : outcome.type === "query" ? [queryMessage(outcome.reply, this.today)]
      : recurringMessages(outcome.reply, newId);
    // 기록 초안을 만들지 않으므로 저장 대상(정리해 둔 카드)과 「못 알아들음」 횟수는 그대로다
    return this.with([...this.messages, ...reply], this.pending.length ? "draftsReady" : "idle");
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

  // ── 진입 블록 · 칩 (A · B · C · F) ─────────────────────────────

  /** 먼저 말을 거는 블록을 첫 안내 자리에 세운다. 이미 대화를 시작했으면(첫 줄이 첫 안내가 아니면) 그대로 둔다 */
  showEntry(block: EntryBlock): AssistantSession {
    if (this.messages[0]?.type !== "notice") return this;
    return this.with([block, ...this.messages.slice(1)], this.phase);
  }

  /** 진입 블록을 치우고 첫 안내로 돌아간다(「나중에 할게요」 · 다 물었을 때). [after]는 덧붙일 안내 */
  closeEntry(after?: string): AssistantSession {
    if (this.messages[0]?.type === "notice") return this;
    return this.with([notice(greeting(this.screenDate, this.today)), ...this.messages.slice(1), ...(after ? [notice(after)] : [])], this.phase);
  }

  /** 고정지출 최초 질문이 떠 있는가. 떠 있는 동안에는 「월세 50만원 25일」처럼 낱말 없이 적은 문장도 등록으로 읽는다 */
  get askingRecurring(): boolean {
    return this.messages[0]?.type === "recurringAsk";
  }

  /** 등록 후보를 등록 카드로 옮긴다. 아직 등록된 것이 아니다 — 「등록하기」를 눌러야 한다 */
  pickCandidate(index: number, newId: () => string): AssistantSession {
    const first = this.messages[0];
    const picked = first?.type === "recurringAsk" ? first.candidates[index] : undefined;
    if (first?.type !== "recurringAsk" || !picked) return this;
    const card: RecurringCard = { ...picked.draft, id: newId(), dayOfMonth: picked.dayOfMonth, registered: false };
    const head: AssistantMessage = { ...first, candidates: first.candidates.filter((_, i) => i !== index) };
    const last = this.messages.at(-1);
    const rest = this.messages.slice(1);
    const next = last?.type === "recurringDrafts" && rest.length ? [...rest.slice(0, -1), { ...last, cards: [...last.cards, card] }] : [...rest, { type: "recurringDrafts" as const, cards: [card], notes: [] }];
    return this.with([head, ...next], this.phase);
  }

  /** 지금 묻는 고정지출에 답했다 — 다음 항목으로 넘어간다. 다 물었으면 첫 안내로 돌아간다 */
  answerDue(): AssistantSession {
    const first = this.messages[0];
    if (first?.type !== "recurringDue") return this;
    return first.queue.length > 1 ? this.with([{ ...first, queue: first.queue.slice(1) }, ...this.messages.slice(1)], this.phase) : this.closeEntry();
  }

  /** 「할 수 있는 일」 칩 — 안내를 붙인다. 바로 앞이 같은 안내면 또 붙이지 않는다(칩을 거듭 눌러도 쌓이지 않게) */
  showHelp(): AssistantSession {
    return this.busy || this.messages.at(-1)?.type === "help" ? this : this.with([...this.messages, { type: "help" }], this.phase);
  }

  /** 정형 안내 한 줄을 붙인다 */
  note(text: string): AssistantSession {
    return this.with([...this.messages, notice(text)], this.phase);
  }

  /**
   * 문장 없이 초안 하나를 카드로 더한다 — 「자주 적는 항목」 칩과 고정지출의 「기록할게요」가 쓴다. 검증을 마친 초안만 넘긴다.
   * 사용자 말풍선은 만들지 않는다. 바로 앞이 아직 저장하지 않은 카드 묶음이면 거기에 이어 붙인다. 20건이 찼으면 안내만 한 번 붙인다
   */
  addDraft(draft: ParsedDraft, newId: () => string): AssistantSession {
    if (this.busy) return this;
    const last = this.messages.at(-1);
    if (this.pending.length >= DRAFT_LIMITS.maxDrafts) {
      const told = last?.type === "notice" && last.text === c.tooMany;
      return this.with(told ? this.messages : [...this.messages, notice(c.tooMany)], "draftsReady");
    }
    const card: DraftCard = { ...draft, id: newId(), reason: null, feeling: null, memo: null, ai: false, saved: false };
    const open = last?.type === "drafts" && last.cards.every((x) => !x.saved);
    const messages = open ? [...this.messages.slice(0, -1), { ...last, cards: [...last.cards, card] }] : [...this.messages, { type: "drafts" as const, cards: [card], notes: [] }];
    return this.with(messages, "draftsReady");
  }

  // ── 고정지출 · 카드 등록 카드 (C · E) ────────────────────────────

  /** 등록 전의 고정지출 카드를 고친다 */
  updateRecurringCard(id: string, patch: Partial<RecurringCard>): AssistantSession {
    return this.mapMessages((m) => (m.type === "recurringDrafts" ? { ...m, cards: m.cards.map((x) => (x.id === id && !x.registered ? { ...x, ...patch, id } : x)) } : m));
  }

  /** 등록 전의 고정지출 카드를 지운다(수정 시트의 「삭제」) */
  removeRecurringCard(id: string): AssistantSession {
    return this.mapMessages((m) => (m.type === "recurringDrafts" ? { ...m, cards: m.cards.filter((x) => x.id !== id || x.registered) } : m));
  }

  /** 고정지출을 등록했다 — 카드를 잠그고 「등록했어요. 매달 ○일에 물어볼게요」 */
  recurringRegistered(id: string, day: number): AssistantSession {
    return this.mapMessages((m) => (m.type === "recurringDrafts" ? { ...m, cards: m.cards.map((x) => (x.id === id ? { ...x, registered: true } : x)) } : m)).note(recurringRegistered(day));
  }

  /** 등록한 고정지출이 바뀌었다 — 떠 있는 목록을 새로 읽은 값으로 바꾼다 */
  refreshRecurring(items: RecurringItemData[]): AssistantSession {
    return this.mapMessages((m) => (m.type === "recurringList" ? { ...m, items } : m));
  }

  /** 고정지출 하나를 지웠다 — 삭제 확인 묶음에 표시하고 「지웠어요. 이제 묻지 않을게요」 */
  recurringRemoved(itemId: string): AssistantSession {
    return this.mapMessages((m) => (m.type === "recurringRemove" && !m.removedIds.includes(itemId) ? { ...m, removedIds: [...m.removedIds, itemId] } : m)).note(c.recurring.removed);
  }

  /** 「그대로 둘게요」 — 삭제 버튼을 치운다 */
  keepRecurring(index: number): AssistantSession {
    return this.with(this.messages.map((m, i) => (i === index && m.type === "recurringRemove" ? { ...m, kept: true } : m)), this.phase);
  }

  /** 등록 전의 카드 종류(신용 · 체크)를 바꾼다 */
  setCardMethod(id: string, method: string): AssistantSession {
    return this.mapMessages((m) => (m.type === "cardDraft" && m.id === id && !m.registered ? { ...m, method } : m));
  }

  /** 카드를 등록했다 — 카드를 잠그고 「등록했어요. 이제 「○○」라고 적으면 알아볼게요」 */
  cardRegistered(id: string): AssistantSession {
    const card = this.messages.find((m) => m.type === "cardDraft" && m.id === id);
    if (card?.type !== "cardDraft") return this;
    return this.mapMessages((m) => (m.type === "cardDraft" && m.id === id ? { ...m, registered: true } : m)).note(cardRegistered(card.name));
  }

  private mapMessages(fn: (m: AssistantMessage) => AssistantMessage): AssistantSession {
    return this.with(this.messages.map(fn), this.phase);
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

/** 「자세히 보기」가 갈 화면: 하루는 달력의 그날, 달은 리포트, 주는 달력(이번 주가 다음 달에 걸치면 오늘이 든 달) */
const queryHref = ({ period, from, to }: RecordQuery, today: string): string => {
  if (period === "day") return `/app/calendar?month=${from.slice(0, 7)}&date=${from}`;
  if (period === "thisMonth" || period === "lastMonth") return `/app/report?month=${from.slice(0, 7)}`;
  return `/app/calendar?month=${(to > today ? today : to).slice(0, 7)}`;
};

/** 질문의 답: 답하지 않는 질문이면 안내, 그 기간에 기록이 없으면 안내, 아니면 숫자 한 줄(+ 그날 목록) */
const queryMessage = (reply: QueryReply, today: string): AssistantMessage => {
  if (reply.status === "rejected") return notice(c.query[reply.reason]);
  const { query, count, sum, items } = reply;
  if (count === 0) return notice(c.query.empty);
  const category = query.categoryId === null ? null : (CategoryCatalog.names[query.categoryId] ?? null);
  return { type: "answer", text: queryAnswer(query, count, sum, category, today), items, more: query.kind === "dayList" ? count - items.length : 0, href: queryHref(query, today) };
};

/** 카드를 등록하려는 말의 답: 이름이 없으면 안내, 20자를 넘으면 안내, 아니면 등록 카드 */
const cardMessages = (reply: CardReply, newId: () => string): AssistantMessage[] => {
  if (reply.tooLong) return [notice(c.cardDraft.nameTooLong)];
  if (reply.name === null) return [notice(c.cardDraft.needName)];
  return [notice(c.cardDraft.ask), { type: "cardDraft", id: newId(), name: reply.name, method: reply.method, registered: false }];
};

/** 고정지출에 대한 말의 답: 등록 카드 · 목록 · 삭제 확인 */
const recurringMessages = (reply: RecurringReply, newId: () => string): AssistantMessage[] => {
  if (reply.intent === "list") return reply.items.length ? [notice(c.recurring.list), { type: "recurringList", items: reply.items }] : [notice(c.recurring.empty)];
  if (reply.intent === "remove") {
    if (reply.found.length) return [notice(reply.found.length > 1 ? c.recurring.removeWhich : c.recurring.removeAsk), { type: "recurringRemove", candidates: reply.found, removedIds: [], kept: false }];
    // 못 찾았으면 목록을 보여 주고 거기서 고르게 한다
    if (!reply.all.length) return [notice(c.recurring.empty)];
    return [...(reply.query ? [notice(c.recurring.notFound)] : []), notice(c.recurring.list), { type: "recurringList", items: reply.all }];
  }
  if (!reply.cards.length) return [notice(reply.invalid > 0 ? c.invalidAmount : c.recurring.needAmount)];
  const cards = reply.cards.map((x): RecurringCard => ({ ...x.draft, id: newId(), dayOfMonth: x.dayOfMonth, registered: false }));
  const notes = [...(reply.unparsed.length ? [unparsedNote(reply.unparsed)] : []), ...(reply.invalid > 0 ? [c.invalidAmount] : [])];
  return [notice(c.recurring.ask), { type: "recurringDrafts", cards, notes }];
};
