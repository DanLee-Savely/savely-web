import type { Types } from "@amplitude/unified";
import type { AnalyticsEvent, AnalyticsPort } from "@/application/analytics/AnalyticsPort";

/** Amplitude 통계 SDK 설정 */
export type AmplitudeInitOptions = Types.BrowserOptions;

/** Amplitude 클라이언트에서 쓰는 부분 */
export type AmplitudeClient = {
  /**
   * 통계만 켠다. ⚠️ `initAll`을 쓰지 않는다 — 그쪽은 세션 리플레이 · Experiment · Guides and Surveys를 함께 켜고,
   * Guides and Surveys 스크립트를 Amplitude CDN에서 내려받아 실행한다(2026-11-27 나가는 요청으로 확인, 명세 §2-11)
   */
  init: (apiKey: string, userId: string | undefined, options: AmplitudeInitOptions) => { promise: Promise<void> };
  track: (eventName: string, eventProperties?: Record<string, unknown>) => unknown;
};

export type AmplitudeOptions = {
  /** 프로젝트 API 키 — 공개 값(수집 전용) */
  apiKey: string;
  /** 지금 이 방문에서 보내도 되는가 — 실서비스 주소이고(또는 개발 중 확인을 켰고) 통계에 넣어도 되는 방문인가(VisitGate) */
  enabled: () => boolean;
  /** SDK를 불러와 클라이언트를 만든다. 보내도 되는 방문에서만 부른다 */
  load: () => Promise<AmplitudeClient>;
};

/**
 * Amplitude 설정 (90-measurement-search §2-11, 대표 결정 2026-11-27).
 * 자동 수집: 페이지뷰(`[Amplitude] Page Viewed`) · 세션 · 유입 경로 · 폼 · 파일 받기 · 네트워크 오류 · 웹 바이탈.
 * 방침 2번 「이메일 · 대화로 적은 문장 · 기록 내용은 보내지 않아요」를 지키려고 꺼 둔 것:
 *   ① 누른 요소 · 답답한 클릭 자동 수집 — 누른 요소의 글자와 속성(예: 달력 칸의 금액이 든 aria-label)이 실린다.
 *      무엇을 눌렀는지는 우리가 보내는 이벤트(§2-3)로 본다
 *   ② 세션 리플레이 — 통계만 켜서(init) 플러그인 자체가 붙지 않는다
 * 페이지뷰는 경로가 바뀔 때만 센다(쿼리 · 해시만 바뀐 것은 세지 않는다).
 * 원격 설정은 받아 오지 않는다 — Amplitude 관리 화면의 자동 수집 설정이 이 값을 덮어쓰지 못하게 한다
 * (관리 화면에서 누른 요소 수집을 켜면 ①이 풀려 방침 2번이 사실과 달라진다)
 */
export const AMPLITUDE_INIT_OPTIONS: AmplitudeInitOptions = {
  serverZone: "US",
  remoteConfig: { fetchRemoteConfig: false },
  autocapture: {
    attribution: true,
    fileDownloads: true,
    formInteractions: true,
    pageViews: { trackHistoryChanges: "pathOnly" },
    sessions: true,
    networkTracking: true,
    webVitals: true,
    elementInteractions: false,
    frustrationInteractions: false,
  },
};

// Amplitude로 보낸다 (90-measurement-search §2-11). 이벤트는 GA4와 같은 이름 · 같은 매개변수다(§2-3).
// GA4와 같은 조건을 쓴다: 실서비스 주소에서만, 쿠키 · 사이트 저장소를 쓸 수 없는 브라우저와 본인 방문 표시가 있는 브라우저에서는
// SDK를 아예 불러오지 않는다(VisitGate). 보낼지는 방문마다 한 번만 정한다
export class AmplitudeAnalytics implements AnalyticsPort {
  private client: Promise<AmplitudeClient | null> | null = null;

  constructor(private readonly options: AmplitudeOptions) {}

  /**
   * 보내도 되는 방문이면 SDK를 불러와 켠다. 페이지를 열 때 한 번 부른다 —
   * 화면 진입(`[Amplitude] Page Viewed`)은 SDK가 스스로 보낸다(화면 안 이동 포함). 우리가 따로 보내지 않는다
   */
  start(): void {
    void this.connected();
  }

  /** 이벤트 이름과 매개변수를 그대로 보낸다. 값이 없는 칸은 뺀다. 보내면 안 되는 방문이면 아무 일도 없다 */
  track(event: AnalyticsEvent): void {
    const { name, ...rest } = event;
    const properties = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined));
    void this.connected().then((client) => client?.track(name, properties));
  }

  private connected(): Promise<AmplitudeClient | null> {
    this.client ??= this.options.enabled() ? this.connect() : Promise.resolve(null);
    return this.client;
  }

  /** 불러오지 못하거나 켜지 못하면(네트워크 · 차단 확장) 이 방문에서는 보내지 않는다 — 통계 때문에 화면이 멈추면 안 된다 */
  private async connect(): Promise<AmplitudeClient | null> {
    try {
      const client = await this.options.load();
      // ⚠️ 설정은 반드시 세 번째 인자로 넘긴다. @amplitude/unified의 init은 안에서 늘 인자 3개로 넘겨서,
      //    두 번째 인자로 준 설정은 통째로 user_id가 되고 설정은 무시된다(2026-11-27 나가는 요청으로 확인, 명세 §2-11).
      //    사용자 ID는 쓰지 않는다 — 로그인이 없다
      await client.init(this.options.apiKey, undefined, AMPLITUDE_INIT_OPTIONS).promise;
      return client;
    } catch {
      return null;
    }
  }
}
