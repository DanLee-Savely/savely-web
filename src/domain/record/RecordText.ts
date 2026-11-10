import { TextTooLongError } from "./errors";

// 글자 수는 코드 포인트로 센다(SQLite length()와 같음). 앞뒤 공백을 지우고, 비었으면 null
const read = (raw: string, max: number): string | null => {
  const value = raw.trim();
  if ([...value].length > max) throw new TextTooLongError();
  return value || null;
};

// 값 객체: 내용 60자 (앱 「내용」과 같음)
export class RecordTitle {
  static readonly MAX = 60;
  private constructor(readonly value: string | null) {}

  static create(raw: string): RecordTitle {
    return new RecordTitle(read(raw, RecordTitle.MAX));
  }
}

// 값 객체: 메모 200자
export class RecordMemo {
  static readonly MAX = 200;
  private constructor(readonly value: string | null) {}

  static create(raw: string): RecordMemo {
    return new RecordMemo(read(raw, RecordMemo.MAX));
  }
}
