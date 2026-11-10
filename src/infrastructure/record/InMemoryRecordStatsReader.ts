import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import type { CategorySum, KindTotals, RecordStatsReader } from "@/domain/record/RecordStatsReader";
import type { InMemoryRecordRepository } from "./InMemoryRecordRepository";

// 단위 테스트 전용 — InMemoryRecordRepository의 행으로 D1 집계와 같은 결과를 만든다
const tally = (rows: RecordData[], key: (r: RecordData) => string | null, value: (r: RecordData) => number) =>
  rows.reduce<Record<string, number>>((acc, r) => {
    const k = key(r);
    if (k !== null) acc[k] = (acc[k] ?? 0) + value(r);
    return acc;
  }, {});

export class InMemoryRecordStatsReader implements RecordStatsReader {
  constructor(private readonly repository: InMemoryRecordRepository) {}

  private range(from: string, to: string, kind?: RecordData["kind"]): RecordData[] {
    return this.repository.all().filter((r) => r.date >= from && r.date <= to && (!kind || r.kind === kind));
  }

  async kindTotals(from: string, to: string): Promise<KindTotals> {
    const rows = this.range(from, to);
    const of = (kind: RecordData["kind"]) => {
      const list = rows.filter((r) => r.kind === kind);
      return { sum: list.reduce((s, r) => s + r.amount, 0), count: list.length };
    };
    return { expense: of("expense"), income: of("income") };
  }

  async dailyExpense(from: string, to: string): Promise<Record<string, number>> {
    return tally(this.range(from, to, "expense"), (r) => r.date, (r) => r.amount);
  }

  async categoryExpense(from: string, to: string): Promise<CategorySum[]> {
    return Object.entries(tally(this.range(from, to, "expense"), (r) => r.categoryId, (r) => r.amount))
      .map(([categoryId, sum]) => ({ categoryId, sum }))
      .sort((a, b) => b.sum - a.sum || a.categoryId.localeCompare(b.categoryId));
  }

  async reasonCounts(from: string, to: string): Promise<Record<string, number>> {
    return tally(this.range(from, to, "expense"), (r) => r.reason, () => 1);
  }

  async feelingCounts(from: string, to: string): Promise<Record<string, number>> {
    return tally(this.range(from, to, "expense"), (r) => r.feeling, () => 1);
  }

  async impulseRegretCount(from: string, to: string): Promise<number> {
    return this.range(from, to, "expense").filter((r) => r.reason === "impulse" && (r.feeling === "unsatisfied" || r.feeling === "regret")).length;
  }

  async recordsOn(date: string): Promise<RecordEntry[]> {
    return this.range(date, date)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(RecordEntry.restore);
  }
}
