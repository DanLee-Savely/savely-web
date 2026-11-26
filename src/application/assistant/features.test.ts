import { describe, expect, it } from "vitest";
import { helpItems } from "@/content/assistant.content";
import { AssistantInsights } from "@/domain/assistant/AssistantInsights";
import { DraftValidator } from "@/domain/assistant/DraftValidator";
import { HelpRequest } from "@/domain/assistant/HelpRequest";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import { RecurringItem, type RecurringInput, type RecurringItemData } from "@/domain/recurring/RecurringItem";
import { D1CardRepository } from "@/infrastructure/assistant/D1CardRepository";
import { D1RecurringItemRepository } from "@/infrastructure/assistant/D1RecurringItemRepository";
import { InMemoryAssistantUsage } from "@/infrastructure/assistant/InMemoryAssistantUsage";
import { InMemoryCardRepository, InMemoryRecurringItemRepository } from "@/infrastructure/assistant/InMemoryAssistantStores";
import { InMemoryRecordRepository } from "@/infrastructure/record/InMemoryRecordRepository";
import { InMemoryRecordStatsReader } from "@/infrastructure/record/InMemoryRecordStatsReader";
import { SqliteD1 } from "@/infrastructure/record/testing/sqliteD1";
import { AnswerRecordQueryService } from "./AnswerRecordQueryService";
import { GetAssistantEntryService } from "./GetAssistantEntryService";
import { InterpretSentenceService } from "./InterpretSentenceService";
import { ListRecurringItemsService, RegisterRecurringItemService, RemoveRecurringItemService, UpdateRecurringItemService } from "./RecurringItemServices";
import { RegisterCardService } from "./RegisterCardService";

// 추가 기능 A(자주 적는 항목) · B(채우지 않은 기록) · C(고정지출) · E(카드 등록) · F(할 수 있는 일) — 80-record-assistant

const clock = { now: () => new Date("2026-11-24T03:00:00Z") }; // 한국 2026-11-24
const TODAY = "2026-11-24";
const validator = new DraftValidator(clock);
const names = CategoryCatalog.names;
let n = 0;
const row = (date: string, amount: number, over: Partial<RecordData> = {}): RecordData => {
  n++;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, kind: "expense", amount, date, categoryId: "cafe", title: "아메리카노", paymentMethod: null, cardName: null,
    reason: "impulse", feeling: "regret", memo: null, imageKey: null, createdAt: `2026-11-01T00:00:${String(n % 60).padStart(2, "0")}.000Z`, updatedAt: "t", ...over,
  };
};
const item = (title: string, dayOfMonth: number, over: Partial<RecurringItemData> = {}): RecurringItemData => ({
  id: `item-${title}`, kind: "expense", amount: 17000, dayOfMonth, title, categoryId: null, paymentMethod: null, cardName: null, createdAt: "t", updatedAt: "t", ...over,
});
const input = (over: Partial<RecurringInput> = {}): RecurringInput => ({ kind: "expense", amount: 17000, dayOfMonth: 15, title: "넷플릭스", categoryId: "subscription", paymentMethod: null, cardName: null, ...over });

const setup = () => {
  const cards = new InMemoryCardRepository();
  const recurring = new InMemoryRecurringItemRepository();
  const records = new InMemoryRecordRepository();
  const ai = { organizer: null, limiter: { allow: async () => true }, usage: new InMemoryAssistantUsage(), dailyLimit: 300, onFailure: () => {}, onUsage: () => {} };
  let seq = 0;
  const newId = () => `id-${++seq}`;
  return {
    cards, recurring, records,
    interpret: new InterpretSentenceService(clock, ai, cards, recurring, new AnswerRecordQueryService(new InMemoryRecordStatsReader(records))),
    registerCard: new RegisterCardService(cards, clock, newId),
    register: new RegisterRecurringItemService(recurring, clock, newId),
    update: new UpdateRecurringItemService(recurring, clock),
    remove: new RemoveRecurringItemService(recurring),
    list: new ListRecurringItemsService(recurring),
    entry: new GetAssistantEntryService(new InMemoryRecordStatsReader(records), recurring, clock),
  };
};
const say = (s: ReturnType<typeof setup>, text: string, assumeRegister = false) => s.interpret.execute({ text, screenDate: TODAY, ip: "ip", assumeRegister });

describe("문장을 읽는 순서: 도움말 → 고정지출 → 카드 등록 → 기록", () => {
  it("도움말: 묻는 말이면 목록. 숫자가 든 문장은 기록이다", async () => {
    const s = setup();
    for (const text of ["도움말", "사용법 알려줘", "뭐 할 수 있어?", "할 수 있는 일"]) expect((await say(s, text)).type, text).toBe("help");
    expect((await say(s, "사용법 책 15000원")).type).toBe("drafts");
    expect([HelpRequest.matches("뭘 할 수 있나요"), HelpRequest.matches("도움말 2")]).toEqual([true, false]);
  });

  it("고정지출: 등록 카드는 검증을 거치고, 읽기만 한다 — 문장만으로는 아무것도 등록되지 않는다", async () => {
    const s = setup();
    const got = await say(s, "넷플릭스 17000원 매달 15일 고정지출");
    expect(got).toMatchObject({ type: "recurring", reply: { intent: "register", invalid: 0, cards: [{ dayOfMonth: 15, draft: { title: "넷플릭스", amount: 17000, categoryId: "subscription", date: null } }] } });
    expect(await s.list.execute()).toEqual([]);
    expect(await say(s, "월세 0원 매달 25일 고정지출")).toMatchObject({ reply: { intent: "register", cards: [], invalid: 1 } });
    expect(await say(s, "넷플릭스 고정지출 등록")).toMatchObject({ reply: { intent: "register", cards: [], invalid: 0 } });
  });

  it("고정지출: 보기 · 삭제는 등록한 항목에서 찾는다. 「카드값 … 고정지출 추가」는 카드 등록이 아니라 고정지출이다", async () => {
    const s = setup();
    await s.register.execute(input());
    await s.register.execute(input({ title: "통신비", amount: 55000, dayOfMonth: 20, categoryId: "telecom" }));
    expect(await say(s, "고정지출 보여줘")).toMatchObject({ type: "recurring", reply: { intent: "list", items: [{ title: "넷플릭스" }, { title: "통신비" }] } });
    expect(await say(s, "넷플릭스 고정지출 삭제")).toMatchObject({ reply: { intent: "remove", found: [{ title: "넷플릭스" }] } });
    expect(await say(s, "왓챠 고정지출 삭제")).toMatchObject({ reply: { intent: "remove", query: "왓챠", found: [], all: [{}, {}] } });
    expect((await s.list.execute()).length).toBe(2); // 삭제 문장만으로는 지워지지 않는다
    expect(await say(s, "카드값 80만원 매월 14일 고정지출 추가")).toMatchObject({ type: "recurring", reply: { intent: "register", cards: [{ draft: { kind: "transfer", categoryId: "card_bill" } }] } });
  });

  it("고정지출 최초 질문이 떠 있는 동안에는 낱말 없이도 금액 + 날이면 등록으로 읽는다", async () => {
    const s = setup();
    expect((await say(s, "월세 50만원 25일")).type).toBe("drafts");
    expect(await say(s, "월세 50만원 25일", true)).toMatchObject({ type: "recurring", reply: { intent: "register", cards: [{ dayOfMonth: 25 }] } });
    expect((await say(s, "점심 9천원", true)).type).toBe("drafts");
  });

  it("카드 등록: 이름과 종류를 읽기만 한다. 이름이 없거나 20자를 넘으면 안내", async () => {
    const s = setup();
    expect(await say(s, "삼성카드 등록해줘")).toEqual({ type: "card", reply: { name: "삼성카드", method: "credit_card", tooLong: false } });
    expect(await say(s, "신한 체크카드 추가")).toMatchObject({ reply: { name: "신한 체크카드", method: "check_card" } });
    expect(await say(s, "카드 등록")).toMatchObject({ reply: { name: null, tooLong: false } });
    expect(await say(s, `${"가".repeat(19)}카드 등록`)).toMatchObject({ reply: { name: null, tooLong: true } });
    expect((await say(s, "커피 4500원 삼성카드")).type).toBe("drafts");
    expect(await s.cards.list()).toEqual([]);
  });

  it("등록한 카드는 바로 다음 문장부터 알아본다", async () => {
    const s = setup();
    // 등록 전: 「…카드」로 끝나는 낱말이라 신용카드로는 읽지만 카드 이름은 모른다
    expect(await say(s, "점심 9천원 삼성카드 taptap")).toMatchObject({ result: { drafts: [{ cardName: null, paymentMethod: "credit_card" }] } });
    expect(await s.registerCard.execute({ name: "삼성카드 taptap", method: "check_card" })).toBe("saved");
    expect(await say(s, "점심 9천원 삼성카드 taptap")).toMatchObject({ result: { drafts: [{ title: "점심", cardName: "삼성카드 taptap", paymentMethod: "check_card" }] } });
  });

  it("길이 한도를 넘은 문장은 고정지출 · 카드 낱말이 있어도 기록 경로가 안내한다", async () => {
    await expect(say(setup(), `고정지출 ${"가".repeat(500)}`)).rejects.toMatchObject({ failure: "inputTooLong" });
  });
});

describe("F — 「할 수 있는 일」의 예시는 적힌 대로 동작한다", () => {
  it("예시마다 의도한 결과가 나온다(날짜 예시는 오늘에서 5일 전)", async () => {
    const s = setup();
    const items = helpItems(TODAY);
    expect(items.map((i) => i.label)).toEqual(["쓴 돈·들어온 돈 기록하기", "지난 날의 기록 적기", "금액만 먼저 적고 나중에 채우기", "매달 나가는 돈 등록하기", "등록한 고정지출 보기·지우기", "카드 등록하기", "적은 기록 물어보기"]);
    expect(items[1].examples).toEqual(["어제 커피 만원", "11월 19일 커피 만원"]);
    const run = async (i: number, k = 0) => say(s, items[i].examples[k]);
    expect(await run(0)).toMatchObject({ type: "drafts", result: { drafts: [{ amount: 9000 }, { amount: 4500 }] } });
    expect(await run(1, 0)).toMatchObject({ result: { drafts: [{ amount: 10000, date: "2026-11-23" }] } });
    expect(await run(1, 1)).toMatchObject({ result: { drafts: [{ amount: 10000, date: "2026-11-19" }] } });
    expect(await run(2)).toMatchObject({ result: { drafts: [{ amount: 4500, title: null, categoryId: null }] } });
    expect(await run(3)).toMatchObject({ type: "recurring", reply: { intent: "register", cards: [{ dayOfMonth: 15 }] } });
    expect(await run(4)).toMatchObject({ type: "recurring", reply: { intent: "list" } });
    expect(await run(5)).toMatchObject({ type: "card", reply: { name: "삼성카드" } });
    expect(await run(6, 0)).toMatchObject({ type: "query", reply: { status: "answered", query: { kind: "periodTotal", period: "thisMonth" } } });
    expect(await run(6, 1)).toMatchObject({ type: "query", reply: { status: "answered", query: { kind: "categoryTotal", categoryId: "cafe" } } });
    expect(await run(6, 2)).toMatchObject({ type: "query", reply: { status: "answered", query: { kind: "dayList", from: "2026-11-23" } } });
  });
});

describe("E — 카드 등록", () => {
  it("같은 이름 · 30장 · 20자 · 카드가 아닌 결제수단", async () => {
    const s = setup();
    expect(await s.registerCard.execute({ name: " 삼성카드 ", method: "credit_card" })).toBe("saved");
    expect(await s.registerCard.execute({ name: "삼성카드", method: "check_card" })).toBe("duplicate");
    expect((await s.cards.list())[0]).toMatchObject({ name: "삼성카드", method: "credit_card" }); // 있던 카드의 종류도 바꾸지 않는다
    expect(await s.registerCard.execute({ name: "가".repeat(21), method: "credit_card" })).toBe("invalid");
    expect(await s.registerCard.execute({ name: "  ", method: "credit_card" })).toBe("invalid");
    expect(await s.registerCard.execute({ name: "현금", method: "cash" })).toBe("invalid");
    for (let i = 0; i < 29; i++) await s.registerCard.execute({ name: `카드 ${i}`, method: "check_card" });
    expect([await s.registerCard.execute({ name: "서른한 번째", method: "check_card" }), (await s.cards.list()).length]).toEqual(["limit", 30]);
  });

  it("D1: 같은 이름은 넣지 않고 등록한 순서대로 돌려준다", async () => {
    const repo = new D1CardRepository(new SqliteD1().migrate("0002").asD1());
    expect(await repo.insert({ id: "c1", name: "삼성카드", method: "credit_card", createdAt: "2026-11-24T00:00:01Z" })).toBe(true);
    expect(await repo.insert({ id: "c2", name: "삼성카드", method: "check_card", createdAt: "2026-11-24T00:00:02Z" })).toBe(false);
    expect(await repo.insert({ id: "c3", name: "현대카드", method: "check_card", createdAt: "2026-11-24T00:00:03Z" })).toBe(true);
    expect((await repo.list()).map((c) => [c.name, c.method])).toEqual([["삼성카드", "credit_card"], ["현대카드", "check_card"]]);
  });
});

describe("C — 고정지출 등록 · 수정 · 삭제", () => {
  it("등록: 검증기를 거친다. 같은 구분 · 같은 이름(띄어쓰기 · 대소문자 무시)은 하나, 30개까지", async () => {
    const s = setup();
    expect(await s.register.execute(input({ title: " Netflix  Premium " }))).toMatchObject({ outcome: "saved", item: { title: "Netflix Premium", dayOfMonth: 15 } });
    expect((await s.register.execute(input({ title: "netflix premium" }))).outcome).toBe("duplicate");
    expect((await s.register.execute(input({ title: "netflix premium", kind: "income", categoryId: null }))).outcome).toBe("saved"); // 구분이 다르면 다른 항목
    for (const bad of [{ amount: 0 }, { amount: 1_000_000_000_000 }, { dayOfMonth: 0 }, { dayOfMonth: 32 }, { dayOfMonth: 1.5 }, { title: "  " }, { kind: "gift" }]) {
      expect((await s.register.execute(input(bad))).outcome, JSON.stringify(bad)).toBe("invalid");
    }
    // 구분과 안 맞는 카테고리 · 지출이 아닌데 결제수단은 비운다
    expect(await s.register.execute(input({ title: "월급", kind: "income", categoryId: "food", paymentMethod: "cash" }))).toMatchObject({ item: { categoryId: null, paymentMethod: null } });
    for (let i = 0; i < 27; i++) await s.register.execute(input({ title: `항목 ${i}` }));
    expect([(await s.register.execute(input({ title: "서른한 번째" }))).outcome, (await s.list.execute()).length]).toEqual(["limit", 30]);
  });

  it("수정: 번호 · 등록 시각은 지키고, 다른 항목과 이름이 겹치면 바꾸지 않는다. 삭제는 한 번에 하나", async () => {
    const s = setup();
    const a = await s.register.execute(input());
    const b = await s.register.execute(input({ title: "통신비" }));
    if (a.outcome !== "saved" || b.outcome !== "saved") throw new Error("등록 실패");
    expect(await s.update.execute(a.item.id, input({ amount: 20000, dayOfMonth: 31 }))).toMatchObject({ outcome: "saved", item: { id: a.item.id, amount: 20000, dayOfMonth: 31, createdAt: a.item.createdAt } });
    expect((await s.update.execute(a.item.id, input({ title: "통신비" }))).outcome).toBe("duplicate");
    expect((await s.update.execute("없는 번호", input())).outcome).toBe("invalid");
    expect([await s.remove.execute(b.item.id), await s.remove.execute(b.item.id), (await s.list.execute()).map((i) => i.title)]).toEqual([true, false, ["넷플릭스"]]);
  });

  it("D1: 넣고 · 고치고 · 지운다. 같은 구분 · 같은 이름은 제약으로도 막힌다", async () => {
    const repo = new D1RecurringItemRepository(new SqliteD1().migrate("0002").asD1());
    const a = item("넷플릭스", 15, { id: "r1", categoryId: "subscription", paymentMethod: "credit_card", cardName: "삼성카드", createdAt: "2026-11-24T00:00:01Z" });
    await repo.insert(a);
    await repo.insert(item("월급", 25, { id: "r2", kind: "income", amount: 3000000, createdAt: "2026-11-24T00:00:02Z" }));
    expect(await repo.list()).toEqual([a, item("월급", 25, { id: "r2", kind: "income", amount: 3000000, createdAt: "2026-11-24T00:00:02Z" })]);
    await expect(repo.insert(item("넷플릭스", 20, { id: "r3" }))).rejects.toThrow();
    expect(await repo.update({ ...a, amount: 20000, dayOfMonth: 31 })).toBe(true);
    expect((await repo.list())[0]).toMatchObject({ amount: 20000, dayOfMonth: 31 });
    expect([await repo.update({ ...a, id: "없음" }), await repo.remove("r1"), await repo.remove("r1"), (await repo.list()).length]).toEqual([false, true, false, 1]);
  });

  it("나가는 날: 그 달에 없는 날은 말일. 이미 기록한 항목(구분 + 내용, 내용이 비면 카테고리 이름)은 묻지 않는다", () => {
    expect([RecurringItem.dueDate(31, 2026, 11), RecurringItem.dueDate(31, 2027, 2), RecurringItem.dueDate(5, 2026, 11)]).toEqual(["2026-11-30", "2027-02-28", "2026-11-05"]);
    const items = [item("넷플릭스", 15), item("통신", 20), item("월세", 24), item("적금", 28), item("월급", 10, { kind: "income" })];
    const records = [row("2026-11-15", 17000, { title: " 넷플릭스 " }), row("2026-11-20", 55000, { title: null, categoryId: "telecom" }), row("2026-11-10", 3000000, { title: "월급" })];
    const due = RecurringItem.due(items, records, TODAY, names);
    // 넷플릭스(기록함) · 통신(내용 없이 통신 카테고리로 기록함) · 적금(28일은 아직) 제외. 「월급」 기록은 지출이라 수입 항목과 다르다
    expect(due.map((d) => [d.item.title, d.dueDate, d.isToday])).toEqual([["월급", "2026-11-10", false], ["월세", "2026-11-24", true]]);
    expect(RecurringItem.draftOf(due[0].item, due[0].dueDate)).toMatchObject({ kind: "income", title: "월급", date: "2026-11-10" });
  });

  it("등록 후보: 지난달 · 지지난달에 한 번씩, 3일 이내. 금액 큰 순 5개, 이미 등록한 이름은 뺀다", () => {
    const pair = (title: string, amount: number, d1: string, d2: string, over: Partial<RecordData> = {}) => [row(`2026-10-${d1}`, amount, { title, categoryId: null, ...over }), row(`2026-09-${d2}`, amount, { title, categoryId: null, ...over })];
    const records = [
      ...pair("월세", 500000, "25", "25"),
      ...pair("넷플릭스", 17000, "15", "17", { categoryId: "subscription" }),
      ...pair("통신", 55000, "20", "21", { title: null, categoryId: "telecom" }), // 내용 없이 카테고리만 → 이름은 카테고리 이름
      ...pair("보험", 120000, "10", "20"), // 날짜 차이 10일
      ...pair("커피", 4500, "03", "03"), row("2026-10-04", 4500, { title: "커피", categoryId: null }), // 한 달에 두 번
      row("2026-10-05", 30000, { title: "이번만", categoryId: null }), // 한 달만
      ...pair("적금", 300000, "05", "05", { kind: "savings", categoryId: "savings_deposit" }),
    ];
    const got = RecurringItem.candidates(records, TODAY, [item("적금", 5, { kind: "savings" })], validator, names);
    expect(got.map((x) => [x.draft.title, x.draft.amount, x.dayOfMonth, x.draft.categoryId])).toEqual([["월세", 500000, 25, null], ["통신", 55000, 20, "telecom"], ["넷플릭스", 17000, 15, "subscription"]]);
  });
});

describe("A · B — 자주 적는 항목 · 채우지 않은 기록", () => {
  it("자주 적는 항목: 석 달 안에 3회 이상, 가장 최근 금액 · 결제수단. 이유 · 기분은 따라오지 않는다", () => {
    const records = [
      row("2026-11-20", 4800, { paymentMethod: "check_card" }), row("2026-10-11", 4500), row("2026-09-02", 4500), // 아메리카노 3회
      row("2026-11-21", 9000, { title: "점심", categoryId: "food" }), row("2026-11-22", 9500, { title: " 점심 ", categoryId: "food" }), row("2026-11-23", 8000, { title: "점심", categoryId: "food" }), row("2026-11-24", 8500, { title: "점심", categoryId: "food" }),
      row("2026-11-01", 5000, { title: "카페" }), row("2026-11-02", 5000, { title: "카페" }), row("2026-11-03", 5000, { title: "카페" }), // 내용이 카테고리 이름 그대로
      row("2026-11-01", 3000, { title: null }), row("2026-11-02", 3000, { title: null }), row("2026-11-03", 3000, { title: null }), // 내용 없음
      row("2026-08-31", 4500), // 석 달 밖
      row("2026-11-05", 1000, { title: "메모지", categoryId: null }), row("2026-11-06", 1200, { title: "메모지", categoryId: null }), row("2026-11-07", 1100, { title: "메모지", categoryId: null }), // 카테고리 없어도 내용이 같으면 후보
    ];
    const got = AssistantInsights.frequent(records, TODAY, validator, names);
    expect(got.map((x) => [x.draft.title, x.draft.amount, x.count, x.draft.paymentMethod])).toEqual([["점심", 8500, 4, null], ["아메리카노", 4800, 3, "check_card"], ["메모지", 1100, 3, null]]);
    expect(Object.keys(got[0].draft)).not.toContain("reason");
  });

  it("채우지 않은 기록: 카테고리가 빈 기록, 오늘 포함 7일, 최근 것부터 5줄 + 나머지 건수", () => {
    const records = [
      ...["24", "23", "22", "21", "20", "19", "18"].map((d) => row(`2026-11-${d}`, 4500, { categoryId: null, title: null })),
      row("2026-11-17", 4500, { categoryId: null }), // 7일 밖
      row("2026-11-24", 9000), // 카테고리 있음
    ];
    const got = AssistantInsights.unfilled(records, TODAY);
    expect([got.total, got.shown.map((r) => r.date)]).toEqual([7, ["2026-11-24", "2026-11-23", "2026-11-22", "2026-11-21", "2026-11-20"]]);
  });
});

describe("진입 재료 — 패널을 열 때 한 번", () => {
  it("칩 · 채우지 않은 기록 · 그날 질문 · 등록 후보를 공용 기록에서 계산한다", async () => {
    const s = setup();
    const add = (r: RecordData) => s.records.insert(RecordEntry.restore(r));
    for (const d of ["20", "21", "22"]) await add(row(`2026-11-${d}`, 4500));
    await add(row("2026-11-23", 4500, { categoryId: null, title: null }));
    await add(row("2026-10-25", 500000, { title: "월세", categoryId: null }));
    await add(row("2026-09-25", 500000, { title: "월세", categoryId: null }));
    await s.register.execute(input({ dayOfMonth: 15 }));
    await s.register.execute(input({ title: "헬스장", dayOfMonth: 28 }));
    const entry = await s.entry.execute(TODAY);
    expect(entry.frequent.map((x) => x.draft.title)).toEqual(["아메리카노"]);
    expect(entry.unfilled.total).toBe(1);
    expect(entry.due.map((d) => [d.item.title, d.dueDate, d.isToday])).toEqual([["넷플릭스", "2026-11-15", false]]);
    expect(entry.candidates.map((x) => x.draft.title)).toEqual(["월세"]);
    expect(entry.recurring).toHaveLength(2);
  });

  it("화면 날짜가 지난 날이면 그 날짜 기준으로 묻는다. 받을 수 없는 날짜(30일보다 오래됨)의 지난 항목은 묻지 않는다", async () => {
    const s = setup();
    await s.register.execute(input({ dayOfMonth: 15 }));
    expect((await s.entry.execute("2026-11-10")).due).toEqual([]); // 15일은 아직
    expect((await s.entry.execute("2026-11-15")).due).toMatchObject([{ isToday: true }]);
    expect((await s.entry.execute("2026-08-20")).due).toEqual([]); // 8월 15일은 30일보다 오래됨
    expect((await s.entry.execute("2026-08-15")).due).toMatchObject([{ isToday: true, dueDate: "2026-08-15" }]); // 화면 날짜 당일이면 화면 날짜로 저장되므로 묻는다
    expect((await s.entry.execute("엉뚱한 값")).due).toMatchObject([{ dueDate: "2026-11-15" }]); // 오늘로 본다
  });
});
