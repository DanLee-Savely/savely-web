// 문장에서 금액 표현을 찾는다 — 규칙 기반 파서의 첫 단계 (앱 record_amount_reader.dart에서 옮김)
//
// 받는 표기
// - 단위가 붙은 숫자: `4500원` `9천` `1만5천원` `18만 2천원` `1.2만원` `1억 2천만원`
// - 「원」으로 끝나는 한글 숫자: `만오천원` `십만원` `오천원`
// - 단위 없는 숫자: `4500` `4,500` (100 이상만)
//
// 금액으로 보지 않는 것
// - 「원」 없는 한글 숫자(`사천오백`) — 「이천 쌀」「오만 가지」와 구분할 수 없다
// - 뒤에 세는 단위가 붙은 숫자(`2잔` `3시` `500ml`), 영문에 붙은 숫자(`GS25`)
// - 100 미만의 단위 없는 숫자(`아이폰 15`) — 「원」을 붙이면 받는다(`50원`)

/** 금액이 한도를 넘었다는 표시값(1조). 검증기가 버린다 */
export const AMOUNT_TOO_LARGE = 1_000_000_000_000;
/** 단위 없는 숫자를 금액으로 보는 최솟값 */
export const MIN_BARE_AMOUNT = 100;

export type AmountSpan = {
  /** 원문에서의 위치 [start, end) */
  start: number;
  end: number;
  /** 원 단위 금액. 한도를 넘으면 AMOUNT_TOO_LARGE */
  value: number;
  /** 원 · 천 · 만 · 억이 붙었는가. 붙은 금액이 있는 조각에서는 단위 없는 숫자를 버린다 */
  hasUnit: boolean;
};

const D = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)`;
const DEC = String.raw`${D}(?:\.\d+)?`;
const UNIT = "[억만천백십]";
const KOR = "[일이삼사오육칠팔구십백천만억]";
// 「원」은 붙여 쓰거나, 띄어 쓸 때는 뒤에 한글이 없어야 한다(`2 원두`를 2원으로 읽지 않는다)
const WON = String.raw`(?:원|\s원(?![가-힣]))`;

// `1만5천원` `18만 2천원` `1억 2천만원` `1만5000원` `1만오천원` `9천`
const UNIT_AMOUNT = new RegExp(String.raw`(?<![\d.,])${DEC}${UNIT}+(?:\s?${DEC}${UNIT}+)*(?:${D})?(?:${KOR}+(?=원))?${WON}?`, "g");
// `4500원` `4,500 원`
const WON_AMOUNT = new RegExp(String.raw`(?<![\d.,])${DEC}${WON}`, "g");
// `만오천원` `십만원`
const KOR_AMOUNT = new RegExp(`${KOR}+원`, "g");
// `4500` `4,500` — 소수 · 영문에 붙은 숫자는 빼고 찾는다
const BARE_AMOUNT = new RegExp(String.raw`(?<![\d.,A-Za-z])${D}(?![\d]|[.,]\d)`, "g");
const NUMBER_AT = new RegExp(DEC, "y");
const HAS_UNIT = new RegExp(UNIT);

// 숫자 뒤에 붙으면 금액이 아닌 단위. 앞 묶음은 뒤에 무엇이 오든 단위로 본다.
// 뒤 묶음은 한 글자라 낱말의 첫 글자와 겹치므로(`11000일시불`, `30000주유소`) 뒤에 글자가 이어지지 않을 때만 단위로 본다
const COUNTER = new RegExp(
  "^(?:" +
    "(?:개월|달러|유로|위안|프로|퍼센트|칼로리|리터|그램|키로|미터|포인트|인분|호선|번가|년|월|%)" +
    "|(?:kcal|ml|mL|kg|km|cm|mm|l|L|g|m|시|분|초|개|잔|병|캔|명|번|호|층|회|장|권|보|평|살|세|점|등|위|박|대|매|배|일|주|자|불|엔)(?![가-힣A-Za-z])" +
    ")",
);

const KOR_DIGITS: Record<string, number> = { 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9 };
const SMALL_UNITS: Record<string, number> = { 십: 10, 백: 100, 천: 1000 };
const BIG_UNITS: Record<string, number> = { 만: 10_000, 억: 100_000_000 };

const isDigit = (c: string): boolean => c >= "0" && c <= "9";

export class AmountReader {
  /** 금액 표현 하나를 원 단위 정수로 바꾼다. 읽을 수 없으면 null. `1만5천` → 15000, `만오천` → 15000, `1.2만` → 12000 */
  static evaluate(text: string): number | null {
    let total = 0;
    let section = 0;
    let number: number | null = null;
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === " " || c === "원") {
        i++;
      } else if (c in KOR_DIGITS) {
        if (number !== null) return null;
        number = KOR_DIGITS[c];
        i++;
      } else if (c in SMALL_UNITS) {
        section += (number ?? 1) * SMALL_UNITS[c];
        number = null;
        i++;
      } else if (c in BIG_UNITS) {
        section += number ?? 0;
        total += (section === 0 ? 1 : section) * BIG_UNITS[c];
        section = 0;
        number = null;
        i++;
      } else {
        NUMBER_AT.lastIndex = i;
        const m = NUMBER_AT.exec(text);
        if (!m || number !== null) return null;
        const raw = m[0].replaceAll(",", "");
        if (raw.replaceAll(".", "").length > 15) return AMOUNT_TOO_LARGE;
        number = Number(raw);
        i = NUMBER_AT.lastIndex;
      }
    }
    return AmountReader.finish(total + section + (number ?? 0));
  }

  private static finish(total: number): number | null {
    if (total >= AMOUNT_TOO_LARGE) return AMOUNT_TOO_LARGE;
    const rounded = Math.round(total);
    // 1.25만(12,500)은 되고 1.23456만은 안 된다 — 원 아래는 없다
    return Math.abs(total - rounded) > 1e-6 ? null : rounded;
  }

  /** [line]에서 금액 표현을 앞에서부터 찾는다. 서로 겹치지 않는다. 단위 없는 숫자도 함께 돌려준다(hasUnit false) */
  static read(line: string): AmountSpan[] {
    const spans: AmountSpan[] = [];
    AmountReader.readUnitAmounts(line, spans);
    AmountReader.readWonAmounts(line, spans);
    AmountReader.readKoreanAmounts(line, spans);
    AmountReader.readBareAmounts(line, spans);
    return spans.sort((a, b) => a.start - b.start);
  }

  private static overlaps(spans: AmountSpan[], start: number, end: number): boolean {
    return spans.some((s) => start < s.end && s.start < end);
  }

  private static readUnitAmounts(line: string, spans: AmountSpan[]): void {
    for (const m of line.matchAll(UNIT_AMOUNT)) {
      const end = m.index + m[0].length;
      // `3만보` `5천명` — 「원」 없이 세는 단위가 붙으면 금액이 아니다
      if (!m[0].endsWith("원") && COUNTER.test(line.slice(end))) continue;
      const value = AmountReader.evaluate(m[0]);
      if (value !== null) spans.push({ start: m.index, end, value, hasUnit: true });
    }
  }

  private static readWonAmounts(line: string, spans: AmountSpan[]): void {
    for (const m of line.matchAll(WON_AMOUNT)) {
      const end = m.index + m[0].length;
      if (AmountReader.overlaps(spans, m.index, end)) continue;
      const value = AmountReader.evaluate(m[0]);
      if (value !== null) spans.push({ start: m.index, end, value, hasUnit: true });
    }
  }

  private static readKoreanAmounts(line: string, spans: AmountSpan[]): void {
    for (const m of line.matchAll(KOR_AMOUNT)) {
      const end = m.index + m[0].length;
      // 앞이 숫자면 위에서 이미 읽은 금액의 꼬리다
      if (AmountReader.overlaps(spans, m.index, end)) continue;
      const run = m[0];
      // `오이천원` — 통째로는 읽히지 않으니 읽히는 가장 긴 뒷부분(`이천원`)을 쓴다
      for (let from = 0; from < run.length - 1; from++) {
        const part = run.slice(from);
        // `사원` `구원`은 금액이 아니다 — 십 · 백 · 천 · 만 · 억이 하나는 있어야 한다
        if (!HAS_UNIT.test(part)) break;
        const value = AmountReader.evaluate(part);
        if (value !== null) {
          spans.push({ start: m.index + from, end, value, hasUnit: true });
          break;
        }
      }
    }
  }

  private static readBareAmounts(line: string, spans: AmountSpan[]): void {
    for (const m of line.matchAll(BARE_AMOUNT)) {
      const end = m.index + m[0].length;
      if (AmountReader.overlaps(spans, m.index, end)) continue;
      if (COUNTER.test(line.slice(end))) continue;
      if (AmountReader.looksLikeDateOrPhone(line, m.index, end)) continue;
      const value = AmountReader.evaluate(m[0]);
      if (value === null || value < MIN_BARE_AMOUNT) continue;
      spans.push({ start: m.index, end, value, hasUnit: false });
    }
  }

  // `12/3` `7:30` `010-1234-5678`의 숫자는 금액이 아니다.
  // `커피-4500` `4500/점심`의 붙임표 · 빗금은 구분 기호라 막지 않는다 — 건너편이 숫자일 때만 막는다
  private static looksLikeDateOrPhone(line: string, start: number, end: number): boolean {
    if (end < line.length) {
      const next = line[end];
      if (next === ":") return true;
      if ((next === "-" || next === "/") && end + 1 < line.length && isDigit(line[end + 1])) return true;
    }
    if (start > 0) {
      const prev = line[start - 1];
      if (prev === ":") return true;
      if ((prev === "-" || prev === "/") && start > 1 && isDigit(line[start - 2])) return true;
    }
    return false;
  }
}
