import { DraftValidator } from "@/domain/assistant/DraftValidator";
import { CARD_LIMITS, type CardRepository, type OwnedCard } from "@/domain/card/OwnedCard";
import type { Clock } from "@/domain/record/Clock";
import { CARD_METHODS } from "@/domain/record/RecordEntry";

export type RegisterCardOutcome = "saved" | "duplicate" | "limit" | "invalid";

// 카드 등록 (80 E). 「등록하기」를 눌러야 여기로 온다 — 문장만으로는 카드 목록이 바뀌지 않는다.
// 같은 이름이 있으면 건드리지 않는다(종류도 바꾸지 않는다). 30장까지, 이름 20자까지
export class RegisterCardService {
  constructor(
    private readonly repository: CardRepository,
    private readonly clock: Clock,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  async execute({ name, method }: { name: string; method: string }): Promise<RegisterCardOutcome> {
    const cleaned = DraftValidator.cleanCardName(name);
    if (cleaned === null || !CARD_METHODS.includes(method)) return "invalid";
    const owned = await this.repository.list();
    if (owned.some((c) => c.name === cleaned)) return "duplicate";
    if (owned.length >= CARD_LIMITS.maxCards) return "limit";
    const card: OwnedCard = { id: this.newId(), name: cleaned, method, createdAt: this.clock.now().toISOString() };
    return (await this.repository.insert(card)) ? "saved" : "duplicate";
  }
}
