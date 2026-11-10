import type { Clock } from "@/domain/record/Clock";
import { MonthKey } from "@/domain/record/MonthKey";
import { RecordDate } from "@/domain/record/RecordDate";
import type { RecordData } from "@/domain/record/RecordEntry";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";
import { average, type MonthView, monthView, percent } from "./monthView";

export type HomeSummary = {
  today: string;
  month: MonthView;
  /** 오늘 기록 건수(지출 + 수입) · 오늘 쓴 돈(지출) · 최근 만든 순 최대 3건 */
  todayCount: number;
  todaySpent: number;
  todayRecords: RecordData[];
  /** 이번 달(1일 ~ 오늘) */
  expense: number;
  income: number;
  count: number;
  dailyAverage: number;
  /** 오늘 포함 최근 7일 지출 */
  last7: { date: string; amount: number }[];
  last7Total: number;
  /** 이번 달 지출 카테고리 상위 3개 */
  topCategories: { categoryId: string; sum: number; percent: number }[];
};

// 홈 (§4-8): 기록만 읽어 오늘 · 이번 달 · 최근 7일 · 많이 쓴 곳을 계산. 수입은 수입 줄에만(M19)
export class GetHomeSummaryService {
  constructor(
    private readonly stats: RecordStatsReader,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<HomeSummary> {
    const month = MonthKey.parse(undefined, this.clock);
    const today = month.today;
    const weekStart = RecordDate.addDays(today, -6);
    const [todayEntries, totals, daily, categories] = await Promise.all([
      this.stats.recordsOn(today),
      this.stats.kindTotals(month.start, today),
      this.stats.dailyExpense(weekStart, today),
      this.stats.categoryExpense(month.start, today),
    ]);
    const todayRecords = todayEntries.map((e) => e.toData());
    const last7 = Array.from({ length: 7 }, (_, i) => RecordDate.addDays(weekStart, i)).map((date) => ({ date, amount: daily[date] ?? 0 }));
    const expense = totals.expense.sum;
    return {
      today,
      month: monthView(month),
      todayCount: todayRecords.length,
      todaySpent: todayRecords.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0),
      todayRecords: todayRecords.slice(0, 3),
      expense,
      income: totals.income.sum,
      count: totals.expense.count + totals.income.count,
      dailyAverage: average(expense, month.elapsedDays),
      last7,
      last7Total: last7.reduce((s, d) => s + d.amount, 0),
      topCategories: categories.slice(0, 3).map((c) => ({ ...c, percent: percent(c.sum, expense) })),
    };
  }
}
