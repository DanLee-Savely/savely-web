import type { Clock } from "@/domain/record/Clock";
import { MonthKey } from "@/domain/record/MonthKey";
import { FEELINGS, REASONS } from "@/domain/record/RecordEntry";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";
import { type WeekState, WeekBuckets } from "@/domain/record/WeekBuckets";
import { average, type MonthView, monthView, percent } from "./monthView";

export type CompareState = "more" | "less" | "same" | "none";
export type MonthlyReport = {
  month: MonthView;
  count: number;
  expense: number;
  income: number;
  dailyAverage: number;
  /** 지난달 같은 기간 지출과 비교(M21). 지난달 기록이 0건이면 none */
  compare: { state: CompareState; diff: number };
  /** 주 구간(M20). 예정 구간은 amount null */
  weeks: { from: number; to: number; amount: number | null; state: WeekState; isMax: boolean }[];
  categories: { categoryId: string; sum: number; percent: number }[];
  /** 이유 · 기분: 목록 순서, 적은 건수(0 포함) */
  reasons: { id: string; count: number }[];
  feelings: { id: string; count: number }[];
  /** 충동적 지출 건수와 그중 아쉬움 · 후회 건수. 충동적 0건이면 null */
  impulse: { total: number; regret: number } | null;
};

// 리포트 (§4-10). 금액 · 비율 · 막대는 지출만(M19)
export class GetMonthlyReportService {
  constructor(
    private readonly stats: RecordStatsReader,
    private readonly clock: Clock,
  ) {}

  async execute(rawMonth: string | undefined): Promise<MonthlyReport> {
    const m = MonthKey.parse(rawMonth, this.clock);
    const prev = m.prev();
    const s = this.stats;
    const [totals, daily, categories, reasons, feelings, regret, prevSame, prevAll] = await Promise.all([
      s.kindTotals(m.start, m.end),
      s.dailyExpense(m.start, m.end),
      s.categoryExpense(m.start, m.end),
      s.reasonCounts(m.start, m.end),
      s.feelingCounts(m.start, m.end),
      s.impulseRegretCount(m.start, m.end),
      s.kindTotals(prev.start, m.prevSamePeriodEnd()),
      s.kindTotals(prev.start, prev.date(prev.days)),
    ]);
    const expense = totals.expense.sum;
    const diff = expense - prevSame.expense.sum;
    const none = prevAll.expense.count + prevAll.income.count === 0;
    return {
      month: monthView(m),
      count: totals.expense.count + totals.income.count,
      expense,
      income: totals.income.sum,
      dailyAverage: average(expense, m.elapsedDays),
      compare: { state: none ? "none" : diff > 0 ? "more" : diff < 0 ? "less" : "same", diff: Math.abs(diff) },
      weeks: this.weeks(m, daily),
      categories: categories.map((c) => ({ ...c, percent: percent(c.sum, expense) })),
      reasons: REASONS.map((id) => ({ id, count: reasons[id] ?? 0 })),
      feelings: FEELINGS.map((id) => ({ id, count: feelings[id] ?? 0 })),
      impulse: reasons.impulse ? { total: reasons.impulse, regret } : null,
    };
  }

  private weeks(m: MonthKey, daily: Record<string, number>): MonthlyReport["weeks"] {
    const weeks = WeekBuckets.of(m).map((b) => ({
      from: b.from,
      to: b.to,
      state: b.state,
      amount: b.state === "future" ? null : Object.entries(daily).reduce((sum, [d, v]) => (d >= b.start && d <= b.end ? sum + v : sum), 0),
    }));
    const max = Math.max(0, ...weeks.map((w) => w.amount ?? 0));
    const first = weeks.findIndex((w) => max > 0 && w.amount === max);
    return weeks.map((w, i) => ({ ...w, isMax: i === first }));
  }
}
