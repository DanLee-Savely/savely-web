import type { WaitlistResult } from "@/domain/waitlist/WaitlistResult";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import type { AnalyticsPort, DemoPlacement } from "./AnalyticsPort";

// 소개 사이트(/home · 가이드 글) 한 페이지의 흐름을 이벤트로 옮긴다 (90-measurement-search §2-3 · 91-content §4-6).
// 페이지를 열 때마다 새로 만든다 — 「섹션별 1회」와 「마지막으로 본 섹션」은 그 페이지 안에서만 센다
export class HomeFunnel {
  private readonly seen = new Set<string>();
  private lastSection: string | null = null;

  /** [guideSlug]: 가이드 글 화면이면 그 글의 slug — 그 화면에서 나가는 이벤트에 함께 싣는다 */
  constructor(
    private readonly analytics: AnalyticsPort,
    private readonly guideSlug: string | null = null,
  ) {}

  /** 섹션이 화면에 절반 이상 보였다. section_view는 처음 한 번만 보내고, 「마지막으로 본 섹션」은 볼 때마다 바뀐다 */
  sectionSeen(section: string): void {
    this.lastSection = section;
    if (this.seen.has(section)) return;
    this.seen.add(section);
    this.analytics.track({ name: "section_view", section });
  }

  waitlistOpened(source: WaitlistSource): void {
    this.analytics.track({ name: "waitlist_open", source, ...this.where() });
  }

  /** 신청 한 번의 결과: 성공이면 generate_lead, 실패면 waitlist_error. 결과 한 번에 이벤트 하나다 */
  waitlistFinished(source: WaitlistSource, result: WaitlistResult): void {
    if (result.ok) this.analytics.track({ name: "generate_lead", source, ...this.where() });
    else this.analytics.track({ name: "waitlist_error", source, code: result.code });
  }

  demoClicked(placement: DemoPlacement): void {
    this.analytics.track({ name: "demo_click", placement, ...(this.guideSlug && { guide_slug: this.guideSlug }) });
  }

  private where(): { last_section?: string; guide_slug?: string } {
    return { ...(this.lastSection && { last_section: this.lastSection }), ...(this.guideSlug && { guide_slug: this.guideSlug }) };
  }
}
