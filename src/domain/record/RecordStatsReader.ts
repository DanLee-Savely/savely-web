import type { RecordEntry } from "./RecordEntry";

export type KindTotals = { expense: { sum: number; count: number }; income: { sum: number; count: number } };
export type CategorySum = { categoryId: string; sum: number };

// 홈 · 달력 · 리포트 집계 조회 (70-mvp-records §6-5, 읽기 전용). 기간은 'YYYY-MM-DD' 양 끝 포함
export interface RecordStatsReader {
  kindTotals(from: string, to: string): Promise<KindTotals>;
  /** 날짜 → 그날 지출 합계 (지출이 있는 날만) */
  dailyExpense(from: string, to: string): Promise<Record<string, number>>;
  /** 지출 카테고리별 합계, 많은 순 */
  categoryExpense(from: string, to: string): Promise<CategorySum[]>;
  /** 이유 · 기분 값 → 지출 기록 건수 (적지 않은 기록 제외) */
  reasonCounts(from: string, to: string): Promise<Record<string, number>>;
  feelingCounts(from: string, to: string): Promise<Record<string, number>>;
  /** 충동적 지출 중 기분이 아쉬움 · 후회인 건수 */
  impulseRegretCount(from: string, to: string): Promise<number>;
  /** 그날 기록, 최근 만든 순 */
  recordsOn(date: string): Promise<RecordEntry[]>;
}
