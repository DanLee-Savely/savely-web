import type { AnalyticsPort } from "@/application/analytics/AnalyticsPort";

// 아무것도 보내지 않는다 — ID가 비어 있을 때와 서버에서 쓴다 (90-measurement-search §2-2)
export class NoopAnalytics implements AnalyticsPort {
  track(): void {}
}
