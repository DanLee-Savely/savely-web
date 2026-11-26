import type { CardRepository, OwnedCard } from "@/domain/card/OwnedCard";
import type { RecurringItemData, RecurringItemRepository } from "@/domain/recurring/RecurringItem";

// 단위 테스트 전용 저장소. 실행 환경의 저장소로 쓰지 않는다
export class InMemoryCardRepository implements CardRepository {
  private readonly cards: OwnedCard[] = [];

  async list(): Promise<OwnedCard[]> {
    return [...this.cards];
  }

  async insert(card: OwnedCard): Promise<boolean> {
    if (this.cards.some((c) => c.name === card.name)) return false;
    this.cards.push(card);
    return true;
  }
}

export class InMemoryRecurringItemRepository implements RecurringItemRepository {
  private items: RecurringItemData[] = [];

  async list(): Promise<RecurringItemData[]> {
    return [...this.items];
  }

  async insert(item: RecurringItemData): Promise<void> {
    this.items.push(item);
  }

  async update(item: RecurringItemData): Promise<boolean> {
    const found = this.items.some((i) => i.id === item.id);
    this.items = this.items.map((i) => (i.id === item.id ? item : i));
    return found;
  }

  async remove(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return this.items.length < before;
  }
}
