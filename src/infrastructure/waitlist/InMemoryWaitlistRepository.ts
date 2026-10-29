import type { WaitlistEntry, WaitlistRecord } from "@/domain/waitlist/WaitlistEntry";
import type { SaveResult, WaitlistRepository } from "@/domain/waitlist/WaitlistRepository";

// 로컬 개발 · 테스트용 (서버를 다시 켜면 비워진다)
export class InMemoryWaitlistRepository implements WaitlistRepository {
  private readonly records = new Map<string, WaitlistRecord>();

  async save(entry: WaitlistEntry): Promise<SaveResult> {
    const record = entry.toRecord();
    if (this.records.has(record.email)) return "duplicate";
    this.records.set(record.email, record);
    return "created";
  }

  get size(): number {
    return this.records.size;
  }
}
