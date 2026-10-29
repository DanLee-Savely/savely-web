import type { WaitlistResult } from "@/domain/waitlist/WaitlistResult";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";

export type WaitlistRequest = { email: string; consent: boolean; source: WaitlistSource | null };

// 브라우저 → 출시 알림 API. 응답을 결과 객체로 바꾼다 (예외를 던지지 않는다)
export class WaitlistApiClient {
  constructor(private readonly endpoint: string) {}

  async register(request: WaitlistRequest): Promise<WaitlistResult> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await res.json()) as WaitlistResult;
      return body.ok ? { ok: true } : { ok: false, code: body.code ?? "SERVER_ERROR" };
    } catch {
      return { ok: false, code: "NETWORK" };
    }
  }
}
