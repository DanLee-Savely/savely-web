import type { Clock } from "@/domain/record/Clock";
import { InvalidRecordError, RecordNotFoundError } from "@/domain/record/errors";
import { ImageFile } from "@/domain/record/ImageFile";
import type { ImageStorage } from "@/domain/record/ImageStorage";
import { type RecordData, type RecordDraft, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";
import { findRecord } from "./GetRecordService";

/** image: 새 사진(바꾸기), removeImage: 기존 사진 삭제. 둘 다 없으면 사진은 그대로 */
export type UpdateRecordCommand = { id: string; draft: RecordDraft; image: Uint8Array | null; removeImage: boolean };

// 수정: 등록과 같은 검증. 사진을 바꾸거나 지웠다면 저장 성공 후 이전 사진을 지운다 (§4-4)
export class UpdateRecordService {
  constructor(
    private readonly repository: RecordRepository,
    private readonly images: ImageStorage,
    private readonly clock: Clock,
  ) {}

  async execute({ id, draft, image, removeImage }: UpdateRecordCommand): Promise<RecordData> {
    const current = await findRecord(this.repository, id);
    const errors = RecordEntry.check(draft, this.clock, image);
    if (Object.keys(errors).length) throw new InvalidRecordError(errors);
    let next = current.update(draft, this.clock);
    const key = image ? await this.images.put(id, ImageFile.create(image)) : null;
    if (key || removeImage) next = next.withImage(key);
    try {
      // 수정 화면을 연 뒤 다른 방문자가 지웠다면 바뀐 행이 없다
      if (!(await this.repository.update(next))) throw new RecordNotFoundError();
    } catch (e) {
      if (key) await this.images.remove(key);
      throw e;
    }
    if (current.imageKey && current.imageKey !== next.imageKey) await this.images.remove(current.imageKey);
    return next.toData();
  }
}
