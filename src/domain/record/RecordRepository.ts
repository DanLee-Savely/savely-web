import type { RecordEntry } from "./RecordEntry";

export type RecordPage = { items: RecordEntry[]; total: number };

// 정렬: 날짜 최신순, 같은 날짜는 만든 시각 최신순 (70-mvp-records §4-1)
export interface RecordRepository {
  /** page는 1부터 */
  list(page: number, size: number): Promise<RecordPage>;
  findById(id: string): Promise<RecordEntry | null>;
  insert(entry: RecordEntry): Promise<void>;
  /** 여러 건을 한 번에 넣는다(모두 들어가거나 하나도 안 들어간다). 같은 id가 이미 있으면 그 건은 넣지 않는다 — 다시 눌러도 중복되지 않게(80 K16). 새로 넣은 건수 */
  insertMany(entries: RecordEntry[]): Promise<number>;
  /** 바뀐 행이 없으면(그사이 삭제됨) false */
  update(entry: RecordEntry): Promise<boolean>;
  /** 지운 기록(사진 정리용), 없으면 null */
  delete(id: string): Promise<RecordEntry | null>;
}
