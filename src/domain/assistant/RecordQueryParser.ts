import { CategoryCatalog } from "../record/CategoryCatalog";
import { AmountReader } from "./AmountReader";
import { RecordDateReader } from "./RecordDateReader";
import { RuleRecordParser } from "./RuleRecordParser";

// 대화로 물어보기 — 문장이 묻는 말이면 **무엇을 묻는지**만 읽는다 (앱 record_query_parser.dart에서 옮김, 80-record-assistant H).
// 여기에는 숫자(답)가 없다 — 계산은 답을 만드는 쪽이 기존 집계로 한다. 읽기만 한다: 저장 · 수정 · 삭제와 이어지지 않는다.
// 문장을 밖으로 보내지 않는다(OpenAI 호출 없음).

/** 기간의 지출 합계 · 카테고리 합계 · 그날 적은 것들 · 수입 합계 */
export type RecordQueryKind = "periodTotal" | "categoryTotal" | "dayList" | "incomeTotal";
/** 하루(오늘 · 어제 · 그저께 · 「11월 20일」 · 「3일 전」) 또는 주 · 달. 주는 월~일 */
export type RecordQueryPeriod = "day" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth";
/**
 * 묻는 말이지만 답하지 않는 이유.
 * futurePeriod: 내일 · 다음 주 · 다음 달 — 아직 오지 않은 기간.
 * unknownWord: 알아듣지 못한 낱말이 있다(사전에 없는 카테고리 등). **전체 합계로 바꿔 답하지 않는다** — 묻지 않은 숫자를 답하게 된다
 */
export type RecordQueryRejection = "futurePeriod" | "unknownWord";

export type RecordQuery = {
  kind: RecordQueryKind;
  period: RecordQueryPeriod;
  /** 기간의 첫날과 마지막 날('YYYY-MM-DD', 양 끝 포함). 하루면 둘이 같다 */
  from: string;
  to: string;
  /** categoryTotal일 때의 카테고리와 그 구분 */
  categoryId: string | null;
  categoryKind: string | null;
  /** 문장에 기간이 없어 이번 달로 읽었다 — 답에 기간을 밝혀야 한다 */
  periodAssumed: boolean;
};
export type RecordQueryResult = { type: "query"; query: RecordQuery } | { type: "rejected"; reason: RecordQueryRejection };

// ── 낱말 (앱과 같다) ──────────────────────────────────────────
/** 조회 낱말. 이 가운데 하나가 있으면 묻는 말이다 */
const QUERY_WORD = /얼마|뭐\s?썼|뭘\s?썼|뭐\s?샀|뭘\s?샀|지출|합계|수입|내역|적은\s?(?:거|것|게)/;
/** 「뭐 썼지」처럼 목록을 묻는 말 */
const LIST_WORD = /뭐\s?썼|뭘\s?썼|뭐\s?샀|뭘\s?샀|내역|적은\s?(?:거|것|게)/;
const INCOME_WORD = /수입|들어[온왔]|벌었|번\s?돈/;
/** 아직 오지 않은 기간 */
const FUTURE_WORD = /(?<![가-힣])(?:내일|모레|다음\s?주|다음\s?달|담\s?주|담\s?달|내년)/;

const JOSA = "(?:에는|에도|에서|동안|부터|까지|에|엔|은|는|의|도)?";
const RANGE_WORDS = {
  thisWeek: String.raw`(?:이번|금)\s?주${JOSA}`,
  lastWeek: String.raw`(?:지난|저번)\s?주${JOSA}`,
  thisMonth: String.raw`(?:이번\s?달|이달)${JOSA}`,
  lastMonth: String.raw`(?:지난|저번)\s?달${JOSA}`,
};
type RangeWord = keyof typeof RANGE_WORDS;
const has = (text: string, word: RangeWord): boolean => new RegExp(RANGE_WORDS[word]).test(text);
const cut = (text: string, word: RangeWord): string => text.replace(new RegExp(RANGE_WORDS[word], "g"), " ");

/** 묻는 말에 붙는 꾸밈말 · 어미 — 카테고리가 아니다. 낱말 단위로만 본다 */
const FILLER_TOKEN = new RegExp(
  "^(?:" +
    [
      "얼마(?:나|야|지|예요|에요|였지|였어|나요|인지|쯤)?",
      "(?:뭐|뭘|무엇을?)",
      "(?:썼|샀|나갔|들어왔|벌었|적었)(?:지|어|나|냐|니|어요|나요|는지|더라|을까|었지|었어)?",
      String.raw`(?:쓴|산|나간|들어온|번|적은)(?:\s?(?:거|것|게|돈|금액))?`,
      "(?:거|것|게|돈|금액)(?:야|지|예요|에요)?",
      "지출|합계|수입|내역|총|전체|전부|모두|다|좀|대충|지금|현재",
      "내가|나|내|우리|저|제가",
      String.raw`알려\s?(?:줘|주세요|줄래)?|보여\s?(?:줘|주세요|줄래)?|궁금(?:해|해요|한데)?`,
      "했(?:지|어|나|더라)|이야|야|지|요|은|는|이|가|을|를|에|에서|도|만",
    ].join("|") +
    ")$",
);
const MARKS = /[?!.,~…"'()[\]]+/g;
const TRAILING_JOSA = /(?:에서|으로|은|는|이|가|을|를|에|도|만|로)$/;

type Period = { period: RecordQueryPeriod; from: string; to: string; rest: string; assumed: boolean };
type Category = { id: string; kind: string };

export class RecordQueryParser {
  /**
   * [raw]가 묻는 말이면 무엇을 묻는지 읽는다. 아니면 null — 평소처럼 기록으로 정리한다. [today]는 실제 오늘('YYYY-MM-DD', Asia/Seoul).
   *
   * 묻는 말로 보는 조건
   * - **금액이 없다.** 금액이 있으면 언제나 기록이다(`이번 달 식비 30만원`).
   * - 조회 낱말(얼마 · 뭐 썼 · 지출 · 합계 · 수입 · 내역 …)이 있거나, 주 · 달 단위의 기간 낱말(`이번 주` `지난달`)이 있다 — `지난달 식비`도 묻는 말이다.
   *   하루 낱말(`어제`)만 있고 조회 낱말이 없는 문장은 금액을 빠뜨린 기록일 수 있어 묻는 말로 보지 않는다
   */
  static parse(raw: string, today: string): RecordQueryResult | null {
    // `11/20`은 날짜다 — 기록 파서와 같은 방식으로 먼저 바꿔 둔다
    const text = RecordDateReader.normalizeSlashDates(raw);
    if (AmountReader.read(text).length) return null;
    const hasRange = (Object.keys(RANGE_WORDS) as RangeWord[]).some((word) => has(text, word));
    if (!QUERY_WORD.test(text) && !hasRange) return null;
    if (FUTURE_WORD.test(text)) return { type: "rejected", reason: "futurePeriod" };
    const period = RecordQueryParser.period(text, today);
    return period ? RecordQueryParser.ask(text, period) : { type: "rejected", reason: "futurePeriod" };
  }

  /** 기간. 하루를 가리키는 말(`어제` `11월 20일` `이번 달 15일`)이 먼저다. 오늘보다 뒤의 날짜면 null */
  private static period(text: string, today: string): Period | null {
    const { date, rest } = RecordDateReader.read(text, today);
    if (date !== null) return date > today ? null : { period: "day", from: date, to: date, rest, assumed: false };
    const week = (period: "thisWeek" | "lastWeek", back: number): Period => {
      const from = RecordDateReader.addDays(RecordQueryParser.monday(today), -back);
      return { period, from, to: RecordDateReader.addDays(from, 6), rest: cut(rest, period), assumed: false };
    };
    if (has(rest, "thisWeek")) return week("thisWeek", 0);
    if (has(rest, "lastWeek")) return week("lastWeek", 7);
    const [year, month] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
    const first = (m: number): string => RecordDateReader.valid(year, m, 1, false)!;
    if (has(rest, "lastMonth")) return { period: "lastMonth", from: first(month - 1), to: RecordDateReader.addDays(first(month), -1), rest: cut(rest, "lastMonth"), assumed: false };
    // 기간을 적지 않았으면 이번 달로 읽는다. 답에 기간을 밝힌다
    return { period: "thisMonth", from: first(month), to: RecordDateReader.addDays(first(month + 1), -1), rest: cut(rest, "thisMonth"), assumed: !has(rest, "thisMonth") };
  }

  /** 그 주의 월요일 */
  private static monday(date: string): string {
    const weekday = new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay(); // 0 = 일요일
    return RecordDateReader.addDays(date, -((weekday + 6) % 7));
  }

  /** 남은 낱말에서 카테고리를 찾아 무엇을 묻는지 정한다. 기록과 같은 사전이다 */
  private static ask(text: string, { period, from, to, rest, assumed }: Period): RecordQueryResult {
    const query = (kind: RecordQueryKind, category: Category | null = null): RecordQueryResult => ({
      type: "query",
      query: { kind, period, from, to, categoryId: category?.id ?? null, categoryKind: category?.kind ?? null, periodAssumed: assumed },
    });
    const tokens = rest.replace(MARKS, " ").split(/\s+/).filter((t) => t && !FILLER_TOKEN.test(t));
    if (tokens.length) {
      const category = RecordQueryParser.category(tokens);
      if (category) return query("categoryTotal", category);
      // 수입을 묻는 말에 붙은 낱말(`들어온`)은 위에서 걸러지지 않았을 수 있다
      if (!INCOME_WORD.test(tokens.join(" "))) return { type: "rejected", reason: "unknownWord" };
    }
    if (INCOME_WORD.test(text)) return query("incomeTotal");
    // 목록은 하루만 보여 준다. 주 · 달의 「뭐 썼지」는 합계로 답한다
    return query(LIST_WORD.test(text) && period === "day" ? "dayList" : "periodTotal");
  }

  /** 카테고리 이름을 그대로 적은 것(`식비` `교통`)이 가장 분명하다. 그다음이 낱말 사전이다(`커피` → 카페) */
  private static category(tokens: string[]): Category | null {
    const named = RecordQueryParser.categoryByName(tokens);
    if (named) return { id: named, kind: CategoryCatalog.kindOf(named)! };
    const match = RuleRecordParser.classifyText(tokens.join(" "));
    return match && match.categoryId !== null ? { id: match.categoryId, kind: match.kind } : null;
  }

  /** 낱말 가운데 카테고리 이름과 같은 것을 찾는다. `마트·생필품`은 `마트`로도 `생필품`으로도 찾는다. 조사가 붙어 있어도 된다(`식비는`) */
  private static categoryByName(tokens: string[]): string | null {
    for (const token of tokens) {
      for (const word of new Set([token, token.replace(TRAILING_JOSA, "")])) {
        if (!word) continue;
        const found = CategoryCatalog.all.find((id) => CategoryCatalog.names[id] === word || CategoryCatalog.names[id].split(/[·/]/).includes(word));
        if (found) return found;
      }
    }
    return null;
  }
}
