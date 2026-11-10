import { ImageTooLargeError, InvalidImageTypeError } from "./errors";

export type ImageType = "jpg" | "png" | "webp";

const MAX_BYTES = 5 * 1024 * 1024;
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

// 확장자 · 브라우저가 알려 준 형식은 믿지 않고 파일 앞부분 바이트(시그니처)로 판단한다 (70-mvp-records §6-4)
const detect = (head: Uint8Array): ImageType | null => {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpg";
  if (ascii(head, 0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "webp";
  return null;
};

// 값 객체: JPG · PNG · WEBP, 5MB 이하 (M4)
export class ImageFile {
  private constructor(
    readonly bytes: Uint8Array,
    readonly type: ImageType,
  ) {}

  static create(bytes: Uint8Array): ImageFile {
    return new ImageFile(bytes, ImageFile.inspect(bytes, bytes.length));
  }

  /** 앞부분 12바이트와 전체 크기만으로 검사 (브라우저에서 파일을 다 읽지 않고 고를 때) */
  static inspect(head: Uint8Array, size: number): ImageType {
    const type = detect(head);
    if (!type) throw new InvalidImageTypeError();
    if (size > MAX_BYTES) throw new ImageTooLargeError();
    return type;
  }

  get contentType(): string {
    return this.type === "jpg" ? "image/jpeg" : `image/${this.type}`;
  }
}
