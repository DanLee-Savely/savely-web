import { type AssistantUsage, type DraftOrganizer, OrganizeFailedError, type OrganizeRequest, type OrganizeResult, type RequestLimiter } from "@/domain/assistant/DraftOrganizer";
import { CheckedRecordParser, type CheckedParseResult, DRAFT_LIMITS, DraftValidator } from "@/domain/assistant/DraftValidator";
import { HelpRequest } from "@/domain/assistant/HelpRequest";
import type { KnownCard, ParsedDraft } from "@/domain/assistant/ParsedDraft";
import { RuleRecordParser } from "@/domain/assistant/RuleRecordParser";
import { CardCommandParser } from "@/domain/card/CardCommandParser";
import type { CardRepository } from "@/domain/card/OwnedCard";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import type { Clock } from "@/domain/record/Clock";
import { RecordDate } from "@/domain/record/RecordDate";
import { RecurringCommandParser, type RecurringDraft } from "@/domain/recurring/RecurringCommandParser";
import type { RecurringItemData, RecurringItemRepository } from "@/domain/recurring/RecurringItem";

/** 초안 한 건. ai는 OpenAI가 만들었거나 카테고리를 채운 것 — 카드에 「AI가 정리」를 붙인다(U-W2) */
export type InterpretedDraft = ParsedDraft & { ai: boolean };
export type InterpretResult = Omit<CheckedParseResult, "drafts"> & { drafts: InterpretedDraft[] };
/** assumeRegister: 고정지출 최초 질문이 떠 있는 동안 — 낱말이 없어도 금액과 나가는 날이 함께 있으면 등록으로 읽는다 */
export type InterpretCommand = { text: string; screenDate: string; ip: string; assumeRegister?: boolean };

/** 고정지출에 대한 말의 답. 여기서는 읽기만 한다 — 등록 · 삭제는 화면의 버튼을 눌러야 일어난다 */
export type RecurringReply =
  /** 등록 카드(검증을 통과한 것). cards가 비었으면 금액을 찾지 못했거나(invalid 0) 금액이 한도 밖이다 */
  | { intent: "register"; cards: RecurringDraft[]; unparsed: string[]; invalid: number }
  | { intent: "list"; items: RecurringItemData[] }
  /** 지울 항목 후보. found가 비었으면 목록(all)을 보여 주고 거기서 고르게 한다 */
  | { intent: "remove"; query: string; found: RecurringItemData[]; all: RecurringItemData[] };
/** 카드를 등록하려는 말의 답. name이 null이면 이름을 찾지 못한 것, tooLong이면 20자를 넘은 것 */
export type CardReply = { name: string | null; method: string; tooLong: boolean };

/** 문장 한 번의 결과 — 읽는 순서대로 먼저 걸린 것 하나 */
export type InterpretOutcome =
  | { type: "help" }
  | { type: "recurring"; reply: RecurringReply }
  | { type: "card"; reply: CardReply }
  | { type: "drafts"; result: InterpretResult };

/** 바깥 도우미(OpenAI) 쪽 준비물. 키가 없으면 organizer가 null이다 — 규칙만으로 정리한다 */
export type AssistantAi = {
  organizer: DraftOrganizer | null;
  /** 같은 IP의 호출 제한(§7) */
  limiter: RequestLimiter;
  usage: AssistantUsage;
  /** 하루 전체 호출 상한(Asia/Seoul 날짜) */
  dailyLimit: number;
  /** 정리 실패를 알릴 곳(로그). 이유 코드만 받는다 */
  onFailure: (failure: string) => void;
  /** 호출 한 번이 쓴 토큰 수를 알릴 곳(로그). 숫자만 받는다 */
  onUsage: (input: number, output: number) => void;
};

// 문장 한 번을 기록 초안으로 정리한다 (80-record-assistant §2).
// 읽는 순서는 앱과 같다: ① 도움말 → ② 고정지출 → ③ 카드 등록 → ④ 기록 규칙 파서 → ⑤ 읽지 못한 부분만 OpenAI → ⑥ 검증기.
// ① ~ ③은 규칙으로만 읽는다(앱과 같다) — OpenAI로 보내지 않는다.
// OpenAI는 보조다 — 규칙이 읽은 부분은 보내지 않고, 실패 · 한도 · 잔액 소진이면 ⑤를 건너뛴다(사용자에게 보이는 결과는 규칙만 쓴 것과 같다).
// 입력 문장을 로그 · 오류에 싣지 않는다 — 실패는 ParseFailedError(이유 코드)로만 알린다
export class InterpretSentenceService {
  private readonly validator: DraftValidator;

  constructor(
    private readonly clock: Clock,
    private readonly ai: AssistantAi,
    private readonly cards: CardRepository,
    private readonly recurring: RecurringItemRepository,
  ) {
    this.validator = new DraftValidator(clock);
  }

  async execute(command: InterpretCommand): Promise<InterpretOutcome> {
    const { text } = command;
    // ① 도움말
    if (HelpRequest.matches(text)) return { type: "help" };
    // 등록한 카드 — 문장에 이름이 그대로 있으면 카드 이름을 채운다
    const known: KnownCard[] = (await this.cards.list()).map((c) => ({ name: c.name, method: c.method }));
    const parser = new RuleRecordParser(known);
    // 길이 한도를 넘은 문장은 ④가 안내한다
    if (this.validator.acceptsInput(text)) {
      // ② 고정지출 → ③ 카드 등록. 「카드값 80만원 매월 14일 고정지출 추가」는 고정지출이다
      const recurring = await this.recurringReply(command, parser);
      if (recurring) return { type: "recurring", reply: recurring };
      const card = InterpretSentenceService.cardReply(text.trim());
      if (card) return { type: "card", reply: card };
    }
    // ④ 기록 → ⑤ 읽지 못한 부분만 OpenAI → ⑥ 검증기
    return { type: "drafts", result: await this.drafts(command, parser, known.map((c) => c.name)) };
  }

  private async recurringReply({ text, assumeRegister }: InterpretCommand, parser: RuleRecordParser): Promise<RecurringReply | null> {
    const command = new RecurringCommandParser(parser).parse(text.trim(), RecordDate.today(this.clock), assumeRegister === true);
    if (!command) return null;
    if (command.intent === "list") return { intent: "list", items: await this.recurring.list() };
    if (command.intent === "remove") {
      const all = await this.recurring.list();
      return { intent: "remove", query: command.query, found: RecurringCommandParser.findByName(command.query, all), all };
    }
    const checked = command.items.slice(0, DRAFT_LIMITS.maxDrafts).map((i) => ({ draft: this.validator.validateOne({ ...i.draft, date: null }), dayOfMonth: i.dayOfMonth }));
    const cards = checked.flatMap((c) => (c.draft ? [{ draft: c.draft, dayOfMonth: c.dayOfMonth }] : []));
    // 알아듣지 못한 조각은 입력 문장에 실제로 있는 글자만 남긴다
    const unparsed = command.unparsed.map((p) => p.trim()).filter((p) => p && text.includes(p));
    return { intent: "register", cards, unparsed, invalid: checked.length - cards.length };
  }

  private static cardReply(text: string): CardReply | null {
    const command = CardCommandParser.parse(text);
    if (!command) return null;
    if (!command.name) return { name: null, method: command.method, tooLong: false };
    const name = DraftValidator.cleanCardName(command.name);
    return { name, method: command.method, tooLong: name === null };
  }

  private async drafts({ text, screenDate, ip }: InterpretCommand, parser: RuleRecordParser, cardNames: string[]): Promise<InterpretResult> {
    const ruled = new CheckedRecordParser(parser, this.validator, this.clock).parse(text);
    const base: InterpretResult = { ...ruled, drafts: ruled.drafts.map((d) => ({ ...d, ai: false })) };
    const request = this.requestFor(base, screenDate, cardNames);
    const organized = request && (await this.organize(request, ip));
    return organized ? this.merge(base, request, organized) : base;
  }

  /** OpenAI에 보낼 것: 읽지 못한 조각 + 내용은 있는데 카테고리가 빈 초안. 없으면 null — 부르지 않는다 */
  private requestFor(base: InterpretResult, screenDate: string, cardNames: string[]): OrganizeRequest | null {
    const items = base.drafts.filter((d) => d.categoryId === null && d.title !== null).map((d) => ({ kind: d.kind, title: d.title! }));
    if (!base.unparsed.length && !items.length) return null;
    return { today: RecordDate.today(this.clock), screenDate, pieces: base.unparsed, items, cardNames };
  }

  /** 요청 제한 → 하루 상한 → 호출. 어느 하나라도 막히거나 실패하면 null(규칙 결과만 쓴다) */
  private async organize(request: OrganizeRequest, ip: string): Promise<OrganizeResult | null> {
    const { organizer, limiter, usage, dailyLimit, onFailure, onUsage } = this.ai;
    try {
      if (!organizer || !(await limiter.allow(ip)) || !(await usage.tryUse(request.today, dailyLimit))) return null;
      const organized = await organizer.organize(request);
      if (organized.usage) onUsage(organized.usage.input, organized.usage.output);
      return organized;
    } catch (e) {
      // 오류 내용에는 문장이 섞일 수 있다 — 이유 코드나 종류만 넘긴다
      onFailure(e instanceof OrganizeFailedError ? e.failure : e instanceof Error ? e.name : typeof e);
      return null;
    }
  }

  /** OpenAI 출력은 믿지 않는다 — 초안은 규칙 초안과 같은 검증기로, 카테고리는 구분과 맞을 때만 받는다(§6-4) */
  private merge(base: InterpretResult, request: OrganizeRequest, organized: OrganizeResult): InterpretResult {
    const drafts = this.withCategories(base.drafts, organized);
    const solved = new Set<number>();
    for (const { piece, draft } of organized.drafts) {
      if (drafts.length >= DRAFT_LIMITS.maxDrafts) break;
      if (!Number.isInteger(piece) || piece < 0 || piece >= request.pieces.length) continue;
      // 카드 이름은 등록된 카드와 같을 때만 남긴다
      const checked = this.validator.validateOne({ ...draft, cardName: draft.cardName !== null && request.cardNames.includes(draft.cardName) ? draft.cardName : null });
      if (!checked) continue;
      drafts.push({ ...checked, ai: true });
      solved.add(piece);
    }
    return { ...base, drafts, unparsed: request.pieces.filter((_, i) => !solved.has(i)) };
  }

  private withCategories(drafts: InterpretedDraft[], organized: OrganizeResult): InterpretedDraft[] {
    const targets = drafts.filter((d) => d.categoryId === null && d.title !== null);
    const picked = new Map(organized.categories.map((c) => [targets[c.item], c.categoryId]));
    return drafts.map((d) => {
      const id = picked.get(d);
      return typeof id === "string" && CategoryCatalog.kindOf(id) === d.kind ? { ...d, categoryId: id, ai: true } : d;
    });
  }
}
