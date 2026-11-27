import { describe, expect, it } from "vitest";
import type { AnalyticsEvent, AnalyticsPort } from "./AnalyticsPort";
import { AssistantFunnel } from "./AssistantFunnel";
import { HomeFunnel } from "./HomeFunnel";

// 흐름 → 이벤트 (90-measurement-search §2-3 · §5-8)
const recorder = () => {
  const events: AnalyticsEvent[] = [];
  const port: AnalyticsPort = { track: (event) => void events.push(event) };
  return { events, port };
};

describe("HomeFunnel — 소개 사이트", () => {
  it("section_view는 섹션별로 한 번만 보낸다", () => {
    const { events, port } = recorder();
    const funnel = new HomeFunnel(port);
    for (const section of ["hero", "empathy", "hero", "empathy", "problem"]) funnel.sectionSeen(section);
    expect(events).toEqual([
      { name: "section_view", section: "hero" },
      { name: "section_view", section: "empathy" },
      { name: "section_view", section: "problem" },
    ]);
  });

  it("last_section은 볼 때마다 바뀐다 — 다시 올라가 본 섹션도 마지막으로 본 섹션이다", () => {
    const { events, port } = recorder();
    const funnel = new HomeFunnel(port);
    funnel.waitlistOpened("gnb");
    funnel.sectionSeen("hero");
    funnel.sectionSeen("reward");
    funnel.waitlistOpened("floating");
    funnel.sectionSeen("hero"); // 이미 본 섹션 — section_view는 다시 보내지 않는다
    funnel.waitlistOpened("hero");
    expect(events.filter((e) => e.name === "waitlist_open")).toEqual([
      { name: "waitlist_open", source: "gnb" }, // 아직 아무 섹션도 보지 않았으면 last_section 칸이 없다
      { name: "waitlist_open", source: "floating", last_section: "reward" },
      { name: "waitlist_open", source: "hero", last_section: "hero" },
    ]);
  });

  it("신청 성공이면 generate_lead를 한 번만, 실패면 waitlist_error를 code와 함께 보낸다", () => {
    const { events, port } = recorder();
    const funnel = new HomeFunnel(port);
    funnel.sectionSeen("waitlist");
    funnel.waitlistFinished("final-cta", { ok: false, code: "RATE_LIMITED" });
    funnel.waitlistFinished("final-cta", { ok: true });
    expect(events.slice(1)).toEqual([
      { name: "waitlist_error", source: "final-cta", code: "RATE_LIMITED" },
      { name: "generate_lead", source: "final-cta", last_section: "waitlist" },
    ]);
    expect(events.filter((e) => e.name === "generate_lead")).toHaveLength(1);
  });

  it("가이드 글 화면에서는 신청 · 체험판 이벤트에 guide_slug가 함께 실린다 (91-content §4-6)", () => {
    const { events, port } = recorder();
    const funnel = new HomeFunnel(port, "gagyebu-habit");
    funnel.waitlistOpened("guide");
    funnel.waitlistFinished("guide", { ok: true });
    funnel.demoClicked("guide");
    expect(events).toEqual([
      { name: "waitlist_open", source: "guide", guide_slug: "gagyebu-habit" },
      { name: "generate_lead", source: "guide", guide_slug: "gagyebu-habit" },
      { name: "demo_click", placement: "guide", guide_slug: "gagyebu-habit" },
    ]);
  });

  it("소개 페이지의 체험판 링크는 놓인 곳만 보낸다", () => {
    const { events, port } = recorder();
    const funnel = new HomeFunnel(port);
    funnel.demoClicked("hero");
    funnel.demoClicked("assistant");
    expect(events).toEqual([{ name: "demo_click", placement: "hero" }, { name: "demo_click", placement: "assistant" }]);
  });
});

describe("AssistantFunnel — 체험판 대화 패널", () => {
  it("연 길 · 만든 초안 수 · 저장 건수만 보낸다", () => {
    const { events, port } = recorder();
    const funnel = new AssistantFunnel(port);
    funnel.opened("deeplink");
    funnel.sent({ drafts: 2, rateLimited: false });
    funnel.saved(2);
    expect(events).toEqual([
      { name: "assistant_open", entry: "deeplink" },
      { name: "assistant_send", drafts: 2 },
      { name: "assistant_save", count: 2 },
    ]);
  });

  it("요청 제한에 걸린 문장은 초안 0건과 한도 이벤트를 보낸다. 저장 · 등록의 요청 제한도 같은 한도 이벤트다", () => {
    const { events, port } = recorder();
    const funnel = new AssistantFunnel(port);
    funnel.sent({ drafts: 0, rateLimited: true });
    funnel.limited();
    expect(events).toEqual([
      { name: "assistant_send", drafts: 0 },
      { name: "assistant_limit", kind: "rate" },
      { name: "assistant_limit", kind: "rate" },
    ]);
  });

  it("어떤 이벤트에도 글자를 그대로 싣는 칸이 없다 — 이름을 빼면 정해진 낱말과 숫자뿐이다", () => {
    const { events, port } = recorder();
    const home = new HomeFunnel(port, "gagyebu-habit");
    const app = new AssistantFunnel(port);
    home.sectionSeen("hero");
    home.waitlistOpened("hero");
    home.waitlistFinished("hero", { ok: true });
    home.waitlistFinished("hero", { ok: false, code: "NETWORK" });
    home.demoClicked("hero");
    app.opened("home_composer");
    app.sent({ drafts: 3, rateLimited: true });
    app.saved(3);
    const ALLOWED = ["section", "source", "last_section", "guide_slug", "code", "placement", "entry", "drafts", "count", "kind"];
    for (const { name, ...params } of events) {
      for (const [key, value] of Object.entries(params)) {
        expect(ALLOWED, `${name}.${key}`).toContain(key);
        expect(typeof value === "number" || /^[A-Za-z0-9_-]+$/.test(String(value)), `${name}.${key}=${String(value)}`).toBe(true);
      }
    }
  });
});
