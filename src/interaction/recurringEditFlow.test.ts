import { describe, expect, it } from "vitest";
import { RecurringEditFlow } from "./RecurringEditFlow";

const source = { kind: "expense", title: "넷플릭스", amount: 17000, dayOfMonth: 15 as number | null, categoryId: "subscription", paymentMethod: "credit_card", cardName: "삼성카드" };

describe("RecurringEditFlow", () => {
  it("값으로 시작하고, 그대로 적용하면 같은 값(카드 이름은 지킨다)", () => {
    const flow = RecurringEditFlow.of(source);
    expect(flow.values).toEqual({ kind: "expense", title: "넷플릭스", amount: "17,000", day: "15", categoryId: "subscription", paymentMethod: "credit_card" });
    expect(flow.toInput()).toEqual({ kind: "expense", amount: 17000, dayOfMonth: 15, title: "넷플릭스", categoryId: "subscription", paymentMethod: "credit_card", cardName: "삼성카드" });
  });

  it("이름 · 금액 · 나가는 날이 모두 있어야 적용할 수 있다. 날은 1~31", () => {
    const flow = RecurringEditFlow.of({ ...source, dayOfMonth: null });
    expect([flow.canApply, flow.toInput(), flow.setDay("25").canApply]).toEqual([false, null, true]);
    expect([flow.setDay("0").day, flow.setDay("32").day, flow.setDay("31").day, flow.setDay("1a5일").values.day]).toEqual([null, null, 31, "15"]);
    expect([flow.setDay("25").set("title", "  ").canApply, flow.setDay("25").set("amount", "").canApply, flow.setDay("25").set("amount", "0").canApply]).toEqual([false, false, false]);
  });

  it("종류를 바꾸면 카테고리가 풀리고, 지출이 아니면 결제수단 · 카드 이름을 비운다", () => {
    const flow = RecurringEditFlow.of(source).setKind("income");
    expect(flow.values).toMatchObject({ kind: "income", categoryId: "", paymentMethod: "" });
    expect(flow.toInput()).toMatchObject({ kind: "income", categoryId: null, paymentMethod: null, cardName: null });
    expect(flow.setKind("income")).toBe(flow);
  });
});
