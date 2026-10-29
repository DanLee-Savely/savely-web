// 신청 결과 (API 응답 본문 · 30-waitlist §2). NETWORK는 브라우저에서 서버에 닿지 못한 경우
export type WaitlistErrorCode = "INVALID_EMAIL" | "CONSENT_REQUIRED" | "RATE_LIMITED" | "SERVER_ERROR" | "NETWORK";
export type WaitlistResult = { ok: true } | { ok: false; code: WaitlistErrorCode };
