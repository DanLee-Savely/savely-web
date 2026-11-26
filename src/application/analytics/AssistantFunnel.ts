import type { AnalyticsPort, AssistantEntryPoint } from "./AnalyticsPort";

/** 문장 한 번의 결과에서 통계에 필요한 것만: 초안 수와 요청 제한 여부. 문장 · 금액은 받지 않는다 */
export type SendSummary = { drafts: number; rateLimited: boolean };

// 체험판 대화 패널의 흐름을 이벤트로 옮긴다 (90-measurement-search §2-3).
// 여기로는 낱말과 개수만 들어온다 — 문장 · 금액 · 카드 이름은 이 클래스까지 오지 않는다
export class AssistantFunnel {
  constructor(private readonly analytics: AnalyticsPort) {}

  opened(entry: AssistantEntryPoint): void {
    this.analytics.track({ name: "assistant_open", entry });
  }

  /** 문장을 보낸 결과가 왔다. 요청 제한에 걸렸으면 한도 이벤트도 보낸다 */
  sent({ drafts, rateLimited }: SendSummary): void {
    this.analytics.track({ name: "assistant_send", drafts });
    if (rateLimited) this.limited();
  }

  saved(count: number): void {
    this.analytics.track({ name: "assistant_save", count });
  }

  /** 「요청이 너무 많아요」 안내가 보였다(문장 보내기 · 저장 · 등록) */
  limited(): void {
    this.analytics.track({ name: "assistant_limit", kind: "rate" });
  }
}
