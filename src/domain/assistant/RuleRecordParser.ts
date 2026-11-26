import { CategoryCatalog } from "../record/CategoryCatalog";
import type { RecordKind } from "../record/RecordEntry";
import { AmountReader, type AmountSpan } from "./AmountReader";
import type { KnownCard, ParsedDraft, ParseResult } from "./ParsedDraft";
import { RecordDateReader } from "./RecordDateReader";
import { CATEGORY_KEYWORDS, GAVE_WORDS, KIND_ONLY_KEYWORDS, NOT_PAYMENT_WORDS, PAYMENT_SUFFIXES, PLACE_FIRST_CATEGORIES } from "./recordKeywords";

// 규칙 기반 파서 (앱 rule_record_parser.dart에서 옮김). 네트워크 · 저장 · 로그가 없다.
//
// 순서: 조각으로 끊기 → 금액 읽기 → 구분 → 카테고리 → 결제수단 · 카드 이름 → 내용.
// 규칙은 문장 세트(fixtures/*.json)가 정한다. 규칙을 바꾸면 sentences.test.ts의 결과가 함께 바뀐다.
//
// 값의 범위는 여기서 보장하지 않는다. 0원 · 1조원도 그대로 내보내고 검증기(DraftValidator)가 버린다.

type Match = { kind: string; categoryId: string | null; start: number; length: number };
type Chunk = { line: string; from: number; to: number };

// 쉼표 · 빗금 · 쌍반점 · 가운뎃점, 그리고 숫자가 이어지지 않는 마침표
const DELIMITER = /[,，、/;·。]|\.(?!\d)/g;
// 금액에 붙여 쓴 조사 · 접미사(`4500원이랑`, `9천원을`, `2만원짜리`)는 내용이 아니다
const PARTICLE = /^(?:짜리|어치|이랑|랑|하고|을|를|은|는|이|가|에|도|씩|쯤)(?=\s|$)/;
const EDGE = /^[\s\-–—~:·()[\]"'.,]+|[\s\-–—~:·()[\]"'.,]+$/g;
const LEADING_JOIN = /^(?:이랑|랑|하고|그리고|및)\s+/;
const SPACES = /\s+/g;
const GAVE = new RegExp(`^(?:${GAVE_WORDS.join("|")})\\S*$`);

const end = (m: Match): number => m.start + m.length;
const trimPiece = (raw: string): string => raw.replace(SPACES, " ").replace(EDGE, "");

/** 문장을 읽어 가며 「지금 날짜」를 들고 다닌다. 날짜는 한 번 나오면 뒤 항목이 이어받는다(`어제 점심 9천원, 커피 4500원`) */
class DateCursor {
  /** 지금까지 읽은 날짜. null이면 아직 날짜를 적지 않았다 — 화면 날짜로 저장한다 */
  current: string | null = null;

  constructor(private readonly today: string) {}

  /** [text]에 날짜가 있으면 current를 바꾸고, 날짜 표현을 걷어 낸 글자를 돌려준다 */
  take(text: string): string {
    const read = RecordDateReader.read(text, this.today);
    if (read.date !== null) this.current = read.date;
    return read.rest;
  }
}

export class RuleRecordParser {
  private readonly cards: KnownCard[];

  /** [cards]는 등록된 카드. 긴 이름부터 본다 — `삼성카드 taptap`이 `삼성카드`에 먼저 걸리지 않게 */
  constructor(cards: readonly KnownCard[] = []) {
    this.cards = [...cards].sort((a, b) => b.name.length - a.name.length);
  }

  /** [today]는 실제 오늘('YYYY-MM-DD', Asia/Seoul) — `어제` `3일 전`을 읽는 기준이다(화면 날짜가 아니다) */
  parse(text: string, today: string): ParseResult {
    const result: ParseResult = { drafts: [], unparsed: [] };
    const dates = new DateCursor(today);
    // 빗금은 조각을 끊는 기호다 — `11/20`은 끊기 전에 날짜로 바꿔 둔다
    for (const line of text.split("\n")) this.parseLine(RecordDateReader.normalizeSlashDates(line), result, dates);
    return result;
  }

  /** 한 줄을 쉼표 · 빗금 같은 구분 기호에서 끊는다. 금액 속의 쉼표 · 점(`4,500` `1.2만`)은 끊지 않는다 */
  static splitPieces(line: string): string[] {
    const spans = AmountReader.read(line);
    const pieces: string[] = [];
    let from = 0;
    for (const m of line.matchAll(DELIMITER)) {
      if (spans.some((s) => s.start <= m.index && m.index < s.end)) continue;
      pieces.push(line.slice(from, m.index));
      from = m.index + m[0].length;
    }
    pieces.push(line.slice(from));
    return pieces;
  }

  private parseLine(line: string, result: ParseResult, dates: DateCursor): void {
    const spans = AmountReader.read(line);
    let from = 0;
    for (const m of line.matchAll(DELIMITER)) {
      // `4,500`의 쉼표와 `1.2만`의 점은 금액의 일부다
      if (spans.some((s) => s.start <= m.index && m.index < s.end)) continue;
      this.parseChunk({ line, from, to: m.index }, spans, result, dates);
      from = m.index + 1;
    }
    this.parseChunk({ line, from, to: line.length }, spans, result, dates);
  }

  private parseChunk({ line, from, to }: Chunk, all: AmountSpan[], result: ParseResult, dates: DateCursor): void {
    if (from >= to) return;
    const inChunk = all.filter((s) => s.start >= from && s.end <= to);
    // 단위가 붙은 금액이 있으면 단위 없는 숫자는 내용이다(`아이폰 15 케이스 2만원`)
    const withUnit = inChunk.filter((s) => s.hasUnit);
    const amounts = withUnit.length ? withUnit : inChunk;
    if (!amounts.length) {
      // 금액 없이 날짜만 적은 조각(`어제, 커피 만원`)은 뒤 항목의 날짜다.
      // 알아듣지 못했다고 알릴 때는 적은 그대로 보여 준다(날짜 낱말을 빼지 않는다)
      const chunk = line.slice(from, to);
      if (trimPiece(dates.take(chunk))) result.unparsed.push(trimPiece(chunk));
      return;
    }
    for (const [amount, text] of this.itemsOf({ line, from, to }, amounts)) {
      // 이 건의 글자에 날짜가 있으면 여기서부터 그 날짜다. 없으면 앞의 날짜를 이어받는다
      const rest = dates.take(text);
      result.drafts.push({ ...this.draft(amount, rest), date: dates.current });
    }
  }

  /** 금액이 나올 때마다 한 건이다. 금액이 맨 앞에 오는 문장(`4500원 커피 9000원 점심`)은 금액 **뒤** 글자가 그 건의 내용이다 */
  private itemsOf({ line, from, to }: Chunk, amounts: AmountSpan[]): [number, string][] {
    const amountFirst = amounts.length > 1 && !line.slice(from, amounts[0].start).trim();
    return amounts.map((a, i) => {
      const isLast = i === amounts.length - 1;
      let before = "";
      let after: string;
      if (amountFirst) {
        after = line.slice(a.end, isLast ? to : amounts[i + 1].start);
      } else {
        before = line.slice(i === 0 ? from : amounts[i - 1].end, a.start);
        // 마지막 금액 뒤에 남은 글자(`… 체크카드`)는 마지막 건에 붙는다
        after = isLast ? line.slice(a.end, to) : "";
      }
      return [a.value, `${before} ${after.replace(PARTICLE, "")}`];
    });
  }

  // ── 한 건 만들기 ──────────────────────────────────────

  private draft(amount: number, rawText: string): Omit<ParsedDraft, "date"> {
    // 1. 등록한 카드 이름
    const { card, text } = this.takeCard(rawText);
    // 2. 구분 · 카테고리
    const match = RuleRecordParser.classify(text);
    const kind = (match?.kind ?? "expense") as RecordKind;
    // 3. 결제수단 낱말
    const { method, kept } = RuleRecordParser.takePayment(text, match, card?.method ?? null);
    const isExpense = kind === "expense";
    return {
      kind,
      amount,
      categoryId: match?.categoryId ?? null,
      title: RuleRecordParser.title(kept.join(" ")),
      paymentMethod: isExpense ? method : null,
      cardName: isExpense ? (card?.name ?? null) : null,
    };
  }

  private takeCard(text: string): { card: KnownCard | null; text: string } {
    for (const card of this.cards) {
      const name = card.name.trim();
      const at = name ? text.indexOf(name) : -1;
      if (at >= 0) return { card, text: `${text.slice(0, at)} ${text.slice(at + name.length)}` };
    }
    return { card: null, text };
  }

  /** 결제수단 낱말은 내용에서 뺀다. 카테고리 낱말의 일부(`교통카드`, `카드 대금`)면 건드리지 않는다 */
  private static takePayment(text: string, match: Match | null, cardMethod: string | null): { method: string | null; kept: string[] } {
    let method = cardMethod;
    const kept: string[] = [];
    let cursor = 0;
    for (const token of text.split(/\s+/)) {
      const at = text.indexOf(token, cursor);
      cursor = at + token.length;
      if (!token) continue;
      const pay = RuleRecordParser.paymentOf(token);
      const partOfKeyword = match !== null && match.start >= 0 && at < end(match) && match.start < cursor;
      if (pay !== null && !partOfKeyword) method ??= pay;
      else kept.push(token);
    }
    return { method, kept };
  }

  private static paymentOf(token: string): string | null {
    if (NOT_PAYMENT_WORDS.includes(token)) return null;
    return PAYMENT_SUFFIXES.find(([suffix]) => token.endsWith(suffix))?.[1] ?? null;
  }

  // ── 구분 · 카테고리 ─────────────────────────────────────

  /**
   * 구분을 먼저 정하고 그 구분 안에서 카테고리를 찾는다.
   * 수입 · 상환 · 저축 낱말이 하나라도 있으면 그 구분이다(`보험 환급`은 수입).
   * 없으면 지출이고, 카테고리 낱말도 없으면 비워 둔다 — 「기타」로 채우지 않는다
   */
  private static classify(text: string): Match | null {
    const lower = text.toLowerCase();
    const tokens = lower.split(/\s+/).filter(Boolean);
    const found = RuleRecordParser.findKeywords(lower, tokens);
    if (!found.length) return null;
    const nonExpense = found.filter((m) => m.kind !== "expense");
    if (!nonExpense.length) return RuleRecordParser.bestExpense(found);
    const kind = RuleRecordParser.best(nonExpense)!.kind;
    // `엄마 용돈 드림` — 수입 낱말이 있어도 준 돈이면 지출이다. 수입과 지출이 뒤바뀌면 합계가 틀어진다.
    // 카테고리는 지출 낱말이 따로 없으면 비워 둔다
    if (kind === "income" && tokens.some((t) => GAVE.test(t))) return RuleRecordParser.bestExpense(found.filter((m) => m.kind === "expense"));
    const inKind = found.filter((m) => m.kind === kind);
    return RuleRecordParser.best(inKind.filter((m) => m.categoryId !== null)) ?? RuleRecordParser.best(inKind);
  }

  /**
   * [text]에서 구분과 카테고리를 읽는다 — 기록 초안을 만들 때와 **같은 사전, 같은 규칙**이다. 낱말을 찾지 못하면 null.
   * 대화로 물어보기가 「이번 달 카페 얼마」의 카테고리를 읽는 데 쓴다(사전을 따로 두면 기록과 질문이 같은 낱말을 다르게 읽는다)
   */
  static classifyText(text: string): { kind: string; categoryId: string | null } | null {
    const match = RuleRecordParser.classify(text);
    return match && { kind: match.kind, categoryId: match.categoryId };
  }

  private static findKeywords(lower: string, tokens: string[]): Match[] {
    const found: Match[] = [];
    const look = (keyword: string, kind: string, categoryId: string | null): void => {
      if (keyword.startsWith("=")) {
        const word = keyword.slice(1);
        if (tokens.includes(word)) found.push({ kind, categoryId, start: lower.indexOf(word), length: word.length });
        return;
      }
      const at = lower.indexOf(keyword);
      if (at >= 0) found.push({ kind, categoryId, start: at, length: keyword.length });
    };
    for (const [id, words] of Object.entries(CATEGORY_KEYWORDS)) {
      const kind = CategoryCatalog.kindOf(id);
      if (kind !== null) for (const w of words) look(w, kind, id);
    }
    for (const [kind, words] of Object.entries(KIND_ONLY_KEYWORDS)) for (const w of words) look(w, kind, null);
    return found;
  }

  private static bestExpense(matches: Match[]): Match | null {
    return RuleRecordParser.best(matches.filter((m) => m.categoryId !== null && PLACE_FIRST_CATEGORIES.includes(m.categoryId))) ?? RuleRecordParser.best(matches);
  }

  /** 긴 낱말이 이기고, 길이가 같으면 앞에 나온 낱말이 이긴다 */
  private static best(matches: Match[]): Match | null {
    let best: Match | null = null;
    for (const m of matches) {
      if (best === null || m.length > best.length || (m.length === best.length && m.start < best.start)) best = m;
    }
    return best;
  }

  // ── 내용 ──────────────────────────────────────────────

  private static title(raw: string): string | null {
    const t = trimPiece(raw).replace(LEADING_JOIN, "").trim();
    return t || null;
  }
}
