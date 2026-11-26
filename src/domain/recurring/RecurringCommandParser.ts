import { AmountReader } from "../assistant/AmountReader";
import type { ParsedDraft } from "../assistant/ParsedDraft";
import { RuleRecordParser } from "../assistant/RuleRecordParser";

// 고정지출 · 고정수입에 대한 말 — 등록 · 삭제 · 보기 (앱 recurring_command_parser.dart에서 옮김, 80-record-assistant C)
// 여기서는 **무엇을 하려는 말인지 읽기만** 한다. 등록 정보는 건드리지 않는다. 실제 등록 · 삭제는 화면의 버튼을 눌러야 일어난다.

/** 고정지출 · 고정수입의 한도 */
export const RECURRING_LIMITS = { maxItems: 30, minDay: 1, maxDay: 31 } as const;

/** 등록 카드의 초안. 아직 검증 전이다 */
export type RecurringDraft = {
  /** 이름(title) · 금액 · 구분 · 카테고리 · 결제수단. 이름은 비어 있을 수 있다 */
  draft: ParsedDraft;
  /** 매달 나가는 날. 문장에 없으면 null — 등록 카드에서 고른다 */
  dayOfMonth: number | null;
};

export type RecurringCommand =
  /** 등록하려는 말. items가 비었으면 금액을 찾지 못한 것이다 — 금액을 함께 적어 달라고 안내한다 */
  | { intent: "register"; items: RecurringDraft[]; unparsed: string[] }
  /** 지우려는 말. query는 이름을 찾을 글자다(비어 있을 수 있다 — 그때는 목록을 보여 준다) */
  | { intent: "remove"; query: string }
  /** 등록한 항목을 보려는 말 */
  | { intent: "list" };

const JOSA = "(?:에서|으로|로|에|을|를|은|는|이|가|도)?";
// 「고정지출」 · 「고정수입」. 띄어 써도 받는다
const FIXED_EXPENSE = new RegExp(String.raw`고정\s?지출${JOSA}`, "g");
const FIXED_INCOME = new RegExp(String.raw`고정\s?수입${JOSA}`, "g");
// 「매달」 · 「매월」. 뒤에 붙는 꾸밈말(`매달 나가는`)은 이름이 아니다
const MONTHLY = /(?:매달|매월)(?:마다)?(?:\s*(?:내는|나가는|들어오는|받는|빠지는))?/g;
// 지우려는 말. 「빼빼로」처럼 이름 속에 든 글자는 잡지 않는다
const REMOVE_WORD = /삭제|지워|지우|없애|해지|취소|빼\s?(?:줘|주|자|기|고|요)|빼(?=\s|$)|뺄|뺐/;
// 보려는 말
const LIST_WORD = /보여|목록|리스트|확인|조회|알려|뭐/g;
// 문장 끝에 붙는 부탁 · 꾸밈말 — 이름이 아니다. 낱말 한가운데는 건드리지 않는다(「빼빼로」「추가요금」은 이름이다)
const FILLER = new RegExp(
  String.raw`(?<![가-힣])(?:삭제|해지|취소|등록|추가|확인|조회)(?:해\s?줘요?|해\s?주세요|할게요?|할래요?|해요?|하기)?(?![가-힣])` +
    String.raw`|(?<![가-힣])(?:지워|없애|넣어|보여|알려|빼)\s?(?:줘요?|주세요|줄래요?)?(?![가-힣])` +
    String.raw`|(?<![가-힣])(?:좀|이제|더는|더 이상)(?=\s|$)`,
  "g",
);
// 나가는 날 — `15일` `25일에` `매달 1일마다` `말일` `월말`.
// 기록 날짜로 쓰는 표현(`11월 20일` `이번 달 15일` `3일 전`)의 날은 나가는 날이 아니다
const DAY_WORD = /(?<!\d\s?월\s?)(?<!(?:이번|지난|저번)\s?달\s?)(?<!\d)(\d{1,2})\s?일(?!\s?전)(?:에|마다|날)?(?![가-힣])/g;
const LAST_DAY_WORD = /(?:말일|월말)(?:에|마다)?/g;
const SPACES = /\s+/g;
const EDGE_MARKS = /^[\s\-–—~:·()[\]"'.,?!]+|[\s\-–—~:·()[\]"'.,?!]+$/g;
const TRAILING_JOSA = /(?:은|는|을|를|이|가|도)$/;

const has = (pattern: RegExp, text: string): boolean => new RegExp(pattern.source).test(text);
const validDay = (day: number): boolean => day >= RECURRING_LIMITS.minDay && day <= RECURRING_LIMITS.maxDay;

/** 같은 이름인지 견줄 때 쓰는 꼴 — 빈칸을 하나로 줄이고 영문 대소문자를 무시한다 */
export const recurringNameKey = (title: string): string => title.replace(SPACES, " ").trim().toLowerCase();

export class RecurringCommandParser {
  constructor(private readonly parser: RuleRecordParser) {}

  /**
   * [text]가 고정지출 · 고정수입에 대한 말이면 무엇을 하려는지 읽는다. 아니면 null — 평소처럼 기록으로 정리한다.
   * 조건: 문장에 「고정지출」 · 「고정수입」 · 「매달」 · 「매월」이 있을 때.
   * [assumeRegister]를 켜면(최초 질문이 떠 있는 동안) 그 낱말이 없어도 **금액과 나가는 날이 함께 있는** 문장을 등록으로 읽는다(「월세 50만원 25일」)
   */
  parse(text: string, today: string, assumeRegister = false): RecurringCommand | null {
    const hasFixed = has(FIXED_EXPENSE, text) || has(FIXED_INCOME, text);
    const hasMonthly = has(MONTHLY, text);
    const hasAmount = AmountReader.read(RecurringCommandParser.stripWords(text)).length > 0;
    if (!hasFixed && !hasMonthly && !(assumeRegister && RecurringCommandParser.dayOf(text) !== null && hasAmount)) return null;
    // 1. 삭제 — 금액이 함께 있어도 지우려는 말이 먼저다
    if ((hasFixed || hasMonthly) && REMOVE_WORD.test(text)) return { intent: "remove", query: RecurringCommandParser.nameQuery(text) };
    // 2. 보기 — 「고정지출」만 적었거나 보여 달라는 말이 있을 때
    if (hasFixed && !hasAmount && (has(LIST_WORD, text) || !RecurringCommandParser.nameQuery(text.replace(LIST_WORD, " ")))) return { intent: "list" };
    // 3. 등록. 「매달」만 있고 금액이 없는 말(`매달 힘들다`)은 고정지출 이야기가 아니다
    if (!hasAmount) return hasFixed ? { intent: "register", items: [], unparsed: [] } : null;
    return this.register(text, today, has(FIXED_INCOME, text));
  }

  private register(text: string, today: string, asIncome: boolean): RecurringCommand {
    const items: RecurringDraft[] = [];
    const unparsed: string[] = [];
    for (const piece of text.split("\n").flatMap((line) => RuleRecordParser.splitPieces(line))) {
      const day = RecurringCommandParser.dayOf(piece);
      const parsed = this.parser.parse(RecurringCommandParser.stripWords(piece), today);
      const last = items.at(-1);
      // 금액 없이 날만 적은 조각(`…, 매달 25일`)은 바로 앞 항목의 날이다
      if (!parsed.drafts.length && day !== null && last && last.dayOfMonth === null) last.dayOfMonth = day;
      for (const d of parsed.drafts) items.push({ draft: asIncome ? RecurringCommandParser.asIncome(d) : d, dayOfMonth: day });
      unparsed.push(...parsed.unparsed);
    }
    return { intent: "register", items, unparsed };
  }

  /** 「고정수입」이라고 적었으면 수입이다. 파서가 지출로 읽었으면 수입으로 맞추고, 지출 카테고리 · 결제수단은 비운다 */
  private static asIncome(d: ParsedDraft): ParsedDraft {
    return d.kind !== "expense" ? d : { kind: "income", amount: d.amount, title: d.title, categoryId: null, paymentMethod: null, cardName: null, date: null };
  }

  /** 조각에서 나가는 날을 읽는다. 1~31 밖의 숫자(`40일`)는 날이 아니다 */
  private static dayOf(piece: string): number | null {
    if (has(LAST_DAY_WORD, piece)) return RECURRING_LIMITS.maxDay;
    for (const m of piece.matchAll(DAY_WORD)) if (validDay(Number(m[1]))) return Number(m[1]);
    return null;
  }

  /** 고정지출 이야기를 하느라 붙인 낱말(「고정지출」 · 「매달」 · 나가는 날 · 「등록해줘」)을 걷어 낸다. 남은 것이 이름과 금액이다 */
  private static stripWords(text: string): string {
    return text
      .replace(FIXED_EXPENSE, " ")
      .replace(FIXED_INCOME, " ")
      .replace(MONTHLY, " ")
      .replace(LAST_DAY_WORD, " ")
      // 날이 아닌 숫자(`40일`)는 그대로 둔다
      .replace(DAY_WORD, (whole, day: string) => (validDay(Number(day)) ? " " : whole))
      .replace(FILLER, " ");
  }

  /** 삭제 · 보기 문장에서 이름을 찾을 글자만 남긴다 — 금액도 걷어 낸다 */
  private static nameQuery(text: string): string {
    let rest = RecurringCommandParser.stripWords(text);
    for (const s of AmountReader.read(rest).reverse()) rest = `${rest.slice(0, s.start)} ${rest.slice(s.end)}`;
    return rest.replace(SPACES, " ").replace(EDGE_MARKS, "").trim();
  }

  /**
   * [query]가 가리키는 등록 항목을 찾는다.
   * - 등록한 이름이 query에 통째로 들어 있으면 그 항목(들)이다 — 긴 이름부터
   * - 그런 항목이 없으면 이름에 query가 들어 있는 항목을 모두 돌려준다(`넷플` → `넷플릭스`). 여럿이면 화면이 고르게 한다
   * - 띄어쓰기와 영문 대소문자는 무시한다. 한 글자로는 찾지 않는다
   */
  static findByName<T extends { title: string }>(query: string, items: readonly T[]): T[] {
    const squash = (s: string) => recurringNameKey(s).replaceAll(" ", "");
    const q = squash(query);
    if (!q) return [];
    const whole = items.filter((i) => q.includes(squash(i.title))).sort((a, b) => squash(b.title).length - squash(a.title).length);
    if (whole.length) {
      // `넷플릭스 프리미엄`이 있으면 그 안에 든 `넷플릭스`는 같은 말을 두 번 센 것이다
      const longest = squash(whole[0].title);
      return whole.filter((i) => squash(i.title) === longest || !longest.includes(squash(i.title)));
    }
    // 조사가 붙은 채로(`통신비는`) 못 찾았으면 조사를 떼고 한 번 더 본다
    for (const part of new Set([q, q.replace(TRAILING_JOSA, "")])) {
      if (part.length < 2) continue;
      const partial = items.filter((i) => squash(i.title).includes(part));
      if (partial.length) return partial;
    }
    return [];
  }
}
