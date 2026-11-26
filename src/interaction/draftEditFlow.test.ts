import { describe, expect, it } from "vitest";
import { DraftValidator } from "@/domain/assistant/DraftValidator";
import type { DraftCard } from "./AssistantSession";
import { DraftEditFlow } from "./DraftEditFlow";

const validator = new DraftValidator({ now: () => new Date("2026-11-24T03:00:00Z") });
const card = (over: Partial<DraftCard> = {}): DraftCard => ({
  id: "c1", kind: "expense", amount: 12000, categoryId: "grocery", title: "수납함", paymentMethod: null, cardName: null, date: "2026-11-23",
  reason: "need", feeling: "satisfied", memo: null, ai: false, saved: false, ...over,
});

describe("DraftEditFlow", () => {
  it("카드 값으로 시작한다 — 금액은 쉼표, 빈 값은 빈칸", () => {
    expect(DraftEditFlow.of(card()).values).toEqual({
      kind: "expense", amount: "12,000", date: "2026-11-23", categoryId: "grocery", title: "수납함", paymentMethod: "", cardName: "", memo: "",
    });
  });

  it("「카드 이름」 칸은 체크카드 · 신용카드일 때만", () => {
    const flow = DraftEditFlow.of(card());
    expect([flow.byCard, flow.set("paymentMethod", "cash").byCard, flow.set("paymentMethod", "credit_card").byCard, flow.set("paymentMethod", "check_card").byCard]).toEqual([false, false, true, true]);
  });

  it("종류를 바꾸면 카테고리가 풀리고, 지출이 아니면 결제수단 · 카드 이름 · 이유 · 기분이 비워진다", () => {
    const flow = DraftEditFlow.of(card({ paymentMethod: "credit_card", cardName: "삼성카드" })).setKind("transfer");
    expect(flow.values).toMatchObject({ kind: "transfer", categoryId: "", paymentMethod: "", cardName: "" });
    expect(flow.apply(validator, card())).toMatchObject({ kind: "transfer", categoryId: null, paymentMethod: null, cardName: null, reason: null, feeling: null });
    expect(flow.setKind("transfer")).toBe(flow);
  });

  it("적용: 검증기를 거친 값. 날짜를 지우면 화면 날짜(null), 이유 · 기분은 그대로", () => {
    const flow = DraftEditFlow.of(card()).set("amount", "15,000").set("date", "").set("paymentMethod", "credit_card").set("cardName", " 삼성카드 ").set("memo", " 선물용 ");
    expect(flow.apply(validator, card())).toEqual({
      kind: "expense", amount: 15000, categoryId: "grocery", title: "수납함", paymentMethod: "credit_card", cardName: "삼성카드", date: null,
      memo: "선물용", reason: "need", feeling: "satisfied",
    });
    // 카드 결제가 아니면 카드 이름은 버린다
    expect(flow.set("paymentMethod", "cash").apply(validator, card())).toMatchObject({ paymentMethod: "cash", cardName: null });
  });

  it("금액이 비었거나 범위 밖 · 메모 201자 · 받을 수 없는 날짜면 적용할 수 없다", () => {
    const flow = DraftEditFlow.of(card());
    expect([flow.set("amount", "").canApply, flow.set("amount", "0").canApply, flow.set("amount", "1,000,000,000,000").canApply, flow.set("memo", "a".repeat(201)).canApply]).toEqual([false, false, false, false]);
    expect(flow.set("amount", "").apply(validator, card())).toBeNull();
    expect(flow.set("date", "2026-11-25").apply(validator, card())).toBeNull();
    expect(flow.set("date", "2026-10-24").apply(validator, card())).toBeNull();
  });
});
