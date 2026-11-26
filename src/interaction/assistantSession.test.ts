import { describe, expect, it } from "vitest";
import type { InterpretedDraft, InterpretResult } from "@/application/assistant/InterpretSentenceService";
import { AssistantSession } from "./AssistantSession";

const TODAY = "2026-11-24";
const draft = (over: Partial<InterpretedDraft> = {}): InterpretedDraft => ({ kind: "expense", amount: 4500, categoryId: "cafe", title: "커피", paymentMethod: null, cardName: null, date: null, ai: false, ...over });
const result = (drafts: InterpretedDraft[], over: Partial<InterpretResult> = {}): InterpretResult => ({ drafts, unparsed: [], invalidCount: 0, invalidDateCount: 0, overflowCount: 0, ...over });
let n = 0;
const newId = () => `id-${++n}`;
const start = (screenDate = TODAY) => AssistantSession.start(screenDate, TODAY);
const lastNotice = (s: AssistantSession) => {
  const m = s.messages.at(-1);
  return m?.type === "notice" ? m : null;
};

describe("AssistantSession", () => {
  it("첫 안내: 오늘이면 「오늘」, 지난 날이면 「M월 D일에」", () => {
    expect(lastNotice(start())?.text.startsWith("오늘 쓴 돈과 들어온 돈을 편하게 적어 주세요.")).toBe(true);
    expect(lastNotice(start("2026-10-12"))?.text.startsWith("10월 12일에 쓴 돈과 들어온 돈을")).toBe(true);
  });

  it("문장을 보내면 정리 중 → 초안 카드. 빈 문장 · 바쁠 때는 무시", () => {
    const s = start();
    expect(s.send("  ")).toBe(s);
    const sending = s.send(" 커피 4500원 ");
    expect([sending.phase, sending.busy, sending.messages.at(-1)]).toEqual(["parsing", true, { type: "user", text: "커피 4500원" }]);
    expect(sending.send("또")).toBe(sending);
    const ready = sending.receive(result([draft(), draft({ title: "점심", amount: 9000 })]), newId);
    expect([ready.phase, ready.pending.length, ready.lastSendMadeCards]).toEqual(["draftsReady", 2, true]);
    expect(ready.messages.at(-2)).toMatchObject({ type: "notice", text: "2건으로 정리했어요. 맞는지 확인하고 저장해 주세요" });
    expect(ready.pending[0]).toMatchObject({ reason: null, feeling: null, memo: null, saved: false, ai: false });
  });

  it("못 알아들으면 안내 — 2번 이어지면 「직접 입력으로 전환」. 길이 초과 · 날짜 탓은 세지 않는다", () => {
    let s = start().send("커피").receive(result([]), newId);
    expect([s.phase, lastNotice(s)?.text.startsWith("금액을 찾지 못했어요"), lastNotice(s)?.offerManual, s.lastSendMadeCards]).toEqual(["parseFailed", true, false, false]);
    s = s.send("가".repeat(501)).failed("inputTooLong");
    expect([lastNotice(s)?.text.startsWith("한 번에 500자까지"), lastNotice(s)?.offerManual]).toEqual([true, false]);
    s = s.send("내일 영화 15000원").receive(result([], { invalidDateCount: 1 }), newId);
    expect([lastNotice(s)?.text.includes("날짜의 항목은 뺐어요"), lastNotice(s)?.offerManual]).toEqual([true, false]);
    s = s.send("커피 0원").receive(result([], { invalidCount: 1 }), newId);
    expect([lastNotice(s)?.text, lastNotice(s)?.offerManual]).toEqual(["금액이 0원이거나 너무 큰 항목은 뺐어요", true]);
    // 카드가 나오면 다시 0부터 센다
    s = s.send("커피 4500원").receive(result([draft()]), newId).send("음").failed("failed");
    expect([lastNotice(s)?.text, lastNotice(s)?.offerManual, s.phase]).toEqual(["지금은 정리하지 못했어요. 다시 보내 주세요", false, "draftsReady"]);
  });

  it("요청 제한에 걸리면 알리고, 「못 알아들음」으로 세지 않는다. OpenAI가 정리한 카드는 표시가 붙는다", () => {
    let s = start().send("커피").receive(result([]), newId).send("커피 4500원").failed("rateLimited");
    expect([lastNotice(s)?.text, lastNotice(s)?.offerManual]).toEqual(["요청이 너무 많아요. 잠시 후 다시 시도해 주세요", false]);
    s = s.send("커피 사천오백").receive(result([draft({ ai: true }), draft()]), newId);
    expect(s.pending.map((x) => x.ai)).toEqual([true, false]);
  });

  it("카드 아래 안내: 못 읽은 조각 · 뺀 항목", () => {
    const s = start().send("x").receive(result([draft()], { unparsed: ["커피", "음"], invalidCount: 1, invalidDateCount: 1 }), newId);
    const m = s.messages.at(-1);
    expect(m?.type === "drafts" && m.notes).toEqual([
      "이 부분은 알아듣지 못했어요: 「커피」, 「음」", "금액이 0원이거나 너무 큰 항목은 뺐어요", "오늘보다 뒤이거나 30일보다 오래된 날짜의 항목은 뺐어요",
    ]);
  });

  it("이어 붙여서 20건까지 — 넘으면 자르고 알린다", () => {
    let s = start().send("a").receive(result(Array.from({ length: 18 }, () => draft())), newId);
    s = s.send("b").receive(result(Array.from({ length: 5 }, () => draft())), newId);
    const m = s.messages.at(-1);
    expect([s.pending.length, m?.type === "drafts" && m.cards.length, m?.type === "drafts" && m.notes.at(-1)?.startsWith("한 번에 20건까지")]).toEqual([20, 2, true]);
    s = s.send("c").receive(result([draft()]), newId);
    expect([s.pending.length, lastNotice(s)?.text.startsWith("한 번에 20건까지"), s.lastSendMadeCards]).toEqual([20, true, false]);
  });

  it("이유 · 기분: 같은 칩을 다시 누르면 풀리고, 이유를 풀면 기분도 지운다. 지출이 아니면 고르지 못한다", () => {
    let s = start().send("a").receive(result([draft(), draft({ kind: "income", categoryId: "salary" })]), newId);
    const [expense, income] = s.pending;
    expect(s.pickFeeling(expense.id, "regret")).toBe(s); // 이유를 고르기 전
    s = s.pickReason(expense.id, "impulse").pickFeeling(expense.id, "regret");
    expect(s.pending[0]).toMatchObject({ reason: "impulse", feeling: "regret" });
    expect(s.pickFeeling(expense.id, "regret").pending[0].feeling).toBeNull();
    expect(s.pickReason(expense.id, "impulse").pending[0]).toMatchObject({ reason: null, feeling: null });
    expect(s.pickReason(income.id, "need")).toBe(s);
  });

  it("카드를 고치고 지운다. 다 지우면 입력 대기로", () => {
    let s = start().send("a").receive(result([draft(), draft()]), newId);
    const [a, b] = s.pending;
    s = s.update(a.id, { amount: 5000, title: "라떼" });
    expect(s.pending[0]).toMatchObject({ id: a.id, amount: 5000, title: "라떼" });
    s = s.remove(a.id);
    expect([s.pending.length, s.phase]).toEqual([1, "draftsReady"]);
    s = s.remove(b.id);
    expect([s.pending.length, s.phase]).toEqual([0, "idle"]);
  });

  it("저장: 날짜별로 묶고(없으면 화면 날짜), 끝나면 카드를 잠그고 요약을 붙인다", () => {
    let s = start().send("a").receive(result([draft(), draft({ date: "2026-11-23" }), draft({ date: TODAY })]), newId);
    expect(s.saveGroups.map((g) => [g.date, g.cards.length])).toEqual([["2026-11-23", 1], [TODAY, 2]]);
    expect(start("2026-10-12").send("a").receive(result([draft()]), newId).saveGroups[0].date).toBe("2026-10-12");
    const saving = s.beginSaving();
    expect([saving.phase, saving.busy, saving.beginSaving()]).toEqual(["saving", true, saving]);
    const failed = saving.saveFailed();
    expect([failed.phase, failed.pending.length]).toEqual(["draftsReady", 3]);
    s = saving.markSaved({ count: 3, days: [{ date: "2026-11-23", count: 1 }, { date: TODAY, count: 2 }], dayExpense: null });
    expect([s.phase, s.pending.length]).toEqual(["saved", 0]);
    expect(s.messages.at(-1)).toEqual({ type: "saved", text: "3건을 저장했어요.\n11월 23일 1건 · 11월 24일 2건", date: TODAY });
    // 저장한 카드는 고치거나 지우지 못한다
    const saved = s.messages.flatMap((m) => (m.type === "drafts" ? m.cards : []));
    expect(s.update(saved[0].id, { amount: 1 }).messages).toEqual(s.messages);
    expect(s.remove(saved[0].id).messages.flatMap((m) => (m.type === "drafts" ? m.cards : []))).toHaveLength(3);
  });

  it("한 날짜에 저장하면 그 날 지출 합계를 알려 준다", () => {
    const saving = start().send("a").receive(result([draft()]), newId).beginSaving();
    expect(saving.markSaved({ count: 1, days: [{ date: TODAY, count: 1 }], dayExpense: 13500 }).messages.at(-1)).toMatchObject({ text: "1건을 저장했어요. 오늘 지출 합계 13,500원", date: TODAY });
    expect(saving.markSaved({ count: 1, days: [{ date: "2026-11-20", count: 1 }], dayExpense: 4500 }).messages.at(-1)).toMatchObject({ text: "1건을 저장했어요. 11월 20일 지출 합계 4,500원", date: "2026-11-20" });
  });
});
