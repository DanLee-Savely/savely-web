import { ImageUploadError } from "@/domain/record/errors";
import type { ImageFile } from "@/domain/record/ImageFile";
import type { ImageStorage, StoredImage } from "@/domain/record/ImageStorage";

// Cloudflare R2 (버킷 savely-record-images, 공개 주소 없음). 로그에는 기록 id만 남긴다
export class R2ImageStorage implements ImageStorage {
  constructor(private readonly bucket: R2Bucket) {}

  async put(recordId: string, file: ImageFile): Promise<string> {
    const key = `${recordId}/${crypto.randomUUID()}.${file.type}`;
    try {
      await this.bucket.put(key, file.bytes, { httpMetadata: { contentType: file.contentType } });
      return key;
    } catch (e) {
      console.error("[records] IMAGE_UPLOAD_FAILED", recordId, e instanceof Error ? e.name : typeof e);
      throw new ImageUploadError();
    }
  }

  async get(key: string): Promise<StoredImage | null> {
    const object = await this.bucket.get(key);
    return object && { body: object.body, contentType: object.httpMetadata?.contentType ?? "application/octet-stream" };
  }

  async remove(key: string): Promise<void> {
    await this.bucket.delete(key).catch(() => console.error("[records] IMAGE_CLEANUP_FAILED", key.split("/")[0]));
  }
}
