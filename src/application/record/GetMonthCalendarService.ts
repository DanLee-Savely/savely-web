import { DomainError } from "@/domain/DomainError";
import type { Clock } from "@/domain/record/Clock";
import { MonthKey } from "@/domain/record/MonthKey";
import { RecordDate } from "@/domain/record/RecordDate";
import { FEELINGS, type RecordData } from "@/domain/record/RecordEntry";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";
import { average, type MonthView, monthView } from "./monthView";

export type CalendarCell = { date: string; day: number; inMonth: boolean; amount: number; isToday: boolean; isFuture: boolean };
export type CalendarDay = {
  date: string;
  spent: number;
  count: number;
  /** 왜 썼나요 = 필수지출인 기록 수 */
  fixedCount: number;
  records: RecordData[];
  /** 1건 이상인 기분만, 기분 목록 순서 */
  feelings: { feeling: string; count: number }[];
};
export type MonthCalendar = {
  today: string;
  month: MonthView;
  expense: number;
  count: number;
  dailyAverage: number;
  /** 월요일 시작, 7의 배수 칸. 앞뒤 다른 달 날짜는 inMonth=false */
  cells: CalendarCell[];
  selected: CalendarDay;
};

// 달력 (§4-9). 칸 금액은 지출만(M19). 선택한 날: 그 달 안의 오늘까지 날짜만, 아니면 이번 달은 오늘 · 지난 달은 말일
export class GetMonthCalendarService {
  constructor(
    private readonly stats: RecordStatsReader,
    private readonly clock: Clock,
  ) {}

  async execute(rawMonth: string | undefined, rawDate: string | undefined): Promise<MonthCalendar> {
    const month = MonthKey.parse(rawMonth, this.clock);
    const today = month.today;
    const valid = !!rawDate && month.contains(rawDate) && DomainError.codeOf(() => RecordDate.create(rawDate, this.clock)) === null;
    const selected = valid ? rawDate! : month.isCurrent ? today : month.date(month.days);
    const [totals, daily, entries] = await Promise.all([
      this.stats.kindTotals(month.start, month.end),
      this.stats.dailyExpense(month.start, month.end),
      this.stats.recordsOn(selected),
    ]);
    return {
      today,
      month: monthView(month),
      expense: totals.expense.sum,
      count: totals.expense.count + totals.income.count,
      dailyAverage: average(totals.expense.sum, month.elapsedDays),
      cells: this.cells(month, daily),
      selected: this.day(selected, entries.map((e) => e.toData())),
    };
  }

  private cells(month: MonthKey, daily: Record<string, number>): CalendarCell[] {
    const offset = RecordDate.weekday(month.start);
    const first = RecordDate.addDays(month.start, -offset);
    return Array.from({ length: Math.ceil((offset + month.days) / 7) * 7 }, (_, i) => {
      const date = RecordDate.addDays(first, i);
      const inMonth = month.contains(date);
      return { date, day: Number(date.slice(8)), inMonth, amount: inMonth ? (daily[date] ?? 0) : 0, isToday: date === month.today, isFuture: date > month.today };
    });
  }

  private day(date: string, records: RecordData[]): CalendarDay {
    const expenses = records.filter((r) => r.kind === "expense");
    return {
      date,
      spent: expenses.reduce((s, r) => s + r.amount, 0),
      count: records.length,
      fixedCount: expenses.filter((r) => r.reason === "fixed").length,
      records,
      feelings: FEELINGS.map((feeling) => ({ feeling, count: expenses.filter((r) => r.feeling === feeling).length })).filter((f) => f.count),
    };
  }
}
