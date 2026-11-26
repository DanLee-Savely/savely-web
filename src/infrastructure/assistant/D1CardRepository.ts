import type { CardRepository, OwnedCard } from "@/domain/card/OwnedCard";

// 등록 카드 (테이블 cards, migrations-records/0002). 이름에 UNIQUE 인덱스가 있다 — 같은 이름은 넣지 않는다
type CardRow = { id: string; name: string; method: string; created_at: string };

export class D1CardRepository implements CardRepository {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<OwnedCard[]> {
    const { results } = await this.db.prepare("SELECT * FROM cards ORDER BY created_at, id").all<CardRow>();
    return results.map((r) => ({ id: r.id, name: r.name, method: r.method, createdAt: r.created_at }));
  }

  async insert(card: OwnedCard): Promise<boolean> {
    const { meta } = await this.db
      .prepare("INSERT INTO cards (id, name, method, created_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(name) DO NOTHING")
      .bind(card.id, card.name, card.method, card.createdAt)
      .run();
    return meta.changes > 0;
  }
}
