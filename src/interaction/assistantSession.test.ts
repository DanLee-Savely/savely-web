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

  // ── 추가 기능: 도움말 · 진입 블록 · 고정지출 · 카드 등록 ──
  const cardDrafts = (s: AssistantSession) => s.messages.flatMap((m) => (m.type === "recurringDrafts" ? m.cards : []));
  const due = (title: string, dueDate: string) => ({ item: { id: `i-${title}`, kind: "expense" as const, amount: 17000, dayOfMonth: 15, title, categoryId: null, paymentMethod: null, cardName: null, createdAt: "t", updatedAt: "t" }, dueDate, isToday: dueDate === TODAY });

  it("도움말: 문장으로 물으면 사용자 말풍선과 함께, 칩은 거듭 눌러도 한 번만", () => {
    const asked = start().send("도움말").receiveOutcome({ type: "help" }, newId);
    expect([asked.phase, asked.messages.slice(-2).map((m) => m.type)]).toEqual(["idle", ["user", "help"]]);
    const chip = start().showHelp();
    expect([chip.messages.at(-1)?.type, chip.showHelp()]).toEqual(["help", chip]);
  });

  it("진입 블록은 첫 안내 자리에 하나만 선다. 치우면 첫 안내로 돌아간다", () => {
    const unfilled = { type: "unfilled" as const, unfilled: { shown: [], total: 2 } };
    const s = start().showEntry(unfilled);
    expect([s.messages.length, s.messages[0].type]).toEqual([1, "unfilled"]);
    // 이미 다른 블록이 서 있으면 덮지 않는다
    expect(s.showEntry({ type: "recurringAsk", candidates: [] })).toBe(s);
    const closed = s.closeEntry();
    expect([closed.messages[0].type, closed.closeEntry()]).toEqual(["notice", closed]);
    const later = start().showEntry({ type: "recurringAsk", candidates: [] });
    expect([later.askingRecurring, later.closeEntry("필요할 때 「고정지출 보여줘」라고 적어 주세요").messages.map((m) => m.type)]).toEqual([true, ["notice", "notice"]]);
  });

  it("그날 질문: 한 번에 하나씩. 「기록할게요」는 초안 카드를 만들 뿐이다 — 다 물으면 첫 안내로", () => {
    let s = start().showEntry({ type: "recurringDue", queue: [due("넷플릭스", "2026-11-15"), due("월세", TODAY)] });
    s = s.addDraft({ ...draft(), title: "넷플릭스", date: "2026-11-15" }, newId).answerDue();
    expect([s.messages[0].type === "recurringDue" && s.messages[0].queue.map((d) => d.item.title), s.pending.map((x) => [x.title, x.date]), s.phase]).toEqual([["월세"], [["넷플릭스", "2026-11-15"]], "draftsReady"]);
    s = s.answerDue();
    expect([s.messages[0].type, s.pending.length]).toEqual(["notice", 1]);
  });

  it("자주 적는 항목 칩: 말풍선 없이 카드가 이어 붙고, 20건이 차면 안내는 한 번만", () => {
    let s = start().addDraft(draft(), newId).addDraft(draft({ title: "점심" }), newId);
    expect([s.messages.map((m) => m.type), s.pending.length]).toEqual([["notice", "drafts"], 2]);
    for (let i = 0; i < 18; i++) s = s.addDraft(draft(), newId);
    const full = s.addDraft(draft(), newId).addDraft(draft(), newId);
    expect([full.pending.length, full.messages.filter((m) => m.type === "notice" && m.text.startsWith("한 번에 20건까지")).length]).toEqual([20, 1]);
  });

  it("고정지출 등록: 카드는 기록 초안이 아니다 — 저장 대상에 들지 않고, 등록하면 잠긴다", () => {
    const reply = { intent: "register" as const, cards: [{ draft: draft({ title: "넷플릭스", amount: 17000 }), dayOfMonth: 15 }, { draft: draft({ title: "헬스장" }), dayOfMonth: null }], unparsed: ["음"], invalid: 1 };
    let s = start().send("넷플릭스 17000원 매달 15일 고정지출").receiveOutcome({ type: "recurring", reply }, newId);
    expect([s.pending.length, s.phase, s.messages.at(-2)]).toEqual([0, "idle", { type: "notice", text: "고정지출로 등록할까요?", offerManual: false }]);
    const [a, b] = cardDrafts(s);
    expect(s.messages.at(-1)).toMatchObject({ notes: ["이 부분은 알아듣지 못했어요: 「음」", "금액이 0원이거나 너무 큰 항목은 뺐어요"] });
    s = s.updateRecurringCard(b.id, { dayOfMonth: 31 }).recurringRegistered(a.id, 15);
    expect([cardDrafts(s).map((x) => [x.registered, x.dayOfMonth]), lastNotice(s)?.text]).toEqual([[[true, 15], [false, 31]], "등록했어요. 매달 15일에 물어볼게요"]);
    expect(lastNotice(s.recurringRegistered(b.id, 31))?.text).toBe("등록했어요. 매달 말일에 물어볼게요");
    // 등록한 카드는 고치거나 지우지 못한다
    expect(cardDrafts(s.updateRecurringCard(a.id, { amount: 1 }).removeRecurringCard(a.id).removeRecurringCard(b.id)).map((x) => x.amount)).toEqual([17000]);
  });

  it("고정지출 등록: 금액이 없으면 안내만 한다", () => {
    const need = start().send("넷플릭스 고정지출 등록").receiveOutcome({ type: "recurring", reply: { intent: "register", cards: [], unparsed: [], invalid: 0 } }, newId);
    expect(lastNotice(need)?.text.startsWith("「넷플릭스 17000원 매달 15일 고정지출」처럼")).toBe(true);
    const invalid = start().send("월세 0원 매달 25일 고정지출").receiveOutcome({ type: "recurring", reply: { intent: "register", cards: [], unparsed: [], invalid: 1 } }, newId);
    expect(lastNotice(invalid)?.text).toBe("금액이 0원이거나 너무 큰 항목은 뺐어요");
  });

  it("고정지출 보기 · 삭제: 목록, 못 찾으면 목록과 안내, 삭제는 줄마다 따로", () => {
    const items = [due("넷플릭스", TODAY).item, due("넷플릭스 프리미엄", TODAY).item];
    const say = (reply: Parameters<AssistantSession["receiveOutcome"]>[0]) => start().send("x").receiveOutcome(reply, newId);
    expect(lastNotice(say({ type: "recurring", reply: { intent: "list", items: [] } }))?.text).toBe("등록한 고정지출이 없어요");
    expect(say({ type: "recurring", reply: { intent: "list", items } }).messages.slice(-2).map((m) => m.type)).toEqual(["notice", "recurringList"]);
    const notFound = say({ type: "recurring", reply: { intent: "remove", query: "왓챠", found: [], all: items } });
    expect(notFound.messages.slice(-3).map((m) => (m.type === "notice" ? m.text : m.type))).toEqual(["그런 이름의 고정지출을 찾지 못했어요", "등록한 고정지출이에요. 눌러서 고치거나 지울 수 있어요", "recurringList"]);
    let s = say({ type: "recurring", reply: { intent: "remove", query: "넷플", found: items, all: items } });
    expect(s.messages.at(-2)).toMatchObject({ text: "어느 것을 지울까요?" });
    s = s.recurringRemoved(items[0].id).refreshRecurring([items[1]]);
    expect([s.messages.find((m) => m.type === "recurringRemove"), lastNotice(s)?.text]).toMatchObject([{ removedIds: [items[0].id], kept: false }, "지웠어요. 이제 묻지 않을게요"]);
    const index = s.messages.findIndex((m) => m.type === "recurringRemove");
    expect(s.keepRecurring(index).messages[index]).toMatchObject({ kept: true });
  });

  it("카드 등록: 이름이 없거나 길면 안내, 아니면 등록 카드 — 종류를 바꾸고 등록하면 잠긴다", () => {
    const say = (reply: { name: string | null; method: string; tooLong: boolean }) => start().send("x").receiveOutcome({ type: "card", reply }, newId);
    expect(lastNotice(say({ name: null, method: "credit_card", tooLong: false }))?.text).toBe("「삼성카드 등록」처럼 카드 이름을 함께 적어 주세요");
    expect(lastNotice(say({ name: null, method: "credit_card", tooLong: true }))?.text).toBe("카드 이름은 20자까지 등록할 수 있어요");
    let s = say({ name: "삼성카드", method: "credit_card", tooLong: false });
    const card = s.messages.at(-1);
    if (card?.type !== "cardDraft") throw new Error("카드 등록 카드가 아니다");
    expect(s.messages.at(-2)).toMatchObject({ text: "이 카드를 등록할까요?" });
    s = s.setCardMethod(card.id, "check_card").cardRegistered(card.id);
    expect([s.messages.find((m) => m.type === "cardDraft"), lastNotice(s)?.text]).toMatchObject([{ method: "check_card", registered: true }, "등록했어요. 이제 「삼성카드」라고 적으면 알아볼게요"]);
    expect(s.setCardMethod(card.id, "credit_card").messages.find((m) => m.type === "cardDraft")).toMatchObject({ method: "check_card" });
  });

  it("등록 후보를 누르면 후보에서 빠지고 등록 카드가 된다", () => {
    const candidates = [{ draft: draft({ title: "월세", amount: 500000 }), dayOfMonth: 25 }, { draft: draft({ title: "통신" }), dayOfMonth: 20 }];
    let s = start().showEntry({ type: "recurringAsk", candidates }).pickCandidate(0, newId);
    expect([s.messages[0].type === "recurringAsk" && s.messages[0].candidates.map((x) => x.draft.title), cardDrafts(s).map((x) => [x.title, x.dayOfMonth, x.registered])]).toEqual([["통신"], [["월세", 25, false]]]);
    s = s.pickCandidate(0, newId);
    expect([cardDrafts(s).length, s.messages.filter((m) => m.type === "recurringDrafts").length, s.pickCandidate(5, newId)]).toEqual([2, 1, s]);
  });
});
