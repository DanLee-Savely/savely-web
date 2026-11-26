import { describe, expect, it } from "vitest";
import { CATEGORY_ICONS } from "@/components/app/CategoryIcon";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import { KINDS } from "@/domain/record/RecordEntry";
import { amountSign, amountTone, appContent, recordSub, recordTitle } from "./app.content";

const record = (over: Partial<Parameters<typeof recordSub>[0]> & { kind?: (typeof KINDS)[number] } = {}) => ({
  kind: "expense" as (typeof KINDS)[number], title: null, categoryId: null, paymentMethod: null, cardName: null, reason: null, ...over,
});

describe("이름 · 아이콘", () => {
  it("구분 4가지와 카테고리 41종에 모두 이름이 있다(앱과 같은 이름)", () => {
    expect(KINDS.map((k) => appContent.kinds[k])).toEqual(["지출", "수입", "상환", "저축"]);
    for (const id of CategoryCatalog.all) expect(appContent.categories[id], id).toBeTruthy();
    expect(Object.keys(appContent.categories)).toHaveLength(41);
    expect(CategoryCatalog.transfer.map((id) => appContent.categories[id])).toEqual(["카드값 상환", "대출 상환", "이자 납입"]);
    expect(CategoryCatalog.savings.map((id) => appContent.categories[id])).toEqual(["예적금", "비상금", "청약", "ETF·주식", "펀드", "연금", "외화", "기타 저축"]);
    expect(appContent.categories.convenience).toBe("편의점");
  });

  it("「기타」 3종만 빼고 모든 카테고리에 아이콘이 있다", () => {
    const missing = CategoryCatalog.all.filter((id) => !CATEGORY_ICONS[id]);
    expect(missing).toEqual(["etc_expense", "etc_income", "etc_savings"]);
  });
});

describe("행 표기 (80 K2 · K7)", () => {
  it("제목: 내용 → 카테고리 이름 → 구분 이름", () => {
    expect(recordTitle(record({ title: "점심", categoryId: "food" }))).toBe("점심");
    expect(recordTitle(record({ categoryId: "card_bill", kind: "transfer" }))).toBe("카드값 상환");
    expect(KINDS.map((kind) => recordTitle(record({ kind })))).toEqual(["지출", "수입", "상환", "저축"]);
  });

  it("보조줄: 카테고리 · 결제수단(+ 카드 이름) · 이유. 제목에 쓴 카테고리는 빼고, 아무것도 없으면 빈칸", () => {
    expect(recordSub(record({ title: "장보기", categoryId: "grocery", paymentMethod: "credit_card", cardName: "삼성카드", reason: "need" })))
      .toBe("마트·생필품 · 신용카드 삼성카드 · 필요해서");
    expect(recordSub(record({ categoryId: "food", paymentMethod: "check_card", reason: "need" }))).toBe("체크카드 · 필요해서");
    expect(recordSub(record({ title: "10월 카드값", categoryId: "card_bill", kind: "transfer" }))).toBe("카드값 상환");
    expect(recordSub(record({ title: "택시" }))).toBe("");
    expect(recordSub(record())).toBe("");
  });

  it("금액: 수입만 + 초록, 상환은 흐린 색, 지출 · 저축은 부호 없는 기본색", () => {
    expect(KINDS.map((k) => [amountSign(k), amountTone(k)])).toEqual([["", "plain"], ["+", "income"], ["", "muted"], ["", "plain"]]);
  });
});
