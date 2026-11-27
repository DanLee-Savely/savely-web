import { describe, expect, it } from "vitest";
import { homeContent } from "@/content/home.content";
import { AMPLITUDE_API_KEY, ANALYTICS_HOSTNAME, GA4_MEASUREMENT_ID, GOOGLE_TAG_ID, NAVER_ANALYTICS_ID } from "./config";

// 측정 ID와 개인정보처리방침은 같이 움직인다 (90-measurement-search §2-6)
describe("방문 통계 설정", () => {
  it("ID는 비어 있거나 올바른 꼴이다 — 주소에 그대로 들어가는 값이라 글자 종류를 좁힌다", () => {
    expect(GOOGLE_TAG_ID === "" || /^(GTM|G|GT|AW)-[A-Z0-9]+$/.test(GOOGLE_TAG_ID)).toBe(true);
    expect(GA4_MEASUREMENT_ID === "" || /^G-[A-Z0-9]+$/.test(GA4_MEASUREMENT_ID)).toBe(true);
    expect(NAVER_ANALYTICS_ID === "" || /^[A-Za-z0-9_]+$/.test(NAVER_ANALYTICS_ID)).toBe(true);
    expect(AMPLITUDE_API_KEY === "" || /^[0-9a-f]{32}$/.test(AMPLITUDE_API_KEY)).toBe(true);
  });

  it("실서비스 주소는 사이트 주소와 같다", () => {
    expect(ANALYTICS_HOSTNAME).toBe(homeContent.footer.site);
  });

  it("개인정보처리방침에 방문 통계 · 받는 곳(Google) · 쿠키 거부 방법이 있다 — ID를 넣는 배포에 반드시 함께 있어야 한다", () => {
    const sections = homeContent.privacy.sections;
    const text = (n: number) => sections.find((s) => s.title.startsWith(`${n}. `))?.items.join("\n") ?? "";
    expect(sections.map((s) => s.title)).toEqual([
      "1. 처리 목적", "2. 처리 항목", "3. 보유 기간과 파기", "4. 제3자 제공", "5. 처리 위탁과 국외 이전", "6. 쿠키 등 자동 수집 장치",
      "7. 정보주체의 권리", "8. 안전성 확보 조치", "9. 개인정보 보호책임자", "10. 권익 침해 구제", "11. 방침 변경",
    ]);
    expect(text(2)).toContain("방문 통계:");
    expect(text(2)).not.toContain("쿠키는 저장하지 않아요");
    expect(text(5)).toContain("받는 곳 ③: Google LLC (미국)");
    expect(text(6)).toContain("거부 방법:");
    expect(text(6)).toContain("브라우저 설정에서 이 사이트(savelyglobal.com)의 쿠키를 막으면 방문 통계에 포함되지 않아요.");
    expect(text(6)).toContain("tools.google.com/dlpage/gaoptout");
  });

  it("네이버 애널리틱스 ID와 방침의 네이버 문장은 함께 있거나 함께 없다 (§2-9 — 꺼 둔 동안에는 방침에 적지 않는다)", () => {
    const policy = homeContent.privacy.sections.flatMap((s) => s.items).join("\n");
    const on = NAVER_ANALYTICS_ID !== "";
    expect(policy.includes("네이버 애널리틱스")).toBe(on);
    expect(policy.includes("받는 곳 ⑤: 네이버 주식회사 (대한민국)")).toBe(on);
  });

  it("Amplitude 키와 방침의 Amplitude 문장은 함께 있거나 함께 없다 (§2-11 — 키를 넣는 배포에 방침 변경이 함께 있어야 한다)", () => {
    const sections = homeContent.privacy.sections;
    const text = (n: number) => sections.find((s) => s.title.startsWith(`${n}. `))?.items.join("\n") ?? "";
    const on = AMPLITUDE_API_KEY !== "";
    expect(text(2).includes("Google 애널리틱스 · Amplitude의 쿠키로")).toBe(on);
    expect(text(2).includes("Amplitude에는 접속 IP 주소도 기록돼요.")).toBe(on);
    expect(text(5).includes("받는 곳 ④: Amplitude, Inc. (미국)")).toBe(on);
    expect(text(6).includes("Google 애널리틱스 · Amplitude가 브라우저에 쿠키를 저장해")).toBe(on);
    // 세션 리플레이를 끄고 /app에서 누른 요소를 수집하지 않는 동안에만 사실인 문장 — 설정을 바꾸면 이 문장도 함께 고친다
    expect(text(2)).toContain("이메일 · 대화로 적은 문장 · 기록 내용은 보내지 않아요.");
  });
});
