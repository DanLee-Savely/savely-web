import { RecordNotFoundError } from "@/domain/record/errors";
import type { ImageStorage } from "@/domain/record/ImageStorage";
import { RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";

// 삭제: 행을 실제로 지우고(M7) 사진도 지운다. 이미 지워졌으면 RecordNotFoundError (§4-5)
export class DeleteRecordService {
  constructor(
    private readonly repository: RecordRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = RecordEntry.isId(id) ? await this.repository.delete(id) : null;
    if (!deleted) throw new RecordNotFoundError();
    if (deleted.imageKey) await this.images.remove(deleted.imageKey);
  }
}
