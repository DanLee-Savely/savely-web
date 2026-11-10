import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordPage, RecordRepository } from "@/domain/record/RecordRepository";

// Cloudflare D1 (migrations-records/0001_create_records.sql). 값은 모두 바인딩 파라미터로 넘긴다
type Row = {
  id: string;
  kind: RecordData["kind"];
  amount: number;
  record_date: string;
  category_id: string;
  title: string | null;
  payment_method: string | null;
  reason: string | null;
  feeling: string | null;
  memo: string | null;
  image_key: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = `id, kind, amount, record_date, category_id, title, payment_method, reason, feeling, memo, image_key, created_at, updated_at`;
const LIST = `SELECT * FROM records ORDER BY record_date DESC, created_at DESC LIMIT ?1 OFFSET ?2`;
const INSERT = `INSERT INTO records (${COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`;
const UPDATE = `UPDATE records SET kind = ?2, amount = ?3, record_date = ?4, category_id = ?5, title = ?6, payment_method = ?7,
reason = ?8, feeling = ?9, memo = ?10, image_key = ?11, updated_at = ?13 WHERE id = ?1`;

const toEntry = (r: Row): RecordEntry =>
  RecordEntry.restore({
    id: r.id,
    kind: r.kind,
    amount: r.amount,
    date: r.record_date,
    categoryId: r.category_id,
    title: r.title,
    paymentMethod: r.payment_method,
    reason: r.reason,
    feeling: r.feeling,
    memo: r.memo,
    imageKey: r.image_key,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

// ?1~?13 순서 = COLUMNS 순서
const values = (e: RecordEntry) => {
  const d = e.toData();
  return [d.id, d.kind, d.amount, d.date, d.categoryId, d.title, d.paymentMethod, d.reason, d.feeling, d.memo, d.imageKey, d.createdAt, d.updatedAt];
};

export class D1RecordRepository implements RecordRepository {
  constructor(private readonly db: D1Database) {}

  async list(page: number, size: number): Promise<RecordPage> {
    const [count, rows] = await this.db.batch([
      this.db.prepare("SELECT COUNT(*) AS n FROM records"),
      this.db.prepare(LIST).bind(size, (page - 1) * size),
    ]);
    return { items: (rows.results as Row[]).map(toEntry), total: (count.results[0] as { n: number }).n };
  }

  async findById(id: string): Promise<RecordEntry | null> {
    const row = await this.db.prepare("SELECT * FROM records WHERE id = ?1").bind(id).first<Row>();
    return row && toEntry(row);
  }

  async insert(entry: RecordEntry): Promise<void> {
    await this.db.prepare(INSERT).bind(...values(entry)).run();
  }

  async update(entry: RecordEntry): Promise<boolean> {
    const { meta } = await this.db.prepare(UPDATE).bind(...values(entry)).run();
    return meta.changes > 0;
  }

  async delete(id: string): Promise<RecordEntry | null> {
    const row = await this.db.prepare("DELETE FROM records WHERE id = ?1 RETURNING *").bind(id).first<Row>();
    return row && toEntry(row);
  }
}
