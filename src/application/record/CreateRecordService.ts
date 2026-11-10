import type { Clock } from "@/domain/record/Clock";
import { InvalidRecordError } from "@/domain/record/errors";
import { ImageFile } from "@/domain/record/ImageFile";
import type { ImageStorage } from "@/domain/record/ImageStorage";
import { type RecordData, type RecordDraft, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";

export type CreateRecordCommand = { draft: RecordDraft; image: Uint8Array | null };

// 등록: 검증 → 사진 업로드 → 기록 저장. 업로드가 실패하면 기록을 저장하지 않고, 저장이 실패하면 올린 사진을 지운다 (§4-3)
export class CreateRecordService {
  constructor(
    private readonly repository: RecordRepository,
    private readonly images: ImageStorage,
    private readonly clock: Clock,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {}

  async execute({ draft, image }: CreateRecordCommand): Promise<RecordData> {
    const errors = RecordEntry.check(draft, this.clock, image);
    if (Object.keys(errors).length) throw new InvalidRecordError(errors);
    const entry = RecordEntry.create(this.newId(), draft, this.clock);
    const key = image ? await this.images.put(entry.id, ImageFile.create(image)) : null;
    try {
      const saved = entry.withImage(key);
      await this.repository.insert(saved);
      return saved.toData();
    } catch (e) {
      if (key) await this.images.remove(key);
      throw e;
    }
  }
}
