import type { GtagAnalytics } from "./GtagAnalytics";
import { NaverAnalyticsScript } from "./NaverAnalyticsScript";
import type { VisitGate } from "./VisitGate";

/** 이 방문에서 불러올 스크립트. 둘 다 null이면 아무것도 불러오지 않는다 */
export type AnalyticsScriptPlan = { gtagSrc: string | null; naverSrc: string | null };

/** 서버와 첫 그리기에서 쓰는 값 — 스크립트는 브라우저에서 주소를 본 뒤에만 넣는다 */
export const NO_SCRIPTS: AnalyticsScriptPlan = { gtagSrc: null, naverSrc: null };

// 방문 통계 스크립트를 넣을지 브라우저에서 한 번 정한다 (90-measurement-search §2-2 · §2-9).
// 아래 가운데 하나라도 해당하면 그 스크립트는 넣지 않는다:
//   ID가 비어 있다(구현체가 null) · 실서비스 주소가 아니다 · 통계에 넣으면 안 되는 방문이다(VisitGate — 쿠키를 못 쓰는 브라우저 · 본인 방문)
export class AnalyticsLoader {
  private decided: AnalyticsScriptPlan | null = null;

  constructor(
    private readonly gtag: GtagAnalytics | null,
    private readonly naver: NaverAnalyticsScript | null,
    private readonly gate: VisitGate,
    private readonly env: { onProduction: () => boolean },
  ) {}

  /** 브라우저에서만 부른다. 처음 한 번 정하고 같은 값을 돌려준다 */
  plan(): AnalyticsScriptPlan {
    if (this.decided) return this.decided;
    // 통계 도구가 꺼져 있어도 먼저 본다 — 이때 본인 방문 표시가 남아, ID를 넣기 전에 다녀간 표시도 쓸 수 있다
    const open = this.gate.open;
    this.decided = {
      // GA4는 GtagAnalytics가 스스로 같은 조건(조립할 때 넣은 enabled)을 본다 — 이벤트를 보낼 때도 같은 판단을 써야 해서다
      gtagSrc: this.gtag?.start() ? this.gtag.scriptSrc : null,
      naverSrc: this.naver && open && this.env.onProduction() ? NaverAnalyticsScript.SRC : null,
    };
    return this.decided;
  }

  /**
   * 네이버로 페이지뷰를 한 번 보낸다. 스크립트를 다 불러온 뒤와, 화면 안에서 경로가 바뀔 때마다 부른다 —
   * 네이버 스크립트는 화면 안 이동(/app의 메뉴 이동 등)을 스스로 잡지 못한다(2026-11-27 나가는 요청으로 확인, 명세 §2-2-7).
   * 스크립트가 아직 없으면 아무 일도 없다
   */
  naverPageView(): void {
    this.naver?.pageView();
  }
}
