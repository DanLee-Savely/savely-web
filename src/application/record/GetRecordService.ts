import { RecordNotFoundError } from "@/domain/record/errors";
import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";

/** id 형식이 틀리면 DB를 조회하지 않고 바로 RecordNotFoundError (70-mvp-records §3) */
export async function findRecord(repository: RecordRepository, id: string): Promise<RecordEntry> {
  const entry = RecordEntry.isId(id) ? await repository.findById(id) : null;
  if (!entry) throw new RecordNotFoundError();
  return entry;
}

// 상세: 기록 한 건
export class GetRecordService {
  constructor(private readonly repository: RecordRepository) {}

  async execute(id: string): Promise<RecordData> {
    return (await findRecord(this.repository, id)).toData();
  }
}
