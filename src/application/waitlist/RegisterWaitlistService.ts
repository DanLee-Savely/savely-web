import { EmailAddress } from "@/domain/waitlist/EmailAddress";
import { WaitlistEntry } from "@/domain/waitlist/WaitlistEntry";
import type { SaveResult, WaitlistRepository } from "@/domain/waitlist/WaitlistRepository";
import type { WaitlistSource } from "@/domain/waitlist/WaitlistSource";

export type RegisterWaitlistCommand = { email: string; consent: boolean; source: WaitlistSource | null };

// 출시 알림 신청: 이메일 검증 → 동의 확인 · 항목 생성 → 저장. 중복도 성공으로 돌려준다(가입 여부 노출 금지)
export class RegisterWaitlistService {
  constructor(
    private readonly repository: WaitlistRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(command: RegisterWaitlistCommand): Promise<SaveResult> {
    const entry = WaitlistEntry.create({
      email: EmailAddress.create(command.email),
      consent: command.consent,
      source: command.source,
      now: this.now(),
    });
    return this.repository.save(entry);
  }
}
