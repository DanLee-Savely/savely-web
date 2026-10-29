import { EmailAddress } from "@/domain/waitlist/EmailAddress";
import type { WaitlistErrorCode } from "@/domain/waitlist/WaitlistResult";

export type WaitlistFormStatus = "idle" | "filled" | "submitting" | "done" | "error";
type Phase = "editing" | "submitting" | "done";

// I8 신청 창 폼 상태: 기본 → 입력됨 → 전송 중 → 완료 / 오류. 불변 — 바꿀 때마다 새 객체
export class WaitlistFormFlow {
  constructor(
    readonly email = "",
    readonly consent = false,
    private readonly phase: Phase = "editing",
    readonly error: WaitlistErrorCode | null = null,
  ) {}

  /** 버튼 활성 조건: 이메일 형식이 맞고 동의를 체크했을 때 */
  get canSubmit(): boolean {
    return this.phase === "editing" && this.consent && EmailAddress.isValid(this.email);
  }

  get status(): WaitlistFormStatus {
    if (this.phase !== "editing") return this.phase;
    if (this.error) return "error";
    return this.canSubmit ? "filled" : "idle";
  }

  typeEmail(email: string): WaitlistFormFlow {
    return this.phase === "editing" ? new WaitlistFormFlow(email, this.consent) : this;
  }

  setConsent(consent: boolean): WaitlistFormFlow {
    return this.phase === "editing" ? new WaitlistFormFlow(this.email, consent) : this;
  }

  submit(): WaitlistFormFlow {
    return this.canSubmit ? new WaitlistFormFlow(this.email, this.consent, "submitting") : this;
  }

  succeed(): WaitlistFormFlow {
    return this.phase === "submitting" ? new WaitlistFormFlow(this.email, this.consent, "done") : this;
  }

  fail(code: WaitlistErrorCode): WaitlistFormFlow {
    return this.phase === "submitting" ? new WaitlistFormFlow(this.email, this.consent, "editing", code) : this;
  }
}
