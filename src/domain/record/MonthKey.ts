import type { Clock } from "./Clock";
import { RecordDate } from "./RecordDate";

const pad = (n: number) => String(n).padStart(2, "0");

// 값 객체: 'YYYY-MM' 한 달 (70-mvp-records §4-9 · §4-10). 형식 오류 · 미래 달은 이번 달(Asia/Seoul)로 바꾼다
// 날짜는 'YYYY-MM-DD' 문자열로만 다룬다. 이번 달이면 끝일 = 오늘, 지난 달이면 말일
export class MonthKey {
  private constructor(
    readonly year: number,
    readonly month: number,
    readonly today: string,
  ) {}

  static parse(raw: string | undefined, clock: Clock): MonthKey {
    const today = RecordDate.today(clock);
    const current = new MonthKey(Number(today.slice(0, 4)), Number(today.slice(5, 7)), today);
    if (!raw || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw) || raw > current.key) return current;
    return new MonthKey(Number(raw.slice(0, 4)), Number(raw.slice(5, 7)), today);
  }

  get key(): string {
    return `${this.year}-${pad(this.month)}`;
  }

  get isCurrent(): boolean {
    return this.today.startsWith(this.key);
  }

  /** 그 달의 일수(28 ~ 31) */
  get days(): number {
    return new Date(Date.UTC(this.year, this.month, 0)).getUTCDate();
  }

  /** 지난 날 수: 이번 달이면 오늘 날짜, 지난 달이면 일수 (하루 평균의 분모) */
  get elapsedDays(): number {
    return this.isCurrent ? Number(this.today.slice(8)) : this.days;
  }

  get start(): string {
    return this.date(1);
  }

  get end(): string {
    return this.date(this.elapsedDays);
  }

  date(day: number): string {
    return `${this.key}-${pad(day)}`;
  }

  contains(date: string): boolean {
    return date.startsWith(`${this.key}-`);
  }

  prev(): MonthKey {
    return this.month === 1 ? new MonthKey(this.year - 1, 12, this.today) : new MonthKey(this.year, this.month - 1, this.today);
  }

  /** 다음 달. 이번 달이면 null(미래 달 없음) */
  next(): MonthKey | null {
    if (this.isCurrent) return null;
    return this.month === 12 ? new MonthKey(this.year + 1, 1, this.today) : new MonthKey(this.year, this.month + 1, this.today);
  }

  /** 지난달 같은 기간의 끝(1일 ~ 같은 날, 지난달이 짧으면 말일, M21) */
  prevSamePeriodEnd(): string {
    const prev = this.prev();
    return prev.date(Math.min(this.elapsedDays, prev.days));
  }
}
