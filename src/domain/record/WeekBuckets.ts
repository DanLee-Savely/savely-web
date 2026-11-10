import type { MonthKey } from "./MonthKey";

export type WeekState = "done" | "current" | "future";
export type WeekBucket = { from: number; to: number; start: string; end: string; state: WeekState };

// 리포트 주 구간: 1–7 · 8–14 · 15–21 · 22–28 · 29–말일 (M20). 말일이 28일이면 4구간
// 이번 달이면 오늘이 든 구간은 진행 중, 오늘 이후 구간은 예정
export class WeekBuckets {
  static of(month: MonthKey): WeekBucket[] {
    const today = month.today;
    return [1, 8, 15, 22, 29]
      .filter((from) => from <= month.days)
      .map((from) => {
        const to = from === 29 ? month.days : from + 6;
        const start = month.date(from);
        const end = month.date(to);
        const state: WeekState = !month.isCurrent || end < today ? "done" : start > today ? "future" : "current";
        return { from, to, start, end, state };
      });
  }
}
