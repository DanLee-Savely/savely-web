import { describe, expect, it } from "vitest";
import { type RecordData, RecordEntry } from "@/domain/record/RecordEntry";
import { InMemoryRecordRepository } from "@/infrastructure/record/InMemoryRecordRepository";
import { InMemoryRecordStatsReader } from "@/infrastructure/record/InMemoryRecordStatsReader";
import { GetHomeSummaryService } from "./GetHomeSummaryService";
import { GetMonthCalendarService } from "./GetMonthCalendarService";
import { GetMonthlyReportService } from "./GetMonthlyReportService";

const clock = { now: () => new Date("2026-10-26T03:00:00Z") }; // 한국 2026-10-26(월)
let n = 0;
const row = (date: string, amount: number, over: Partial<RecordData> = {}): RecordData => {
  n++;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, kind: "expense", amount, date, categoryId: "food", title: null,
    paymentMethod: null, cardName: null, reason: null, feeling: null, memo: null, imageKey: null,
    createdAt: `2026-10-26T00:00:${String(n % 60).padStart(2, "0")}.000Z`, updatedAt: "2026-10-26T00:00:00.000Z", ...over,
  };
};
const setup = async (rows: RecordData[]) => {
  const repo = new InMemoryRecordRepository();
  for (const r of rows) await repo.insert(RecordEntry.restore(r));
  const stats = new InMemoryRecordStatsReader(repo);
  return { home: new GetHomeSummaryService(stats, clock), calendar: new GetMonthCalendarService(stats, clock), report: new GetMonthlyReportService(stats, clock) };
};

const october = [
  row("2026-10-26", 9000, { title: "점심", reason: "need", feeling: "satisfied" }),
  row("2026-10-26", 4800, { categoryId: "cafe", reason: "impulse", feeling: "regret" }),
  row("2026-10-26", 4600, { categoryId: "transport", reason: "fixed" }),
  row("2026-10-26", 3000000, { kind: "income", categoryId: "salary" }),
  row("2026-10-20", 29300, { categoryId: "shopping", reason: "impulse", feeling: "meh" }),
  row("2026-10-12", 55000, { categoryId: "telecom", reason: "fixed", feeling: "meh" }),
  row("2026-10-01", 1000),
  row("2026-09-30", 7000), // 최근 7일 밖 · 지난달
  row("2026-09-20", 500),
];

describe("홈 요약", () => {
  it("오늘 · 이번 달 · 최근 7일 · 많이 쓴 곳 — 수입은 수입 줄에만", async () => {
    const h = await (await setup(october)).home.execute();
    expect(h).toMatchObject({ today: "2026-10-26", todayCount: 4, todaySpent: 18400, expense: 103700, income: 3000000, count: 7 });
    expect(h.todayRecords).toHaveLength(3);
    expect(h.dailyAverage).toBe(Math.round(103700 / 26));
    expect(h.last7.map((d) => d.date)).toEqual(["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]);
    expect([h.last7[0].amount, h.last7[6].amount, h.last7Total]).toEqual([29300, 18400, 47700]);
    expect(h.topCategories).toEqual([
      { categoryId: "telecom", sum: 55000, percent: 53 },
      { categoryId: "shopping", sum: 29300, percent: 28 },
      { categoryId: "food", sum: 10000, percent: 10 },
    ]);
  });

  it("기록 0건이면 모두 0, 많이 쓴 곳 없음", async () => {
    const h = await (await setup([])).home.execute();
    expect(h).toMatchObject({ todayCount: 0, todaySpent: 0, expense: 0, income: 0, count: 0, dailyAverage: 0, last7Total: 0, topCategories: [] });
  });
});

describe("달력", () => {
  it("월요일 시작 칸 · 칸 금액은 지출만 · 기본 선택은 오늘", async () => {
    const c = await (await setup(october)).calendar.execute(undefined, undefined);
    expect(c.cells).toHaveLength(35); // 10월 1일이 목요일 → 앞 3칸 + 31일 + 뒤 1칸
    expect(c.cells[0]).toMatchObject({ date: "2026-09-28", inMonth: false, amount: 0 });
    expect(c.cells.find((x) => x.date === "2026-10-26")).toMatchObject({ amount: 18400, isToday: true });
    expect(c.cells.find((x) => x.date === "2026-10-27")).toMatchObject({ isFuture: true, amount: 0 });
    expect(c.selected).toMatchObject({ date: "2026-10-26", spent: 18400, count: 4, fixedCount: 1 });
    expect(c.selected.feelings).toEqual([{ feeling: "satisfied", count: 1 }, { feeling: "regret", count: 1 }]);
    expect([c.expense, c.count, c.month.next]).toEqual([103700, 7, null]);
  });

  it("date: 그 달 안의 과거만 선택, 미래 · 다른 달 · 잘못된 값은 기본 날짜", async () => {
    const s = await setup(october);
    expect((await s.calendar.execute("2026-10", "2026-10-12")).selected).toMatchObject({ date: "2026-10-12", fixedCount: 1, feelings: [{ feeling: "meh", count: 1 }] });
    for (const d of ["2026-10-27", "2026-09-12", "2026-10-40", "abc"]) expect((await s.calendar.execute("2026-10", d)).selected.date).toBe("2026-10-26");
    expect((await s.calendar.execute("2026-09", undefined)).selected.date).toBe("2026-09-30");
    expect((await s.calendar.execute("2026-12", undefined)).month.key).toBe("2026-10");
  });
});

describe("리포트", () => {
  it("합계 · 주 구간 · 카테고리 비율 · 이유 · 기분 · 충동 인사이트", async () => {
    const r = await (await setup(october)).report.execute(undefined);
    expect(r).toMatchObject({ count: 7, expense: 103700, income: 3000000, impulse: { total: 2, regret: 1 } });
    expect(r.weeks.map((w) => [w.amount, w.state, w.isMax])).toEqual([
      [1000, "done", false], [55000, "done", true], [29300, "done", false], [18400, "current", false], [null, "future", false],
    ]);
    expect(r.categories[0]).toEqual({ categoryId: "telecom", sum: 55000, percent: 53 });
    expect(r.reasons.find((x) => x.id === "impulse")?.count).toBe(2);
    expect(r.feelings.find((x) => x.id === "meh")?.count).toBe(2);
  });

  it("지난달 같은 기간(9월 1~26일)과 비교, 지난달 기록이 없으면 none", async () => {
    expect((await (await setup(october)).report.execute(undefined)).compare).toEqual({ state: "more", diff: 103700 - 500 });
    expect((await (await setup([row("2026-10-02", 100), row("2026-09-02", 100)])).report.execute(undefined)).compare).toEqual({ state: "same", diff: 0 });
    expect((await (await setup([row("2026-10-02", 100)])).report.execute(undefined)).compare.state).toBe("none");
  });

  it("빈 달: 모두 0, 가장 많이 쓴 주 없음, 충동 인사이트 없음", async () => {
    const r = await (await setup(october)).report.execute("2026-08");
    expect(r).toMatchObject({ count: 0, empty: true, expense: 0, impulse: null, categories: [] });
    expect(r.weeks.some((w) => w.isMax)).toBe(false);
  });
});

// 80-record-assistant §4 · K3 · K5 · K6 — 앱의 화면별 처리와 같게
describe("상환 · 저축 · 카테고리 없는 기록", () => {
  const mixed = [
    ...october,
    row("2026-10-26", 500000, { kind: "transfer", categoryId: "card_bill" }),
    row("2026-10-25", 300000, { kind: "savings", categoryId: "savings_deposit" }),
    row("2026-10-26", 4500, { categoryId: null }), // 금액만 적은 지출
    row("2026-10-24", 2000, { categoryId: "etc_expense" }),
  ];

  it("상환 · 저축은 지출 합계 · 막대 · 카테고리에 들지 않고 건수에만 든다", async () => {
    const s = await setup(mixed);
    const h = await s.home.execute();
    expect(h).toMatchObject({ todayCount: 6, todaySpent: 22900, expense: 110200, income: 3000000, count: 11 });
    expect(h.last7Total).toBe(47700 + 4500 + 2000);
    const c = await s.calendar.execute(undefined, undefined);
    expect([c.expense, c.count, c.selected.spent, c.selected.count]).toEqual([110200, 11, 22900, 6]);
    expect(c.cells.find((x) => x.date === "2026-10-25")?.amount).toBe(0); // 저축만 있는 날
    const r = await s.report.execute(undefined);
    expect(r).toMatchObject({ count: 11, empty: false, expense: 110200 });
    expect(r.categories.some((x) => x.categoryId === "card_bill" || x.categoryId === "savings_deposit")).toBe(false);
  });

  it("카테고리를 고르지 않은 지출은 「기타」에 합친다", async () => {
    const r = await (await setup(mixed)).report.execute(undefined);
    expect(r.categories.find((x) => x.categoryId === "etc_expense")).toEqual({ categoryId: "etc_expense", sum: 6500, percent: 6 });
    expect(r.categories.reduce((s, x) => s + x.sum, 0)).toBe(r.expense);
    const only = await (await setup([row("2026-10-26", 4500, { categoryId: null })])).report.execute(undefined);
    expect(only.categories).toEqual([{ categoryId: "etc_expense", sum: 4500, percent: 100 }]);
  });

  it("리포트 빈 상태 · 지난달 비교는 지출 기준 — 수입 · 상환 · 저축만 있는 달은 빈 달", async () => {
    const noExpense = [
      row("2026-10-10", 3000000, { kind: "income", categoryId: "salary" }),
      row("2026-10-11", 500000, { kind: "transfer", categoryId: "card_bill" }),
    ];
    expect(await (await setup(noExpense)).report.execute(undefined)).toMatchObject({ count: 2, empty: true, expense: 0 });
    const prevIncomeOnly = [row("2026-10-02", 100), row("2026-09-02", 3000000, { kind: "income", categoryId: "salary" })];
    expect((await (await setup(prevIncomeOnly)).report.execute(undefined)).compare.state).toBe("none");
  });
});
