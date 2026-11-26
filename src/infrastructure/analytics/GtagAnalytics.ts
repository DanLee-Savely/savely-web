import type { AnalyticsEvent, AnalyticsPort } from "@/application/analytics/AnalyticsPort";

export type GtagWindow = { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export type GtagOptions = {
  /** GA4 측정 ID(G-…) */
  measurementId: string;
  /** 브라우저의 window. 서버에서는 null */
  window: () => GtagWindow | null;
  /** 지금 이 방문에서 보내도 되는가 — 실서비스 주소인가(또는 개발 중 확인을 켰는가) */
  enabled: () => boolean;
  /** 대표 본인 방문인가 — 이벤트에 traffic_type=internal을 붙인다 */
  internal: () => boolean;
  /** GA4 DebugView로 보낼 것인가(개발 중 확인) */
  debug: () => boolean;
};

// GA4(gtag.js)로 이벤트를 보낸다 (90-measurement-search §2-2).
// Google 태그 설치 안내(developers.google.com/tag-platform/gtagjs/install, 2026-11-26 확인)를 따른다:
//   스크립트 `https://www.googletagmanager.com/gtm.js?id=<ID>` + dataLayer + gtag('js', new Date()).
//   gtag('config')는 더 쓰지 않는다고 안내한다 — 페이지에서 붙이는 매개변수는 gtag('set')으로 넣는다.
// ⚠️ ID를 받으면 GA4 관리 화면이 보여 주는 설치 코드와 한 번 대조한다(스크립트 주소가 다르면 scriptSrc만 고치면 된다)
export class GtagAnalytics implements AnalyticsPort {
  private started = false;

  constructor(private readonly options: GtagOptions) {}

  /** 불러올 스크립트 주소 */
  get scriptSrc(): string {
    return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(this.options.measurementId)}`;
  }

  /**
   * 보내도 되는 방문이면 큐를 만들고 처음 한 번 js · set을 넣는다. 보낼 수 있으면 true.
   * 보낼지는 방문마다 한 번만 정한다 — 화면 안에서 주소가 바뀌어도(예: `/app?chat=1` → `/app`) 도중에 끊기지 않는다
   */
  start(): boolean {
    if (this.started) return true;
    const w = this.options.window();
    if (!w || !this.options.enabled()) return false;
    this.started = true;
    const layer = (w.dataLayer ??= []);
    // Google 태그는 배열이 아니라 arguments 객체가 큐에 들어오기를 기대한다(설치 안내의 정의 그대로)
    w.gtag ??= function gtag() {
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
    w.gtag("js", new Date());
    const params = { ...(this.options.internal() && { traffic_type: "internal" }), ...(this.options.debug() && { debug_mode: true }) };
    if (Object.keys(params).length) w.gtag("set", params);
    return true;
  }

  /** 이벤트 이름과 매개변수를 그대로 보낸다. 값이 없는 칸은 뺀다 */
  track(event: AnalyticsEvent): void {
    if (!this.start()) return;
    const { name, ...rest } = event;
    const params = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined));
    this.options.window()?.gtag?.("event", name, params);
  }
}
