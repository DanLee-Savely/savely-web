// 신청 창을 연 위치 (분석용). guide = 가이드 글 끝 안내 상자 (91-content §4-6)
export const WAITLIST_SOURCES = ["gnb", "hero", "final-cta", "floating", "mobile-menu", "guide"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export const isWaitlistSource = (value: unknown): value is WaitlistSource =>
  WAITLIST_SOURCES.includes(value as WaitlistSource);
