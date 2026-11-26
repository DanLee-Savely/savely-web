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
  it("빈 값으로 저장하면 칸별 오류와 첫 오류 칸(화면 순서) — 카테고리는 비워도 된다", () => {
    const f = start().set("memo", "a".repeat(201)).submit(clock);
    expect(f).toMatchObject({ status: "error", errors: { amount: "AMOUNT_REQUIRED", memo: "TEXT_TOO_LONG" }, firstErrorField: "amount" });
    expect(f.errors.categoryId).toBeUndefined();
  });

  it("고친 칸의 오류만 지운다", () => {
    const f = start().set("memo", "a".repeat(201)).submit(clock).set("amount", "9000");
    expect(f).toMatchObject({ status: "editing", errors: { memo: "TEXT_TOO_LONG" }, firstErrorField: "memo" });
  });

  it("금액과 날짜만 채워도 저장 중으로 넘어간다", () => {
    expect(start().set("amount", "4500").submit(clock).status).toBe("submitting");
  });

  it("수입으로 바꾸면 카테고리 선택이 풀리고 지출 전용 칸이 비워진다", () => {
    const f = start().set("categoryId", "cafe").set("paymentMethod", "cash").set("reason", "need").set("feeling", "regret").setKind("income");
    expect(f.draft).toMatchObject({ kind: "income", categoryId: "", paymentMethod: "", reason: "", feeling: "" });
  });

  it("상환 · 저축으로 바꿔도 지출 전용 칸(카드 이름 포함)이 비워지고, 지출로 돌아오면 그대로 빈칸", () => {
    const filled = start().set("categoryId", "cafe").set("paymentMethod", "credit_card").set("cardName", "삼성카드").set("reason", "need");
    for (const kind of ["transfer", "savings"]) {
      expect(filled.setKind(kind).draft).toMatchObject({ kind, categoryId: "", paymentMethod: "", cardName: "", reason: "", feeling: "" });
    }
    expect(filled.setKind("transfer").setKind("expense").draft).toMatchObject({ kind: "expense", paymentMethod: "", cardName: "" });
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

  describe("적던 값이 있는가 · 버리기 (80 E4 — 「대화로 적기」)", () => {
    const initial = emptyDraft("2026-11-10");

    it("처음 그대로면 달라진 것이 없다. 날짜만 바꾼 것도 세지 않는다", () => {
      expect(start().differsFrom(initial)).toBe(false);
      expect(start().set("date", "2026-11-08").differsFrom(initial)).toBe(false);
    });

    it("금액 · 내용 · 구분 · 칩 가운데 하나라도 바뀌면 달라진 것이다. 되돌리면 다시 같다", () => {
      expect(start().set("amount", "9,000").differsFrom(initial)).toBe(true);
      expect(start().set("title", "점심").differsFrom(initial)).toBe(true);
      expect(start().setKind("income").differsFrom(initial)).toBe(true);
      expect(start().set("reason", "need").differsFrom(initial)).toBe(true);
      expect(start().set("amount", "9,000").set("amount", "").differsFrom(initial)).toBe(false);
    });

    it("버리면 처음 값으로 돌아가고, 고른 날짜와 오류 표시는 남기지 않는다 — 날짜만 남는다", () => {
      const filled = start().set("amount", "9,000").set("title", "점심").set("date", "2026-11-08");
      const cleared = filled.discard(initial);
      expect(cleared.draft).toEqual({ ...initial, date: "2026-11-08" });
      expect(cleared.differsFrom(initial)).toBe(false);
      expect(cleared.errors).toEqual({});
      expect(cleared.status).toBe("idle");
    });
  });
});
