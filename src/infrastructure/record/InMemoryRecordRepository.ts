import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordPage, RecordRepository } from "@/domain/record/RecordRepository";

// 단위 테스트 전용. 실행 환경의 저장소로 쓰지 않는다 (70-mvp-records §7)
export class InMemoryRecordRepository implements RecordRepository {
  private readonly rows = new Map<string, RecordData>();

  async list(page: number, size: number): Promise<RecordPage> {
    const sorted = [...this.rows.values()].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
    return { items: sorted.slice((page - 1) * size, page * size).map(RecordEntry.restore), total: sorted.length };
  }

  async findById(id: string): Promise<RecordEntry | null> {
    const row = this.rows.get(id);
    return row ? RecordEntry.restore(row) : null;
  }

  async insert(entry: RecordEntry): Promise<void> {
    this.rows.set(entry.id, entry.toData());
  }

  async update(entry: RecordEntry): Promise<boolean> {
    if (!this.rows.has(entry.id)) return false;
    this.rows.set(entry.id, entry.toData());
    return true;
  }

  async delete(id: string): Promise<RecordEntry | null> {
    const row = this.rows.get(id);
    this.rows.delete(id);
    return row ? RecordEntry.restore(row) : null;
  }

  get size(): number {
    return this.rows.size;
  }
}
