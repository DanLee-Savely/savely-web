import type { AssistantUsage } from "@/domain/assistant/DraftOrganizer";

// 날짜별 OpenAI 호출 수 (테이블 assistant_usage, 80-record-assistant §5-2 · §7). 문장 · IP는 저장하지 않는다
// 「상한보다 작을 때만 +1」을 한 문장으로 한다 — 동시에 여러 요청이 와도 상한을 넘지 않는다
const TRY_USE = `INSERT INTO assistant_usage (usage_date, calls) VALUES (?1, 1)
ON CONFLICT(usage_date) DO UPDATE SET calls = calls + 1 WHERE calls < ?2 RETURNING calls`;

export class D1AssistantUsage implements AssistantUsage {
  constructor(private readonly db: D1Database) {}

  async tryUse(date: string, limit: number): Promise<boolean> {
    if (limit < 1) return false;
    return (await this.db.prepare(TRY_USE).bind(date, limit).first<{ calls: number }>()) !== null;
  }
}
