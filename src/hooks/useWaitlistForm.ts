"use client";

import { useState } from "react";
import { useHomeFunnel } from "@/components/analytics/HomeFunnelProvider";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { waitlistApiClient } from "@/infrastructure/container";
import { WaitlistFormFlow } from "@/interaction/WaitlistFormFlow";

// WaitlistFormFlow · WaitlistApiClient를 신청 창에 연결하는 얇은 어댑터
export function useWaitlistForm(source: WaitlistSource | null) {
  const [flow, setFlow] = useState(() => new WaitlistFormFlow());
  const funnel = useHomeFunnel();

  const submit = async () => {
    if (!flow.canSubmit) return;
    setFlow(flow.submit());
    const result = await waitlistApiClient.register({ email: flow.email, consent: flow.consent, source });
    // 결과 한 번에 이벤트 하나(성공 generate_lead · 실패 waitlist_error). 이메일은 보내지 않는다
    if (source) funnel?.waitlistFinished(source, result);
    setFlow((f) => (result.ok ? f.succeed() : f.fail(result.code)));
  };

  return {
    flow,
    typeEmail: (email: string) => setFlow((f) => f.typeEmail(email)),
    setConsent: (consent: boolean) => setFlow((f) => f.setConsent(consent)),
    submit,
  };
}
