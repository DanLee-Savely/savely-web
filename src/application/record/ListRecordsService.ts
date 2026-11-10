import type { RecordData } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";

export type RecordList = {
  items: RecordData[];
  total: number;
  page: number;
  lastPage: number;
  /** 마지막 페이지보다 큰 page를 요청했을 때 옮겨 갈 페이지 */
  redirectTo: number | null;
};

const MAX_PAGE = 1_000_000;

// 목록: 한 페이지 10건(M5). 숫자가 아니거나 1보다 작은 page는 1페이지 (70-mvp-records §4-1)
export class ListRecordsService {
  constructor(
    private readonly repository: RecordRepository,
    private readonly size = 10,
  ) {}

  async execute(rawPage: string | undefined): Promise<RecordList> {
    const page = /^\d+$/.test(rawPage ?? "") ? Math.min(Math.max(1, Number(rawPage)), MAX_PAGE) : 1;
    const { items, total } = await this.repository.list(page, this.size);
    const lastPage = Math.max(1, Math.ceil(total / this.size));
    return { items: items.map((e) => e.toData()), total, page, lastPage, redirectTo: page > lastPage ? lastPage : null };
  }
}
