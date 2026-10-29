import type { EmailAddress } from "./EmailAddress";
import { ConsentRequiredError } from "./errors";
import type { WaitlistSource } from "./WaitlistSource";

export type WaitlistRecord = {
  email: string;
  consentedAt: string;
  createdAt: string;
  source: WaitlistSource | null;
};

// 엔티티: 저장하는 것은 이메일 · 동의 시각 · 신청 시각 · 신청 위치뿐 (IP · 기기 정보 없음)
export class WaitlistEntry {
  private constructor(
    private readonly email: EmailAddress,
    private readonly consentedAt: Date,
    private readonly createdAt: Date,
    private readonly source: WaitlistSource | null,
  ) {}

  static create(input: { email: EmailAddress; consent: boolean; source: WaitlistSource | null; now: Date }): WaitlistEntry {
    if (input.consent !== true) throw new ConsentRequiredError();
    return new WaitlistEntry(input.email, input.now, input.now, input.source);
  }

  toRecord(): WaitlistRecord {
    return {
      email: this.email.toString(),
      consentedAt: this.consentedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      source: this.source,
    };
  }
}
