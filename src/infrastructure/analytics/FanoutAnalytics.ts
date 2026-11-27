import type { AnalyticsEvent, AnalyticsPort } from "@/application/analytics/AnalyticsPort";

// 같은 이벤트를 여러 통계 도구로 보낸다 (90-measurement-search §2-11 — GA4와 Amplitude).
// 보낼지는 도구마다 스스로 정한다(실서비스 주소 · VisitGate · 개발 중 확인)
export class FanoutAnalytics implements AnalyticsPort {
  constructor(private readonly ports: readonly AnalyticsPort[]) {}

  track(event: AnalyticsEvent): void {
    for (const port of this.ports) port.track(event);
  }
}
