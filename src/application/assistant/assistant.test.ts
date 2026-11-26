import { describe, expect, it } from "vitest";
import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import { D1RecordRepository } from "@/infrastructure/record/D1RecordRepository";
import { InMemoryRecordRepository } from "@/infrastructure/record/InMemoryRecordRepository";
import { InMemoryRecordStatsReader } from "@/infrastructure/record/InMemoryRecordStatsReader";
import { SqliteD1 } from "@/infrastructure/record/testing/sqliteD1";
import { InterpretSentenceService } from "./InterpretSentenceService";
import { type DraftSaveItem, InvalidDraftsError, SaveDraftsService } from "./SaveDraftsService";

const clock = { now: () => new Date("2026-11-24T03:00:00Z") }; // 한국 2026-11-24
const TODAY = "2026-11-24";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item = (n: number, over: Partial<DraftSaveItem> = {}): DraftSaveItem => ({
  id: id(n), kind: "expense", amount: 9000, date: null, categoryId: "food", title: "점심", paymentMethod: null, cardName: null, reason: null, feeling: null, memo: null, ...over,
});
const setup = () => {
  const repository = new InMemoryRecordRepository();
  return { repository, save: new SaveDraftsService(repository, new InMemoryRecordStatsReader(repository), clock) };
};

describe("InterpretSentenceService", () => {
  it("문장을 초안으로 정리한다 — 날짜는 실제 오늘 기준, 못 읽은 조각은 그대로", async () => {
    const got = await new InterpretSentenceService(clock).execute("어제 점심 9천원, 커피");
    expect(got.drafts).toEqual([{ kind: "expense", amount: 9000, categoryId: "food", title: "점심", paymentMethod: null, cardName: null, date: "2026-11-23" }]);
    expect(got.unparsed).toEqual(["커피"]);
  });
});

describe("SaveDraftsService", () => {
  it("날짜별로 저장하고 건수 · 그 날 지출 합계를 돌려준다", async () => {
    const s = setup();
    await s.repository.insert(RecordEntry.restore({
      id: id(99), kind: "expense", amount: 1000, date: TODAY, categoryId: "cafe", title: null, paymentMethod: null, cardName: null,
      reason: null, feeling: null, memo: null, imageKey: null, createdAt: "t", updatedAt: "t",
    } satisfies RecordData));
    const one = await s.save.execute({ items: [item(1), item(2, { kind: "income", categoryId: "salary", amount: 3000000 })], screenDate: TODAY });
    expect(one).toEqual({ count: 2, days: [{ date: TODAY, count: 2 }], dayExpense: 10000 }); // 이미 있던 1,000원 포함, 수입은 빼고
    const many = await s.save.execute({ items: [item(3), item(4, { date: "2026-11-23" })], screenDate: TODAY });
    expect(many).toEqual({ count: 2, days: [{ date: "2026-11-23", count: 1 }, { date: TODAY, count: 1 }], dayExpense: null });
    expect((await s.repository.findById(id(4)))?.toData().date).toBe("2026-11-23");
  });

  it("이유 · 기분 · 메모 · 카드 이름은 사용자가 고른 값 그대로, 지출이 아니면 지출 전용 칸을 비운다", async () => {
    const s = setup();
    await s.save.execute({
      items: [
        item(1, { paymentMethod: "credit_card", cardName: "삼성카드", reason: "need", feeling: "satisfied", memo: "메모" }),
        item(2, { kind: "transfer", categoryId: "card_bill", paymentMethod: "cash", reason: "need" }),
        item(3, { categoryId: null, title: null }),
      ],
      screenDate: TODAY,
    });
    expect((await s.repository.findById(id(1)))?.toData()).toMatchObject({ cardName: "삼성카드", reason: "need", feeling: "satisfied", memo: "메모" });
    expect((await s.repository.findById(id(2)))?.toData()).toMatchObject({ kind: "transfer", paymentMethod: null, reason: null });
    expect((await s.repository.findById(id(3)))?.toData()).toMatchObject({ categoryId: null, title: null });
  });

  it("다시 눌러도 중복되지 않는다 — 같은 번호는 건너뛴다", async () => {
    const s = setup();
    const items = [item(1), item(2)];
    await s.save.execute({ items, screenDate: TODAY });
    const again = await s.save.execute({ items, screenDate: TODAY });
    expect([s.repository.size, again.count, again.dayExpense]).toEqual([2, 2, 18000]);
  });

  it("한 장이라도 틀리면 아무것도 저장하지 않는다", async () => {
    const s = setup();
    const bad: DraftSaveItem[][] = [
      [],
      Array.from({ length: 21 }, (_, n) => item(n + 1)),
      [item(1), item(1)],
      [item(1, { id: "abc" })],
      [item(1), item(2, { amount: 0 })],
      [item(1), item(2, { amount: 1_000_000_000_000 })],
      [item(1), item(2, { amount: 1.5 })],
      [item(1), item(2, { kind: "gift" })],
      [item(1), item(2, { categoryId: "salary" })],
      [item(1), item(2, { title: "가".repeat(61) })],
      [item(1), item(2, { memo: "a".repeat(201) })],
      [item(1), item(2, { reason: "because" })],
      [item(1), item(2, { date: "2026-11-25" })], // 미래
      [item(1), item(2, { date: "2026-10-24" })], // 30일보다 오래됨
      [item(1), item(2, { date: "2026-13-40" })],
    ];
    for (const items of bad) await expect(s.save.execute({ items, screenDate: TODAY }), JSON.stringify(items.at(-1))).rejects.toThrow(InvalidDraftsError);
    await expect(s.save.execute({ items: [item(1)], screenDate: "2026-11-25" })).rejects.toThrow(InvalidDraftsError);
    expect(s.repository.size).toBe(0);
  });

  it("화면 날짜는 30일보다 오래돼도 받는다(달력에서 고른 지난 날 — 폼과 같은 규칙)", async () => {
    const s = setup();
    expect((await s.save.execute({ items: [item(1)], screenDate: "2026-09-01" })).days).toEqual([{ date: "2026-09-01", count: 1 }]);
  });

  it("D1: 한 묶음으로 넣고, 같은 번호는 건너뛰고, 하나라도 제약에 걸리면 모두 되돌린다", async () => {
    const repository = new D1RecordRepository(new SqliteD1().migrate("0002").asD1());
    const entry = (n: number, over: Partial<RecordData> = {}) => RecordEntry.restore({
      id: id(n), kind: "expense", amount: 1000, date: TODAY, categoryId: null, title: null, paymentMethod: null, cardName: null,
      reason: null, feeling: null, memo: null, imageKey: null, createdAt: "t", updatedAt: "t", ...over,
    });
    expect(await repository.insertMany([entry(1), entry(2)])).toBe(2);
    expect(await repository.insertMany([entry(2, { amount: 5 }), entry(3)])).toBe(1);
    expect((await repository.findById(id(2)))?.toData().amount).toBe(1000); // 덮어쓰지 않는다
    await expect(repository.insertMany([entry(4), entry(5, { amount: 0 })])).rejects.toThrow();
    expect(await repository.findById(id(4))).toBeNull();
    expect((await repository.list(1, 10)).total).toBe(3);
  });
});
