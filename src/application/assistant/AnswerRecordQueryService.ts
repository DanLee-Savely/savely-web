import type { RecordQuery, RecordQueryRejection, RecordQueryResult } from "@/domain/assistant/RecordQueryParser";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";

/** 그날 목록에 보여 줄 항목 수. 나머지는 「외 n건」으로 줄인다 */
export const QUERY_LIST_LIMIT = 5;

export type QueryListItem = { id: string; kind: string; amount: number; title: string | null; categoryId: string | null };
/**
 * 질문의 답. 숫자는 전부 저장된 기록에서 센 것이다.
 * - periodTotal · incomeTotal · categoryTotal: count · sum은 그 기간의 지출 · 수입 · 그 카테고리의 건수와 합계
 * - dayList: count는 그날 기록 전체(구분 4가지)의 건수, sum은 그날 지출 합계, items는 최근 적은 순으로 QUERY_LIST_LIMIT건까지
 */
export type QueryReply =
  | { status: "rejected"; reason: RecordQueryRejection }
  | { status: "answered"; query: RecordQuery; count: number; sum: number; items: QueryListItem[] };

// 대화로 물어보기의 답을 만든다 (80-record-assistant H). 읽기만 한다 — 아무것도 저장 · 수정 · 삭제하지 않는다.
// 화면(홈 · 달력 · 리포트)과 같은 집계 조회를 쓴다 — 같은 기간의 숫자가 화면과 답에서 다를 수 없다.
// 평가 · 조언 · 지난 기간과의 비교는 하지 않는다. 숫자만 답한다
export class AnswerRecordQueryService {
  constructor(private readonly stats: RecordStatsReader) {}

  async execute(result: RecordQueryResult): Promise<QueryReply> {
    if (result.type === "rejected") return { status: "rejected", reason: result.reason };
    const { query } = result;
    if (query.kind === "dayList") return this.dayList(query);
    const total = await this.total(query);
    return { status: "answered", query, ...total, items: [] };
  }

  private async total({ kind, from, to, categoryId }: RecordQuery): Promise<{ sum: number; count: number }> {
    if (kind === "categoryTotal" && categoryId !== null) return this.stats.categoryTotal(from, to, categoryId);
    return (await this.stats.kindTotals(from, to))[kind === "incomeTotal" ? "income" : "expense"];
  }

  private async dayList(query: RecordQuery): Promise<QueryReply> {
    const records = (await this.stats.recordsOn(query.from)).map((r) => r.toData());
    const sum = records.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0);
    const items = records.slice(0, QUERY_LIST_LIMIT).map(({ id, kind, amount, title, categoryId }) => ({ id, kind, amount, title, categoryId }));
    return { status: "answered", query, count: records.length, sum, items };
  }
}
