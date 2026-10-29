import type { WaitlistEntry } from "@/domain/waitlist/WaitlistEntry";
import type { SaveResult, WaitlistRepository } from "@/domain/waitlist/WaitlistRepository";

const INSERT = `INSERT INTO waitlist (email, consented_at, created_at, source)
VALUES (?1, ?2, ?3, ?4) ON CONFLICT(email) DO NOTHING`;

// Cloudflare D1 (migrations/0001_create_waitlist.sql)
export class D1WaitlistRepository implements WaitlistRepository {
  constructor(private readonly db: D1Database) {}

  async save(entry: WaitlistEntry): Promise<SaveResult> {
    const r = entry.toRecord();
    const { meta } = await this.db.prepare(INSERT).bind(r.email, r.consentedAt, r.createdAt, r.source).run();
    return meta.changes > 0 ? "created" : "duplicate";
  }
}
