import { describe, expect, it } from "vitest";
import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import { D1RecordRepository } from "./D1RecordRepository";
import { D1RecordStatsReader } from "./D1RecordStatsReader";
import { InMemoryRecordRepository } from "./InMemoryRecordRepository";
import { InMemoryRecordStatsReader } from "./InMemoryRecordStatsReader";
import { SqliteD1 } from "./testing/sqliteD1";

// 실제 마이그레이션 파일(migrations-records/)과 D1 저장소의 SQL을 Node 내장 SQLite로 돌려 본다 (80-record-assistant §5)

let n = 0;
const row = (date: string, amount: number, over: Partial<RecordData> = {}): RecordData => {
  n++;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, kind: "expense", amount, date, categoryId: "food", title: null,
    paymentMethod: null, cardName: null, reason: null, feeling: null, memo: null, imageKey: null,
    createdAt: `2026-10-26T00:00:${String(n % 60).padStart(2, "0")}.000Z`, updatedAt: "2026-10-26T00:00:00.000Z", ...over,
  };
};

const OLD_ROWS = `
INSERT INTO records (id, kind, amount, record_date, category_id, title, payment_method, reason, feeling, memo, image_key, created_at, updated_at) VALUES
 ('a0000000-0000-4000-8000-000000000001', 'expense', 9000, '2026-10-26', 'food', '점심 김치찌개', 'check_card', 'need', 'satisfied', '메모', 'a0000000-0000-4000-8000-000000000001/x.jpg', '2026-10-26T03:00:00.000Z', '2026-10-26T04:00:00.000Z'),
 ('a0000000-0000-4000-8000-000000000002', 'income', 3000000, '2026-10-25', 'salary', NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-25T00:00:00.000Z', '2026-10-25T00:00:00.000Z'),
 ('a0000000-0000-4000-8000-000000000003', 'expense', 999999999999, '1999-01-01', 'etc_expense', '${"가".repeat(60)}', 'other', 'other', 'regret', '${"a".repeat(200)}', NULL, '2026-10-01T00:00:00.000Z', '2026-10-02T00:00:00.000Z');`;
const OLD_COLUMNS = "id, kind, amount, record_date, category_id, title, payment_method, reason, feeling, memo, image_key, created_at, updated_at";

describe("마이그레이션 0002", () => {
  it("기존 기록이 한 칸도 바뀌지 않고 옮겨진다 — 카드 이름만 빈칸으로 생긴다", () => {
    const db = new SqliteD1().migrate("0001");
    db.exec(OLD_ROWS);
    const before = db.query(`SELECT ${OLD_COLUMNS} FROM records ORDER BY id`);
    db.migrate("0002");
    expect(db.query(`SELECT ${OLD_COLUMNS} FROM records ORDER BY id`)).toEqual(before);
    expect(before).toHaveLength(3);
    expect(db.query("SELECT COUNT(*) AS n FROM records WHERE card_name IS NOT NULL")).toEqual([{ n: 0 }]);
  });

  it("목록 인덱스를 다시 만들고, 새 테이블 3개가 생기고, 임시 테이블은 남지 않는다", () => {
    const db = new SqliteD1().migrate("0002");
    const names = db.query<{ name: string }>("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
    expect(names).toEqual(["assistant_usage", "cards", "cards_name_key", "records", "records_date_idx", "recurring_items", "recurring_items_kind_name_key"]);
  });

  it("CHECK: 구분 4가지 · 카테고리 41종(비어도 됨) · 지출이 아니면 지출 전용 칸 금지 · 카드 이름은 카드 결제만", () => {
    const db = new SqliteD1().migrate("0002");
    const insert = (over: Record<string, string>) => {
      const v = { id: `'${crypto.randomUUID()}'`, kind: "'expense'", amount: "1000", record_date: "'2026-10-26'", category_id: "NULL",
        payment_method: "NULL", card_name: "NULL", reason: "NULL", ...over };
      db.exec(`INSERT INTO records (${Object.keys(v).join(", ")}, created_at, updated_at) VALUES (${Object.values(v).join(", ")}, 't', 't')`);
    };
    const accepted: Record<string, string>[] = [
      { kind: "'transfer'", category_id: "'card_bill'" },
      { kind: "'savings'", category_id: "'invest'" },
      { category_id: "'convenience'" },
      { category_id: "NULL" },
      { payment_method: "'credit_card'", card_name: "'삼성카드'" },
      { payment_method: "'check_card'", card_name: `'${"가".repeat(20)}'` },
    ];
    for (const ok of accepted) expect(() => insert(ok), JSON.stringify(ok)).not.toThrow();
    const rejected: Record<string, string>[] = [
      { kind: "'gift'" },
      { category_id: "'crypto'" },
      { kind: "'transfer'", payment_method: "'cash'" },
      { kind: "'savings'", reason: "'need'" },
      { kind: "'income'", payment_method: "'credit_card'", card_name: "'삼성카드'" },
      { payment_method: "'cash'", card_name: "'삼성카드'" },
      { card_name: "'삼성카드'" },
      { payment_method: "'credit_card'", card_name: `'${"가".repeat(21)}'` },
      { payment_method: "'credit_card'", card_name: "''" },
    ];
    for (const bad of rejected) expect(() => insert(bad), JSON.stringify(bad)).toThrow();
  });

  it("cards · recurring_items: 같은 이름은 하나, 한도 밖 값은 거부", () => {
    const db = new SqliteD1().migrate("0002");
    db.exec("INSERT INTO cards VALUES ('c1', '삼성카드', 'credit_card', 't')");
    expect(() => db.exec("INSERT INTO cards VALUES ('c2', '삼성카드', 'check_card', 't')")).toThrow();
    expect(() => db.exec("INSERT INTO cards VALUES ('c3', '현금', 'cash', 't')")).toThrow();
    const item = (id: string, kind: string, day: number, key: string) =>
      db.exec(`INSERT INTO recurring_items (id, kind, amount, day_of_month, title, name_key, created_at, updated_at) VALUES ('${id}', '${kind}', 17000, ${day}, '넷플릭스', '${key}', 't', 't')`);
    item("r1", "expense", 15, "넷플릭스");
    expect(() => item("r2", "expense", 20, "넷플릭스")).toThrow();
    expect(() => item("r3", "income", 15, "넷플릭스")).not.toThrow(); // 구분이 다르면 다른 항목
    expect(() => item("r4", "expense", 32, "다른 이름")).toThrow();
    expect(() => item("r5", "expense", 0, "또 다른 이름")).toThrow();
  });
});

describe("D1RecordRepository (0002 적용 뒤)", () => {
  it("상환 · 카테고리 없는 기록 · 카드 이름을 넣고, 읽고, 고치고, 지운다", async () => {
    const repo = new D1RecordRepository(new SqliteD1().migrate("0002").asD1());
    const rows = [
      row("2026-10-26", 500000, { kind: "transfer", categoryId: "card_bill" }),
      row("2026-10-25", 4500, { categoryId: null }),
      row("2026-10-24", 20000, { paymentMethod: "credit_card", cardName: "삼성카드", title: "저녁" }),
    ];
    for (const r of rows) await repo.insert(RecordEntry.restore(r));
    for (const r of rows) expect((await repo.findById(r.id))?.toData()).toEqual(r);
    const page = await repo.list(1, 10);
    expect([page.total, page.items.map((e) => e.id)]).toEqual([3, rows.map((r) => r.id)]);
    const changed = { ...rows[2], amount: 21000, paymentMethod: "cash", cardName: null, updatedAt: "2026-10-27T00:00:00.000Z" };
    expect(await repo.update(RecordEntry.restore(changed))).toBe(true);
    expect((await repo.findById(changed.id))?.toData()).toEqual(changed);
    expect((await repo.delete(rows[1].id))?.toData()).toEqual(rows[1]);
    expect(await repo.findById(rows[1].id)).toBeNull();
    expect(await repo.update(RecordEntry.restore(rows[1]))).toBe(false);
  });
});

describe("D1 집계 = 테스트용 집계", () => {
  const rows = [
    row("2026-10-26", 9000, { reason: "need", feeling: "satisfied" }),
    row("2026-10-26", 4800, { categoryId: "cafe", reason: "impulse", feeling: "regret" }),
    row("2026-10-26", 4500, { categoryId: null, reason: "impulse" }),
    row("2026-10-24", 2000, { categoryId: "etc_expense" }),
    row("2026-10-20", 3000000, { kind: "income", categoryId: "salary" }),
    row("2026-10-20", 500000, { kind: "transfer", categoryId: "card_bill" }),
    row("2026-10-19", 300000, { kind: "savings", categoryId: null }),
    row("2026-09-30", 7000, { categoryId: "cafe" }),
  ];

  it("구분별 합계 · 날짜별 · 카테고리별(카테고리 없음은 「기타」에 합침) · 이유 · 기분 · 충동 · 하루 기록이 모두 같다", async () => {
    const sqlite = new SqliteD1().migrate("0002").asD1();
    const d1Repo = new D1RecordRepository(sqlite);
    const memoryRepo = new InMemoryRecordRepository();
    for (const r of rows) {
      await d1Repo.insert(RecordEntry.restore(r));
      await memoryRepo.insert(RecordEntry.restore(r));
    }
    const d1 = new D1RecordStatsReader(sqlite);
    const memory = new InMemoryRecordStatsReader(memoryRepo);
    const range = ["2026-10-01", "2026-10-31"] as const;

    const totals = await d1.kindTotals(...range);
    expect(totals).toEqual({
      expense: { sum: 20300, count: 4 }, income: { sum: 3000000, count: 1 }, transfer: { sum: 500000, count: 1 }, savings: { sum: 300000, count: 1 },
    });
    expect(await memory.kindTotals(...range)).toEqual(totals);

    const categories = await d1.categoryExpense(...range);
    expect(categories).toEqual([{ categoryId: "food", sum: 9000 }, { categoryId: "etc_expense", sum: 6500 }, { categoryId: "cafe", sum: 4800 }]);
    expect(await memory.categoryExpense(...range)).toEqual(categories);

    // 카테고리 하나의 합계 · 건수 — 「기타」에는 카테고리 없는 지출이 합쳐지고, 지출이 아닌 카테고리도 읽는다
    for (const id of ["food", "cafe", "etc_expense", "salary", "card_bill", "savings_deposit", "pet"]) {
      expect(await memory.categoryTotal(...range, id), id).toEqual(await d1.categoryTotal(...range, id));
    }
    expect(await d1.categoryTotal(...range, "etc_expense")).toMatchObject({ sum: 6500 });
    expect(await d1.categoryTotal(...range, "pet")).toEqual({ sum: 0, count: 0 });

    expect(await memory.dailyExpense(...range)).toEqual(await d1.dailyExpense(...range));
    expect(await memory.reasonCounts(...range)).toEqual(await d1.reasonCounts(...range));
    expect(await memory.feelingCounts(...range)).toEqual(await d1.feelingCounts(...range));
    expect(await memory.impulseRegretCount(...range)).toBe(await d1.impulseRegretCount(...range));
    const day = (list: RecordEntry[]) => list.map((e) => e.toData());
    expect(day(await memory.recordsOn("2026-10-26"))).toEqual(day(await d1.recordsOn("2026-10-26")));
    // 기록이 없는 기간은 구분 4가지 모두 0
    expect(await d1.kindTotals("2026-08-01", "2026-08-31")).toEqual(await memory.kindTotals("2026-08-01", "2026-08-31"));
  });
});
