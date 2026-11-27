import type { AnalyticsEvent, AnalyticsPort } from "@/application/analytics/AnalyticsPort";

export type GtagWindow = { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export type GtagOptions = {
  /** Google 태그 ID — 설치 코드의 `gtm.js?id=` 뒤에 오는 값 */
  tagId: string;
  /** 브라우저의 window. 서버에서는 null */
  window: () => GtagWindow | null;
  /** 지금 이 방문에서 보내도 되는가 — 실서비스 주소이고(또는 개발 중 확인을 켰고) 통계에 넣어도 되는 방문인가(VisitGate) */
  enabled: () => boolean;
  /** GA4 DebugView로 보낼 것인가(개발 중 확인) */
  debug: () => boolean;
};

// GA4(gtag.js)로 이벤트를 보낸다 (90-measurement-search §2-2).
// GA4 관리 화면이 준 설치 코드와 같다(2026-11-26 대조): 스크립트 `https://www.googletagmanager.com/gtm.js?id=<태그 ID>`
//   + dataLayer + gtag('js', new Date()). config 줄은 없다.
// 설치 코드와 다른 점은 불러오는 때뿐이다: <head>의 async 대신 next/script afterInteractive로 늦게 불러온다(첫 화면을 막지 않게, 명세 §2-2-8)
export class GtagAnalytics implements AnalyticsPort {
  private started = false;
  /** 이벤트마다 함께 싣는 표시 */
  private marks: Record<string, boolean> = {};

  constructor(private readonly options: GtagOptions) {}

  /** 불러올 스크립트 주소 */
  get scriptSrc(): string {
    return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(this.options.tagId)}`;
  }

  /**
   * 보내도 되는 방문이면 큐를 만들고 처음 한 번 js를 넣는다. 보낼 수 있으면 true.
   * 보낼지와 디버그 표시는 방문마다 한 번만 정한다 — 화면 안에서 주소가 바뀌어도(예: `/app?chat=1` → `/app`) 도중에 끊기거나 바뀌지 않는다
   */
  start(): boolean {
    if (this.started) return true;
    const w = this.options.window();
    if (!w || !this.options.enabled()) return false;
    this.started = true;
    this.marks = this.options.debug() ? { debug_mode: true } : {};
    const layer = (w.dataLayer ??= []);
    // Google 태그는 배열이 아니라 arguments 객체가 큐에 들어오기를 기대한다(설치 코드의 정의 그대로)
    w.gtag ??= function gtag() {
      // eslint-disable-next-line prefer-rest-params
      layer.push(arguments);
    };
    w.gtag("js", new Date());
    return true;
  }

  /**
   * 이벤트 이름과 매개변수를 그대로 보낸다. 값이 없는 칸은 뺀다.
   * 디버그 표시는 이벤트마다 매개변수로 싣는다 — 이 설치 코드(gtm.js)에서는 gtag('set')으로 넣은 debug_mode가
   * 요청에 붙지 않았다(2026-11-26 나가는 요청으로 확인: 이벤트마다 넣으면 ep.debug_mode=true가 붙는다).
   * ⚠️ Google 태그가 스스로 보내는 이벤트(page_view · scroll · form_start)에는 이 표시가 붙지 않는다.
   *    그래서 본인 방문은 표시를 붙여 거르지 않고, 스크립트를 아예 불러오지 않는 것으로 뺀다(VisitGate, 명세 §2-9)
   */
  track(event: AnalyticsEvent): void {
    if (!this.start()) return;
    const { name, ...rest } = event;
    const params = { ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)), ...this.marks };
    this.options.window()?.gtag?.("event", name, params);
  }
}
