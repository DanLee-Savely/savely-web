import type { ImageFile } from "@/domain/record/ImageFile";
import type { ImageStorage, StoredImage } from "@/domain/record/ImageStorage";

// 단위 테스트 전용
export class InMemoryImageStorage implements ImageStorage {
  private readonly files = new Map<string, ImageFile>();
  private count = 0;

  async put(recordId: string, file: ImageFile): Promise<string> {
    const key = `${recordId}/${++this.count}.${file.type}`;
    this.files.set(key, file);
    return key;
  }

  async get(key: string): Promise<StoredImage | null> {
    const file = this.files.get(key);
    return file ? { body: new Blob([file.bytes as BlobPart]).stream(), contentType: file.contentType } : null;
  }

  async remove(key: string): Promise<void> {
    this.files.delete(key);
  }

  get keys(): string[] {
    return [...this.files.keys()];
  }
}
