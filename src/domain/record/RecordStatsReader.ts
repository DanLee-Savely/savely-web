import type { RecordEntry, RecordKind } from "./RecordEntry";

/** 구분 4가지 각각의 합계 · 건수 (없는 구분은 0) */
export type KindTotals = Record<RecordKind, { sum: number; count: number }>;
export type CategorySum = { categoryId: string; sum: number };

// 홈 · 달력 · 리포트 집계 조회 (70-mvp-records §6-5, 읽기 전용). 기간은 'YYYY-MM-DD' 양 끝 포함
export interface RecordStatsReader {
  kindTotals(from: string, to: string): Promise<KindTotals>;
  /** 날짜 → 그날 지출 합계 (지출이 있는 날만) */
  dailyExpense(from: string, to: string): Promise<Record<string, number>>;
  /** 지출 카테고리별 합계, 많은 순. 카테고리를 고르지 않은 지출은 「기타」(etc_expense)에 합친다(K5) */
  categoryExpense(from: string, to: string): Promise<CategorySum[]>;
  /** 카테고리 하나의 합계 · 건수(구분 4가지 어느 카테고리든). 「기타」(etc_expense)에는 카테고리를 고르지 않은 지출을 합친다(K5) — 대화로 물어보기의 답 */
  categoryTotal(from: string, to: string, categoryId: string): Promise<{ sum: number; count: number }>;
  /** 이유 · 기분 값 → 지출 기록 건수 (적지 않은 기록 제외) */
  reasonCounts(from: string, to: string): Promise<Record<string, number>>;
  feelingCounts(from: string, to: string): Promise<Record<string, number>>;
  /** 충동적 지출 중 기분이 아쉬움 · 후회인 건수 */
  impulseRegretCount(from: string, to: string): Promise<number>;
  /** 그날 기록, 최근 만든 순 */
  recordsOn(date: string): Promise<RecordEntry[]>;
  /** 기간의 기록(날짜 최신순 · 같은 날은 만든 순서 역순), 최대 [limit]건 — 대화로 기록하기의 자주 적는 항목 · 채우지 않은 기록 · 고정지출 계산용 */
  recordsBetween(from: string, to: string, limit: number): Promise<RecordEntry[]>;
}
