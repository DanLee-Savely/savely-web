import type { Clock } from "./Clock";
import { FutureDateError, InvalidDateError } from "./errors";

const SEOUL = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

// 값 객체: 'YYYY-MM-DD' 한국 날짜 문자열. 오늘(Asia/Seoul) 이후는 거부 (70-mvp-records §8-4)
// Date로 바꾸지 않고 문자열끼리 비교한다 — 같은 형식이라 사전순 = 날짜순
export class RecordDate {
  private constructor(private readonly value: string) {}

  static create(raw: string, clock: Clock): RecordDate {
    if (!RecordDate.isCalendarDate(raw)) throw new InvalidDateError();
    if (raw > RecordDate.today(clock)) throw new FutureDateError();
    return new RecordDate(raw);
  }

  /** 한국 시간 기준 오늘 'YYYY-MM-DD' */
  static today(clock: Clock): string {
    return SEOUL.format(clock.now());
  }

  // 2026-02-30 같은 없는 날짜를 거른다. 시각과 Z를 붙여 UTC로 명시한다
  private static isCalendarDate(raw: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) && new Date(`${raw}T00:00:00Z`).toISOString().startsWith(raw);
  }

  equals(other: RecordDate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
