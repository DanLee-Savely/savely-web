import type { UnifiedOptions } from "@amplitude/unified";

/** Amplitude Unified SDK에서 쓰는 부분 */
export type AmplitudeSdk = {
  /** ⚠️ 키는 첫 번째 인자다 — 옵션 객체 하나만 넘기면 오류 없이 아무것도 보내지 않는다 */
  initAll: (apiKey: string, options?: UnifiedOptions) => Promise<void>;
  track: (eventName: string) => unknown;
};

export type AmplitudeOptions = {
  /** 프로젝트 API 키 — 공개 값(수집 전용) */
  apiKey: string;
  /** 지금 이 방문에서 보내도 되는가 — 실서비스 주소이고(또는 개발 중 확인을 켰고) 통계에 넣어도 되는 방문인가(VisitGate) */
  enabled: () => boolean;
  /** SDK를 불러온다. 보내도 되는 방문에서만 부른다 */
  load: () => Promise<AmplitudeSdk>;
};

/** 화면 진입 이벤트 이름 (다른 이벤트와 같은 이름 규칙 — 소문자 + 밑줄) */
export const AMPLITUDE_PAGE_VIEW = "page_view";

/**
 * 기록 체험판(/app) 주소. 여기서는 누른 요소를 수집하지 않는다 —
 * 누른 요소 이벤트에는 그 요소의 글자와 속성(예: 달력 칸의 금액이 든 aria-label)이 실려 기록 내용이 나갈 수 있다
 */
export const AMPLITUDE_DEMO_APP_URL = /^https?:\/\/[^/]+\/app(?:[/?#]|$)/;

/**
 * Amplitude 설정 (90-measurement-search §2-11, 대표 결정 2026-11-27).
 * 자동 수집은 전부 켠다(페이지뷰 · 세션 · 유입 경로 · 폼 · 파일 받기 · 누른 요소 · 답답한 클릭 · 네트워크 오류 · 웹 바이탈).
 * 설치 기본값과 다른 곳은 두 가지다 — 방침 2번 「이메일 · 대화로 적은 문장 · 기록 내용은 보내지 않아요」를 지키기 위해서다:
 *   ① 세션 리플레이는 끈다(sampleRate 0). 리플레이는 화면에 보이는 글자를 그대로 담는다
 *   ② /app에서는 누른 요소 · 답답한 클릭을 수집하지 않는다
 * ⚠️ 리플레이는 Amplitude 관리 화면의 원격 설정이 이 값보다 우선한다 — 관리 화면에서도 꺼 둔다
 */
export const AMPLITUDE_INIT_OPTIONS: UnifiedOptions = {
  serverZone: "US",
  analytics: {
    autocapture: {
      attribution: true,
      fileDownloads: true,
      formInteractions: true,
      pageViews: true,
      sessions: true,
      networkTracking: true,
      webVitals: true,
      elementInteractions: { pageUrlExcludelist: [AMPLITUDE_DEMO_APP_URL] },
      frustrationInteractions: { pageUrlExcludelist: [AMPLITUDE_DEMO_APP_URL] },
    },
  },
  sessionReplay: { sampleRate: 0 },
};

// Amplitude로 보낸다 (90-measurement-search §2-11).
// GA4와 같은 조건을 쓴다: 실서비스 주소에서만, 쿠키 · 사이트 저장소를 쓸 수 없는 브라우저와 본인 방문 표시가 있는 브라우저에서는
// SDK를 아예 불러오지 않는다(VisitGate). 보낼지는 방문마다 한 번만 정한다
export class AmplitudeAnalytics {
  private sdk: Promise<AmplitudeSdk | null> | null = null;

  constructor(private readonly options: AmplitudeOptions) {}

  /** 화면에 들어왔다. 처음 부를 때 SDK를 불러와 켠다 — 보내면 안 되는 방문이면 아무 일도 없다 */
  pageView(): void {
    void this.start().then((sdk) => sdk?.track(AMPLITUDE_PAGE_VIEW));
  }

  private start(): Promise<AmplitudeSdk | null> {
    this.sdk ??= this.options.enabled() ? this.connect() : Promise.resolve(null);
    return this.sdk;
  }

  /** 불러오지 못하거나 켜지 못하면(네트워크 · 차단 확장) 이 방문에서는 보내지 않는다 — 통계 때문에 화면이 멈추면 안 된다 */
  private async connect(): Promise<AmplitudeSdk | null> {
    try {
      const sdk = await this.options.load();
      await sdk.initAll(this.options.apiKey, AMPLITUDE_INIT_OPTIONS);
      return sdk;
    } catch {
      return null;
    }
  }
}
