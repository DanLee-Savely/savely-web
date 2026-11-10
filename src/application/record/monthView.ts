import type { MonthKey } from "@/domain/record/MonthKey";

/** 화면에 넘길 달 정보(평범한 값). prev · next는 'YYYY-MM', 미래 달은 null */
export type MonthView = {
  key: string;
  year: number;
  month: number;
  start: string;
  end: string;
  days: number;
  isCurrent: boolean;
  prev: string;
  next: string | null;
};

export const monthView = (m: MonthKey): MonthView => ({
  key: m.key,
  year: m.year,
  month: m.month,
  start: m.start,
  end: m.end,
  days: m.days,
  isCurrent: m.isCurrent,
  prev: m.prev().key,
  next: m.next()?.key ?? null,
});

/** 원 단위 반올림 하루 평균 · 정수 반올림 비율(%) (§4-8 계산 규칙). 분모 0이면 0 */
export const average = (sum: number, days: number) => (days ? Math.round(sum / days) : 0);
export const percent = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
