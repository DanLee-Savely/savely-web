import type { WaitlistErrorCode } from "@/domain/waitlist/WaitlistResult";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";

// 방문 통계로 보내는 이벤트 (90-measurement-search §2-3). 화면 · 훅은 이 포트만 부른다 — gtag를 직접 부르지 않는다.
// ⚠️ 보내지 않는 것: 이메일, 대화로 적은 문장, 기록 내용 · 금액 · 메모, 카드 이름, 입력값.
//    그래서 이벤트에는 글자를 그대로 싣는 칸이 없다 — 정해진 낱말과 개수만 있다. 칸을 더할 때 이 규칙을 지킨다

/** 체험판 링크가 놓인 곳 */
export type DemoPlacement = "hero" | "assistant" | "guide";

/**
 * 대화 패널을 연 길 (80-record-assistant §3-3 E1~E5).
 * deeplink: `/app?chat=1`(소개 사이트의 버튼) · home_button: 홈 오른쪽 위 버튼 · home_composer: 홈 입력칸 ·
 * example_chip: 홈 예시 칩 · form_button: 기록하기 폼의 「대화로 적기」 · floating_button: 기록 · 달력 · 리포트의 떠 있는 버튼
 */
export type AssistantEntryPoint = "deeplink" | "home_button" | "home_composer" | "example_chip" | "form_button" | "floating_button";

export type AnalyticsEvent =
  /** 섹션이 화면에 절반 이상 처음 보였다. 페이지당 섹션별 1회 */
  | { name: "section_view"; section: string }
  /** 신청 창이 열렸다. last_section = 열기 직전 마지막으로 본 섹션, guide_slug = 가이드 글에서 열었을 때 그 글 */
  | { name: "waitlist_open"; source: WaitlistSource; last_section?: string; guide_slug?: string }
  /** 신청 성공 (GA4 권장 이벤트 이름 — 핵심 이벤트) */
  | { name: "generate_lead"; source: WaitlistSource; last_section?: string; guide_slug?: string }
  | { name: "waitlist_error"; source: WaitlistSource; code: WaitlistErrorCode }
  | { name: "demo_click"; placement: DemoPlacement; guide_slug?: string }
  | { name: "assistant_open"; entry: AssistantEntryPoint }
  /** 문장을 보냈다. drafts = 그 문장으로 만든 초안 수(문장 · 금액은 보내지 않는다) */
  | { name: "assistant_send"; drafts: number }
  | { name: "assistant_save"; count: number }
  /** 한도 안내가 보였다 */
  | { name: "assistant_limit"; kind: "daily" | "rate" };

export interface AnalyticsPort {
  track(event: AnalyticsEvent): void;
}
