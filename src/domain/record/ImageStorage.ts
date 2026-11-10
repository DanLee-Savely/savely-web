import type { ImageFile } from "./ImageFile";

export type StoredImage = { body: ReadableStream; contentType: string };

// 사진 저장소 (70-mvp-records §6-4). 키는 {기록 id}/{무작위 uuid}.{확장자} — 원래 파일 이름은 저장하지 않는다
export interface ImageStorage {
  /** 실패하면 ImageUploadError */
  put(recordId: string, file: ImageFile): Promise<string>;
  get(key: string): Promise<StoredImage | null>;
  /** 실패해도 던지지 않는다(기록 처리는 성공으로 둠). 구현이 기록 id를 로그에 남긴다 */
  remove(key: string): Promise<void>;
}
