// 문장에서 기록 날짜를 읽는다 (앱 record_date_reader.dart에서 옮김, 80-record-assistant §3 · G)
//
// 받는 표현
// - `오늘` `어제` `그저께`(`그제` `엊그제`) `내일` `모레`
// - `3일 전`
// - `11월 20일` `11/20`
// - `이번 달 15일` `지난달 28일`
// - `20일` — 가장 가까운 지난 20일(11월 3일에 적은 `25일`은 10월 25일)
//
// 날짜로 보지 않는 것: `3일치` `2일간`(뒤에 글자가 이어진다), 그 달에 없는 날(`2월 30일`). 요일은 읽지 않는다.
//
// 여기서는 **읽기만** 한다. 미래 날짜 · 너무 오래된 날짜를 걸러 내는 것은 검증기다 —
// `내일`을 읽어야 「미래 날짜는 뺐어요」라고 알릴 수 있다.
// 날짜는 'YYYY-MM-DD' 문자열로만 다룬다(70-mvp-records §8-4). 달력 계산은 UTC 자정으로 해서 시간대 영향이 없다.

export type RecordDateRead = {
  /** 읽은 날짜 'YYYY-MM-DD'. 날짜 표현이 없으면 null */
  date: string | null;
  /** 날짜 표현을 걷어 낸 나머지 — 이름과 금액이 남는다 */
  rest: string;
};

const TAIL = "(?:에|날)?";
// `11월 20일`
const MONTH_DAY = new RegExp(String.raw`(?<!\d)(\d{1,2})\s?월\s?(\d{1,2})\s?일${TAIL}(?![가-힣])`, "g");
// `이번 달 15일` `지난달 28일`
const REL_MONTH_DAY = new RegExp(String.raw`(이번|지난|저번)\s?달\s?(\d{1,2})\s?일${TAIL}(?![가-힣])`, "g");
// `3일 전`
const DAYS_AGO = /(?<!\d)(\d{1,2})\s?일\s?전(?:에)?(?![가-힣])/g;
// `오늘` `어제` … — 앞에 글자가 붙은 것(`그어제`)은 잡지 않는다. 뒤는 붙어도 된다(`어제저녁`)
const WORD = /(?<![가-힣])(오늘|어제|그저께|엊그저께|엊그제|그제|내일|모레)/g;
// `20일` — 뒤에 글자가 이어지면(`3일치` `2일간`) 날짜가 아니다
const BARE_DAY = new RegExp(String.raw`(?<![\d가-힣])(\d{1,2})\s?일${TAIL}(?![가-힣])`, "g");
// `11/20` — 조각을 끊기 **전에** 「11월 20일」로 바꿔 둔다. 빗금은 조각을 끊는 기호라 그대로 두면 `11`과 `20 커피`로 갈라진다
const SLASH_DATE = /(?<![\d/.,])(\d{1,2})\/(\d{1,2})(?![\d/.,])/g;

const WORD_OFFSETS: Record<string, number> = { 오늘: 0, 어제: -1, 그저께: -2, 엊그저께: -2, 엊그제: -2, 그제: -2, 내일: 1, 모레: 2 };

const DAY_MS = 86_400_000;
const pad = (n: number): string => String(n).padStart(2, "0");

type Found = { start: number; end: number; date: string };
type Span = { start: number; end: number };

export class RecordDateReader {
  /** 실제로 있는 날짜면 'YYYY-MM-DD'. `2월 30일` `13월 1일`은 null. 달이 1~12 밖이면(이전 달 계산) 해를 넘겨 맞춘다 */
  static valid(year: number, month: number, day: number, strictMonth = true): string | null {
    if (day < 1 || (strictMonth && (month < 1 || month > 12))) return null;
    const time = new Date(Date.UTC(year, month - 1, 1));
    const y = time.getUTCFullYear();
    const m = time.getUTCMonth() + 1;
    const made = new Date(Date.UTC(y, m - 1, day));
    return made.getUTCMonth() + 1 === m && made.getUTCDate() === day ? `${y}-${pad(m)}-${pad(day)}` : null;
  }

  static addDays(date: string, n: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
  }

  /** `11/20`을 `11월 20일`로 바꾼다. 달 · 날로 읽을 수 없는 것(`4500/20`, `13/40`)은 그대로 둔다 */
  static normalizeSlashDates(line: string): string {
    return line.replace(SLASH_DATE, (whole, month: string, day: string) =>
      // 윤년을 넉넉히 받는다 — 해는 읽을 때 정한다
      RecordDateReader.valid(2024, Number(month), Number(day)) === null ? whole : `${Number(month)}월 ${Number(day)}일`,
    );
  }

  /**
   * [text]에서 날짜를 읽는다. [today]는 **실제 오늘**('YYYY-MM-DD', Asia/Seoul)이다 — `어제`는 화면 날짜가 아니라 오늘을 기준으로 읽는다.
   * 날짜 표현이 여럿이면 맨 앞의 것이 날짜다. 나머지도 rest에서는 걷어 낸다
   */
  static read(text: string, today: string): RecordDateRead {
    const found: Found[] = [];
    // 날짜 모양이지만 없는 날(`2월 30일`)의 자리. 그 안의 `30일`을 따로 읽지 않는다
    const blocked: Span[] = [];
    const add = (m: RegExpMatchArray, date: string | null): void => {
      const span = { start: m.index!, end: m.index! + m[0].length };
      if (date === null) return void blocked.push(span);
      const hit = (s: Span) => span.start < s.end && s.start < span.end;
      if (!found.some(hit) && !blocked.some(hit)) found.push({ ...span, date });
    };
    // 긴 표현부터 본다 — `11월 20일`의 `20일`이 따로 잡히지 않게
    for (const [pattern, toDate] of RecordDateReader.readers(today)) for (const m of text.matchAll(pattern)) add(m, toDate(m));
    if (!found.length) return { date: null, rest: text };
    found.sort((a, b) => a.start - b.start);
    return { date: found[0].date, rest: RecordDateReader.strip(text, found) };
  }

  private static readers(today: string): [RegExp, (m: RegExpMatchArray) => string | null][] {
    const [y0, m0, d0] = today.split("-").map(Number);
    const { valid, addDays } = RecordDateReader;
    return [
      [MONTH_DAY, (m) => {
        const date = valid(y0, Number(m[1]), Number(m[2]));
        // 아직 오지 않은 달 · 날은 지난해다(1월에 적은 `12월 20일`)
        return date !== null && date > today ? valid(y0 - 1, Number(m[1]), Number(m[2])) : date;
      }],
      [REL_MONTH_DAY, (m) => valid(y0, m0 - (m[1] === "이번" ? 0 : 1), Number(m[2]), false)],
      [DAYS_AGO, (m) => addDays(today, -Number(m[1]))],
      [WORD, (m) => addDays(today, WORD_OFFSETS[m[1]])],
      // 가장 가까운 지난 날 — 이번 달에 이미 지났으면 이번 달, 아니면 지난달
      [BARE_DAY, (m) => (Number(m[1]) <= d0 ? valid(y0, m0, Number(m[1])) : valid(y0, m0 - 1, Number(m[1]), false))],
    ];
  }

  private static strip(text: string, found: Found[]): string {
    let rest = "";
    let cursor = 0;
    for (const f of found) {
      rest += `${text.slice(cursor, f.start)} `;
      cursor = f.end;
    }
    return rest + text.slice(cursor);
  }
}
