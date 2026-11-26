import type { GtagAnalytics } from "./GtagAnalytics";
import type { InternalTraffic } from "./InternalTraffic";
import { NaverAnalyticsScript } from "./NaverAnalyticsScript";

/** 이 방문에서 불러올 스크립트. 둘 다 null이면 아무것도 불러오지 않는다 */
export type AnalyticsScriptPlan = { gtagSrc: string | null; naverSrc: string | null };

/** 서버와 첫 그리기에서 쓰는 값 — 스크립트는 브라우저에서 주소를 본 뒤에만 넣는다 */
export const NO_SCRIPTS: AnalyticsScriptPlan = { gtagSrc: null, naverSrc: null };

// 방문 통계 스크립트를 넣을지 브라우저에서 한 번 정한다 (90-measurement-search §2-2).
// ID가 비어 있거나(구현체가 null) 실서비스 주소가 아니면 아무것도 넣지 않는다
export class AnalyticsLoader {
  private decided: AnalyticsScriptPlan | null = null;

  constructor(
    private readonly gtag: GtagAnalytics | null,
    private readonly naver: NaverAnalyticsScript | null,
    private readonly internal: InternalTraffic,
    private readonly env: { onProduction: () => boolean; search: () => string },
  ) {}

  /** 브라우저에서만 부른다. 처음 한 번 정하고 같은 값을 돌려준다 */
  plan(): AnalyticsScriptPlan {
    if (this.decided) return this.decided;
    // 통계 도구가 꺼져 있어도 본인 방문 표시는 남긴다 — ID를 넣기 전에 다녀간 표시도 쓸 수 있게
    this.internal.capture(this.env.search());
    this.decided = {
      gtagSrc: this.gtag?.start() ? this.gtag.scriptSrc : null,
      naverSrc: this.naver && this.env.onProduction() ? NaverAnalyticsScript.SRC : null,
    };
    return this.decided;
  }

  /** 네이버 스크립트를 다 불러온 뒤 */
  naverLoaded(): void {
    this.naver?.pageView();
  }
}
