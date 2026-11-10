import type { RecordEntry } from "@/domain/record/RecordEntry";
import type { CategorySum, KindTotals, RecordStatsReader } from "@/domain/record/RecordStatsReader";
import { type RecordRow, toEntry } from "./D1RecordRepository";

// Cloudflare D1 집계 조회 (70-mvp-records §6-5). 기간은 record_date BETWEEN ?1 AND ?2(문자열 비교, records_date_idx 사용)
const RANGE = "record_date BETWEEN ?1 AND ?2";
const SQL = {
  kinds: `SELECT kind AS k, SUM(amount) AS sum, COUNT(*) AS n FROM records WHERE ${RANGE} GROUP BY kind`,
  daily: `SELECT record_date AS k, SUM(amount) AS sum FROM records WHERE kind = 'expense' AND ${RANGE} GROUP BY record_date`,
  categories: `SELECT category_id AS k, SUM(amount) AS sum FROM records WHERE kind = 'expense' AND ${RANGE}
GROUP BY category_id ORDER BY sum DESC, category_id`,
  reasons: `SELECT reason AS k, COUNT(*) AS n FROM records WHERE kind = 'expense' AND reason IS NOT NULL AND ${RANGE} GROUP BY reason`,
  feelings: `SELECT feeling AS k, COUNT(*) AS n FROM records WHERE kind = 'expense' AND feeling IS NOT NULL AND ${RANGE} GROUP BY feeling`,
  impulse: `SELECT COUNT(*) AS n FROM records WHERE kind = 'expense' AND reason = 'impulse'
AND feeling IN ('unsatisfied', 'regret') AND ${RANGE}`,
  day: "SELECT * FROM records WHERE record_date = ?1 ORDER BY created_at DESC",
};
type Agg = { k: string; sum: number; n: number };

export class D1RecordStatsReader implements RecordStatsReader {
  constructor(private readonly db: D1Database) {}

  private async rows(sql: string, from: string, to: string): Promise<Agg[]> {
    return (await this.db.prepare(sql).bind(from, to).all<Agg>()).results;
  }

  async kindTotals(from: string, to: string): Promise<KindTotals> {
    const totals: KindTotals = { expense: { sum: 0, count: 0 }, income: { sum: 0, count: 0 } };
    for (const r of await this.rows(SQL.kinds, from, to)) totals[r.k as keyof KindTotals] = { sum: r.sum, count: r.n };
    return totals;
  }

  async dailyExpense(from: string, to: string): Promise<Record<string, number>> {
    return Object.fromEntries((await this.rows(SQL.daily, from, to)).map((r) => [r.k, r.sum]));
  }

  async categoryExpense(from: string, to: string): Promise<CategorySum[]> {
    return (await this.rows(SQL.categories, from, to)).map((r) => ({ categoryId: r.k, sum: r.sum }));
  }

  async reasonCounts(from: string, to: string): Promise<Record<string, number>> {
    return Object.fromEntries((await this.rows(SQL.reasons, from, to)).map((r) => [r.k, r.n]));
  }

  async feelingCounts(from: string, to: string): Promise<Record<string, number>> {
    return Object.fromEntries((await this.rows(SQL.feelings, from, to)).map((r) => [r.k, r.n]));
  }

  async impulseRegretCount(from: string, to: string): Promise<number> {
    return (await this.rows(SQL.impulse, from, to))[0]?.n ?? 0;
  }

  async recordsOn(date: string): Promise<RecordEntry[]> {
    return (await this.db.prepare(SQL.day).bind(date).all<RecordRow>()).results.map(toEntry);
  }
}
