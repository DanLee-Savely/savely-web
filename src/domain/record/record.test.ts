import { describe, expect, it } from "vitest";
import { Amount } from "./Amount";
import { CategoryCatalog } from "./CategoryCatalog";
import { AmountRequiredError, DateRequiredError, FutureDateError, ImageTooLargeError, InvalidAmountError, InvalidDateError, InvalidImageTypeError, InvalidRecordError, TextTooLongError } from "./errors";
import { ImageFile } from "./ImageFile";
import { RecordDate } from "./RecordDate";
import { type RecordDraft, RecordEntry } from "./RecordEntry";
import { RecordMemo, RecordTitle } from "./RecordText";

// 2026-11-10 00:30 (한국) = 2026-11-09 15:30 UTC
const clock = { now: () => new Date("2026-11-09T15:30:00Z") };
const draft = (over: Partial<RecordDraft> = {}): RecordDraft => ({
  kind: "expense", amount: "9,000", date: "2026-11-10", categoryId: "cafe", title: "", paymentMethod: "check_card",
  reason: "need", feeling: "meh", memo: "", ...over,
});
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const WEBP = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBP")]);
const GIF = new TextEncoder().encode("GIF89a000000");
const ID = "123e4567-e89b-42d3-a456-426614174000";

describe("Amount", () => {
  it("1 ~ 999,999,999,999만 받는다 (경계값)", () => {
    expect(() => Amount.create("0")).toThrow(InvalidAmountError);
    expect(Amount.create("1").value).toBe(1);
    expect(Amount.create("999,999,999,999").value).toBe(999_999_999_999);
    expect(() => Amount.create("1,000,000,000,000")).toThrow(InvalidAmountError);
  });

  it("빈칸은 입력 요청, 숫자가 아니면 범위 오류", () => {
    expect(() => Amount.create(" ")).toThrow(AmountRequiredError);
    expect(() => Amount.create("-5")).toThrow(InvalidAmountError);
    expect(() => Amount.create("1.5")).toThrow(InvalidAmountError);
  });
});

describe("RecordDate", () => {
  it("오늘은 한국 시간 기준 (UTC로는 아직 어제인 0시 30분)", () => {
    expect(RecordDate.today(clock)).toBe("2026-11-10");
    expect(RecordDate.create("2026-11-10", clock).toString()).toBe("2026-11-10");
    expect(() => RecordDate.create("2026-11-11", clock)).toThrow(FutureDateError);
  });

  it("과거는 제한 없음, 없는 날짜 · 형식은 거부", () => {
    expect(RecordDate.create("1999-01-01", clock).toString()).toBe("1999-01-01");
    expect(() => RecordDate.create("2026-02-30", clock)).toThrow(InvalidDateError);
    expect(() => RecordDate.create("2026-1-5", clock)).toThrow(InvalidDateError);
    expect(() => RecordDate.create("", clock)).toThrow(DateRequiredError);
  });
});

describe("RecordTitle · RecordMemo", () => {
  it("60자 · 200자까지, 이모지는 한 글자로 센다, 빈칸은 null", () => {
    expect(RecordTitle.create("가".repeat(60)).value).toHaveLength(60);
    expect(() => RecordTitle.create("가".repeat(61))).toThrow(TextTooLongError);
    expect(RecordTitle.create("😀".repeat(60)).value).not.toBeNull();
    expect(() => RecordMemo.create("a".repeat(201))).toThrow(TextTooLongError);
    expect(RecordMemo.create("  ").value).toBeNull();
  });
});

describe("ImageFile", () => {
  it("앞부분 바이트로 JPG · PNG · WEBP를 알아본다", () => {
    expect(ImageFile.create(JPG)).toMatchObject({ type: "jpg", contentType: "image/jpeg" });
    expect(ImageFile.create(PNG).type).toBe("png");
    expect(ImageFile.create(WEBP).contentType).toBe("image/webp");
    expect(() => ImageFile.create(GIF)).toThrow(InvalidImageTypeError);
  });

  it("5MB를 넘으면 거부한다", () => {
    expect(ImageFile.inspect(JPG, 5 * 1024 * 1024)).toBe("jpg");
    expect(() => ImageFile.inspect(JPG, 5 * 1024 * 1024 + 1)).toThrow(ImageTooLargeError);
  });
});

describe("CategoryCatalog", () => {
  it("지출 23 · 수입 6 · 먼저 보여 줄 11, 구분과 맞지 않으면 거부", () => {
    expect([CategoryCatalog.expense.length, CategoryCatalog.income.length, CategoryCatalog.featured.length]).toEqual([23, 6, 11]);
    expect(CategoryCatalog.featured.every((c) => CategoryCatalog.expense.includes(c))).toBe(true);
    expect(() => CategoryCatalog.assert("expense", "salary")).toThrow();
    expect(() => CategoryCatalog.assert("income", "salary")).not.toThrow();
  });
});

describe("RecordEntry", () => {
  it("칸별 오류를 한꺼번에 모은다", () => {
    expect(RecordEntry.check(draft({ amount: "", categoryId: "", date: "2026-11-11", title: "가".repeat(61) }), clock)).toEqual({
      amount: "AMOUNT_REQUIRED", categoryId: "INVALID_CATEGORY", date: "FUTURE_DATE", title: "TEXT_TOO_LONG",
    });
    expect(RecordEntry.check(draft({ paymentMethod: "bitcoin" }), clock, GIF)).toEqual({ paymentMethod: "INVALID_OPTION", image: "INVALID_IMAGE_TYPE" });
    expect(() => RecordEntry.create(ID, draft({ amount: "0" }), clock)).toThrow(InvalidRecordError);
  });

  it("지출 기록을 만든다 — 시각은 서버 시계, 빈 선택은 null", () => {
    expect(RecordEntry.create(ID, draft({ feeling: "" }), clock).toData()).toEqual({
      id: ID, kind: "expense", amount: 9000, date: "2026-11-10", categoryId: "cafe", title: null, paymentMethod: "check_card",
      reason: "need", feeling: null, memo: null, imageKey: null, createdAt: "2026-11-09T15:30:00.000Z", updatedAt: "2026-11-09T15:30:00.000Z",
    });
  });

  it("수입이면 지출 전용 항목을 비운다(목록 밖 값이 와도 무시)", () => {
    const data = RecordEntry.create(ID, draft({ kind: "income", categoryId: "salary", paymentMethod: "bitcoin" }), clock).toData();
    expect(data).toMatchObject({ kind: "income", paymentMethod: null, reason: null, feeling: null });
  });

  it("수정하면 id · 사진 · 처음 시각은 그대로, 고친 시각만 바뀐다", () => {
    const first = RecordEntry.create(ID, draft(), clock).withImage(`${ID}/a.jpg`);
    const later = { now: () => new Date("2026-11-10T01:00:00Z") };
    expect(first.update(draft({ amount: "500" }), later).toData()).toMatchObject({
      id: ID, amount: 500, imageKey: `${ID}/a.jpg`, createdAt: "2026-11-09T15:30:00.000Z", updatedAt: "2026-11-10T01:00:00.000Z",
    });
  });

  it("id는 UUID 형식만", () => {
    expect(RecordEntry.isId(ID)).toBe(true);
    expect(RecordEntry.isId("abc")).toBe(false);
  });
});
