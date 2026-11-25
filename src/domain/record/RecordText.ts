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

// 값 객체: 카드 이름 20자 (앱 기록 화면 · 초안 검증기와 같음). 줄바꿈 · 겹친 빈칸은 한 칸으로 줄인다
// 자르지 않는다 — 잘린 이름은 등록한 카드와 맞지 않는 다른 이름이 된다
export class RecordCardName {
  static readonly MAX = 20;
  private constructor(readonly value: string | null) {}

  static create(raw: string): RecordCardName {
    return new RecordCardName(read(raw.replace(/[\s\u0000-\u001f\u007f]+/g, " "), RecordCardName.MAX));
  }
}
