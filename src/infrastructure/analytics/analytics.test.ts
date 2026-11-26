import { describe, expect, it } from "vitest";
import { AnalyticsLoader, NO_SCRIPTS } from "./AnalyticsLoader";
import { GtagAnalytics, type GtagWindow } from "./GtagAnalytics";
import { InternalTraffic } from "./InternalTraffic";
import { NaverAnalyticsScript, type NaverWindow } from "./NaverAnalyticsScript";
import { NoopAnalytics } from "./NoopAnalytics";

// 방문 통계 구현체 (90-measurement-search §2-2 · §5). 가짜 window로 확인한다 — 실제로는 아무 곳에도 보내지 않는다
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};
const blocked = () => {
  throw new Error("SecurityError");
};
const gtagOf = (over: Partial<ConstructorParameters<typeof GtagAnalytics>[0]> = {}) => {
  const win: GtagWindow = {};
  const gtag = new GtagAnalytics({ measurementId: "G-TEST123", window: () => win, enabled: () => true, internal: () => false, debug: () => false, ...over });
  /** 큐에 쌓인 호출(arguments 객체를 배열로) */
  const calls = () => (win.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>));
  return { win, gtag, calls };
};

describe("GtagAnalytics — 이벤트 → GA4 호출", () => {
  it("처음 한 번 js를 넣고, 이벤트는 이름과 매개변수 그대로 보낸다", () => {
    const { gtag, calls } = gtagOf();
    gtag.track({ name: "section_view", section: "hero" });
    gtag.track({ name: "generate_lead", source: "floating", last_section: "reward" });
    gtag.track({ name: "assistant_send", drafts: 2 });
    const [first, ...events] = calls();
    expect(first[0]).toBe("js");
    expect(first[1]).toBeInstanceOf(Date);
    expect(events).toEqual([
      ["event", "section_view", { section: "hero" }],
      ["event", "generate_lead", { source: "floating", last_section: "reward" }],
      ["event", "assistant_send", { drafts: 2 }],
    ]);
  });

  it("큐에는 배열이 아니라 arguments 객체가 들어간다(Google 태그가 기대하는 꼴)", () => {
    const { win, gtag } = gtagOf();
    gtag.track({ name: "demo_click", placement: "hero" });
    expect(win.dataLayer?.every((args) => !Array.isArray(args) && Object.prototype.toString.call(args) === "[object Arguments]")).toBe(true);
  });

  it("값이 없는 칸은 보내지 않는다", () => {
    const { gtag, calls } = gtagOf();
    gtag.track({ name: "waitlist_open", source: "gnb", last_section: undefined });
    expect(calls().at(-1)).toEqual(["event", "waitlist_open", { source: "gnb" }]);
  });

  it("본인 방문이면 traffic_type=internal, 개발 중 확인이면 debug_mode를 set으로 붙인다", () => {
    expect(gtagOf().calls()).toEqual([]);
    const internal = gtagOf({ internal: () => true });
    internal.gtag.track({ name: "section_view", section: "hero" });
    expect(internal.calls()[1]).toEqual(["set", { traffic_type: "internal" }]);
    const debug = gtagOf({ debug: () => true });
    debug.gtag.start();
    expect(debug.calls()[1]).toEqual(["set", { debug_mode: true }]);
    const plain = gtagOf();
    plain.gtag.start();
    expect(plain.calls().map((c) => c[0])).toEqual(["js"]);
  });

  it("보내면 안 되는 방문(실서비스 주소가 아님)과 서버에서는 큐도 만들지 않는다", () => {
    const off = gtagOf({ enabled: () => false });
    off.gtag.track({ name: "section_view", section: "hero" });
    expect(off.win).toEqual({});
    expect(off.gtag.start()).toBe(false);
    const server = new GtagAnalytics({ measurementId: "G-TEST123", window: () => null, enabled: () => true, internal: () => false, debug: () => false });
    expect(() => server.track({ name: "section_view", section: "hero" })).not.toThrow();
  });

  it("보낼지는 방문마다 한 번만 정한다 — 시작한 뒤에는 주소가 바뀌어도 끊기지 않는다", () => {
    let allowed = true;
    const { gtag, calls } = gtagOf({ enabled: () => allowed });
    gtag.track({ name: "assistant_open", entry: "deeplink" });
    allowed = false; // 화면 안 이동으로 주소의 확인 표시가 사라진 경우
    gtag.track({ name: "assistant_send", drafts: 2 });
    expect(calls().slice(1)).toEqual([["event", "assistant_open", { entry: "deeplink" }], ["event", "assistant_send", { drafts: 2 }]]);
  });

  it("스크립트 주소는 Google 태그 설치 안내의 주소에 측정 ID를 붙인 것이다", () => {
    expect(gtagOf().gtag.scriptSrc).toBe("https://www.googletagmanager.com/gtm.js?id=G-TEST123");
  });
});

describe("NoopAnalytics", () => {
  it("아무것도 하지 않는다", () => {
    expect(() => new NoopAnalytics().track()).not.toThrow();
  });
});

describe("InternalTraffic — ?sv_internal=1", () => {
  it("주소에 표시가 있으면 브라우저에 남기고, 그 뒤로는 표시가 있다", () => {
    const store = memory();
    const flag = new InternalTraffic("sv_internal", () => store);
    expect(flag.marked).toBe(false);
    flag.capture("?utm_source=naver_blog");
    flag.capture("?sv_internal=0");
    expect(flag.marked).toBe(false);
    flag.capture("?utm_source=x&sv_internal=1");
    expect(flag.marked).toBe(true);
    expect(new InternalTraffic("sv_internal", () => store).marked).toBe(true);
  });

  it("저장소를 쓸 수 없는 브라우저(쿠키를 모두 막은 경우)에서도 멈추지 않는다", () => {
    const flag = new InternalTraffic("sv_internal", blocked);
    expect(() => flag.capture("?sv_internal=1")).not.toThrow();
    expect(flag.marked).toBe(false);
  });
});

describe("NaverAnalyticsScript", () => {
  it("스크립트를 불러온 뒤 발급 ID를 넣고 페이지뷰를 보낸다", () => {
    let views = 0;
    const win: NaverWindow = { wcs: {}, wcs_do: () => void views++ };
    new NaverAnalyticsScript("s_test123", () => win).pageView();
    expect(win.wcs_add).toEqual({ wa: "s_test123" });
    expect(views).toBe(1);
  });

  it("스크립트가 아직 없으면(막혔거나 못 불러옴) 아무것도 하지 않는다", () => {
    const win: NaverWindow = {};
    expect(() => new NaverAnalyticsScript("s_test123", () => win).pageView()).not.toThrow();
    expect(win.wcs_add).toBeUndefined();
  });
});

describe("AnalyticsLoader — 스크립트를 넣을지", () => {
  const loader = (opts: { ga: boolean; naver: boolean; production: boolean; search?: string }) => {
    const store = memory();
    const internal = new InternalTraffic("sv_internal", () => store);
    const win: GtagWindow = {};
    const gtag = opts.ga ? new GtagAnalytics({ measurementId: "G-TEST123", window: () => win, enabled: () => opts.production, internal: () => internal.marked, debug: () => false }) : null;
    const naver = opts.naver ? new NaverAnalyticsScript("s_test123", () => ({})) : null;
    return { internal, plan: new AnalyticsLoader(gtag, naver, internal, { onProduction: () => opts.production, search: () => opts.search ?? "" }).plan() };
  };

  it("ID가 비어 있으면(구현체 없음) 실서비스 주소에서도 아무것도 넣지 않는다 — 지금 상태", () => {
    expect(loader({ ga: false, naver: false, production: true }).plan).toEqual(NO_SCRIPTS);
  });

  it("ID가 있어도 실서비스 주소가 아니면(localhost · 미리보기) 넣지 않는다", () => {
    expect(loader({ ga: true, naver: true, production: false }).plan).toEqual(NO_SCRIPTS);
  });

  it("ID가 있고 실서비스 주소면 두 스크립트를 넣는다", () => {
    expect(loader({ ga: true, naver: true, production: true }).plan).toEqual({ gtagSrc: "https://www.googletagmanager.com/gtm.js?id=G-TEST123", naverSrc: "//wcs.naver.net/wcslog.js" });
  });

  it("통계 도구가 꺼져 있어도 본인 방문 표시는 남긴다", () => {
    expect(loader({ ga: false, naver: false, production: true, search: "?sv_internal=1" }).internal.marked).toBe(true);
  });
});
