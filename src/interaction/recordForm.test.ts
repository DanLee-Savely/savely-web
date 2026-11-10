import { describe, expect, it } from "vitest";
import { PageWindow } from "./PageWindow";
import { emptyDraft, RecordFormFlow } from "./RecordFormFlow";

const clock = { now: () => new Date("2026-11-10T03:00:00Z") };
const start = () => new RecordFormFlow(emptyDraft("2026-11-10"));

describe("PageWindow", () => {
  it("현재 페이지를 가운데 두고 최대 5개, 끝에서는 반대쪽으로 채운다", () => {
    expect(new PageWindow(1, 1).pages).toEqual([1]);
    expect(new PageWindow(1, 3).pages).toEqual([1, 2, 3]);
    expect(new PageWindow(1, 13).pages).toEqual([1, 2, 3, 4, 5]);
    expect(new PageWindow(7, 13).pages).toEqual([5, 6, 7, 8, 9]);
    expect(new PageWindow(13, 13).pages).toEqual([9, 10, 11, 12, 13]);
  });

  it("1페이지는 이전 없음, 마지막 페이지는 다음 없음", () => {
    expect(new PageWindow(1, 3)).toMatchObject({ hasPrev: false, hasNext: true });
    expect(new PageWindow(3, 3)).toMatchObject({ hasPrev: true, hasNext: false });
  });
});

describe("RecordFormFlow", () => {
  it("빈 값으로 저장하면 칸별 오류와 첫 오류 칸(화면 순서)", () => {
    const f = start().submit(clock);
    expect(f).toMatchObject({ status: "error", errors: { amount: "AMOUNT_REQUIRED", categoryId: "INVALID_CATEGORY" }, firstErrorField: "amount" });
  });

  it("고친 칸의 오류만 지운다", () => {
    const f = start().submit(clock).set("amount", "9000");
    expect(f).toMatchObject({ status: "editing", errors: { categoryId: "INVALID_CATEGORY" }, firstErrorField: "categoryId" });
  });

  it("수입으로 바꾸면 카테고리 선택이 풀리고 지출 전용 칸이 비워진다", () => {
    const f = start().set("categoryId", "cafe").set("paymentMethod", "cash").set("reason", "need").set("feeling", "regret").setKind("income");
    expect(f.draft).toMatchObject({ kind: "income", categoryId: "", paymentMethod: "", reason: "", feeling: "" });
  });

  it("통과하면 저장 중 — 잠긴 동안 입력 · 두 번째 제출은 무시", () => {
    const sending = start().set("amount", "9,000").set("categoryId", "food").submit(clock);
    expect(sending).toMatchObject({ status: "submitting", locked: true });
    expect(sending.submit(clock)).toBe(sending);
    expect(sending.set("amount", "1")).toBe(sending);
    expect(sending.succeed().status).toBe("done");
  });

  it("서버 오류: 입력값은 그대로, 칸별 · 폼 위 오류 표시", () => {
    const sending = start().set("amount", "9000").set("categoryId", "food").submit(clock);
    expect(sending.fail({}, "SERVER_ERROR")).toMatchObject({ status: "error", formError: "SERVER_ERROR", draft: { amount: "9000" } });
    expect(sending.fail({ date: "FUTURE_DATE" }).firstErrorField).toBe("date");
  });

  it("사진 오류는 표시만 하고 저장을 막지 않는다", () => {
    const f = start().set("amount", "9000").set("categoryId", "food").pickImage("IMAGE_TOO_LARGE");
    expect(f.errors.image).toBe("IMAGE_TOO_LARGE");
    expect(f.submit(clock).status).toBe("submitting");
    expect(f.pickImage(null).errors.image).toBeUndefined();
  });
});
