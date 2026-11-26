import type { RecordKind } from "@/domain/record/RecordEntry";
import { recurringNameKey } from "@/domain/recurring/RecurringRules";
import type { RecurringItemData, RecurringItemRepository } from "@/domain/recurring/RecurringItem";

// 고정지출 · 고정수입 (테이블 recurring_items, migrations-records/0002). (구분, name_key)에 UNIQUE 인덱스가 있다
type Row = {
  id: string; kind: RecordKind; amount: number; day_of_month: number; title: string; category_id: string | null;
  payment_method: string | null; card_name: string | null; created_at: string; updated_at: string;
};

const INSERT = `INSERT INTO recurring_items (id, kind, amount, day_of_month, title, name_key, category_id, payment_method, card_name, created_at, updated_at)
VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`;
const UPDATE = `UPDATE recurring_items SET kind = ?2, amount = ?3, day_of_month = ?4, title = ?5, name_key = ?6, category_id = ?7,
payment_method = ?8, card_name = ?9, updated_at = ?11 WHERE id = ?1`;
// ?1~?11 순서 = INSERT의 열 순서
const values = (i: RecurringItemData) => [i.id, i.kind, i.amount, i.dayOfMonth, i.title, recurringNameKey(i.title), i.categoryId, i.paymentMethod, i.cardName, i.createdAt, i.updatedAt];

export class D1RecurringItemRepository implements RecurringItemRepository {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<RecurringItemData[]> {
    const { results } = await this.db.prepare("SELECT * FROM recurring_items ORDER BY created_at, id").all<Row>();
    return results.map((r) => ({
      id: r.id, kind: r.kind, amount: r.amount, dayOfMonth: r.day_of_month, title: r.title, categoryId: r.category_id,
      paymentMethod: r.payment_method, cardName: r.card_name, createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  }

  async insert(item: RecurringItemData): Promise<void> {
    await this.db.prepare(INSERT).bind(...values(item)).run();
  }

  async update(item: RecurringItemData): Promise<boolean> {
    return (await this.db.prepare(UPDATE).bind(...values(item)).run()).meta.changes > 0;
  }

  async remove(id: string): Promise<boolean> {
    return (await this.db.prepare("DELETE FROM recurring_items WHERE id = ?1").bind(id).run()).meta.changes > 0;
  }
}
