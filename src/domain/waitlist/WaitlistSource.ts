// 신청 창을 연 위치 (분석용)
export const WAITLIST_SOURCES = ["gnb", "hero", "final-cta", "floating", "mobile-menu"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export const isWaitlistSource = (value: unknown): value is WaitlistSource =>
  WAITLIST_SOURCES.includes(value as WaitlistSource);
