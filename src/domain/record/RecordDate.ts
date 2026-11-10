import type { Clock } from "./Clock";
import { DateRequiredError, FutureDateError, InvalidDateError } from "./errors";

const SEOUL = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

// 값 객체: 'YYYY-MM-DD' 한국 날짜 문자열. 빈칸 · 오늘(Asia/Seoul) 이후는 거부 (70-mvp-records §8-4)
// Date로 바꾸지 않고 문자열끼리 비교한다 — 같은 형식이라 사전순 = 날짜순
export class RecordDate {
  private constructor(private readonly value: string) {}

  static create(raw: string, clock: Clock): RecordDate {
    if (!raw.trim()) throw new DateRequiredError();
    if (!RecordDate.isCalendarDate(raw)) throw new InvalidDateError();
    if (raw > RecordDate.today(clock)) throw new FutureDateError();
    return new RecordDate(raw);
  }

  /** 한국 시간 기준 오늘 'YYYY-MM-DD' */
  static today(clock: Clock): string {
    return SEOUL.format(clock.now());
  }

  /** 'YYYY-MM-DD'에서 n일 앞뒤 날짜 (UTC 자정으로 계산해 시간대 영향 없음) */
  static addDays(date: string, n: number): string {
    return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
  }

  /** 0 = 월요일 … 6 = 일요일 (앱 달력과 같은 월요일 시작) */
  static weekday(date: string): number {
    return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  }

  // 2026-02-30 · 2026-10-40 같은 없는 날짜를 거른다. 시각과 Z를 붙여 UTC로 명시한다(13월 · 40일은 Date가 NaN)
  private static isCalendarDate(raw: string): boolean {
    const time = Date.parse(`${raw}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(time) && new Date(time).toISOString().startsWith(raw);
  }

  equals(other: RecordDate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
