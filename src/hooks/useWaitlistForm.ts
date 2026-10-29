"use client";

import { useState } from "react";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { waitlistApiClient } from "@/infrastructure/container";
import { WaitlistFormFlow } from "@/interaction/WaitlistFormFlow";

// WaitlistFormFlow · WaitlistApiClient를 신청 창에 연결하는 얇은 어댑터
export function useWaitlistForm(source: WaitlistSource | null) {
  const [flow, setFlow] = useState(() => new WaitlistFormFlow());

  const submit = async () => {
    if (!flow.canSubmit) return;
    setFlow(flow.submit());
    const result = await waitlistApiClient.register({ email: flow.email, consent: flow.consent, source });
    setFlow((f) => (result.ok ? f.succeed() : f.fail(result.code)));
  };

  return {
    flow,
    typeEmail: (email: string) => setFlow((f) => f.typeEmail(email)),
    setConsent: (consent: boolean) => setFlow((f) => f.setConsent(consent)),
    submit,
  };
}
