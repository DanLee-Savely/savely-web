import { describe, expect, it } from "vitest";
import { MonthKey } from "./MonthKey";
import { RecordDate } from "./RecordDate";
import { WeekBuckets } from "./WeekBuckets";

const at = (iso: string) => ({ now: () => new Date(iso) });
const oct26 = at("2026-10-26T03:00:00Z"); // 한국 2026-10-26 12:00

describe("MonthKey", () => {
  it("형식 오류 · 없는 달 · 미래 달 · 빈 값은 이번 달", () => {
    for (const raw of [undefined, "", "abc", "2026-13", "2026-00", "2026-1", "2026-11", "2027-01"]) expect(MonthKey.parse(raw, oct26).key).toBe("2026-10");
    expect(MonthKey.parse("2026-09", oct26).key).toBe("2026-09");
  });

  it("28 · 29 · 30 · 31일인 달", () => {
    expect(["2026-02", "2024-02", "2026-04", "2026-01"].map((m) => MonthKey.parse(m, oct26).days)).toEqual([28, 29, 30, 31]);
  });

  it("이번 달은 끝 = 오늘 · 경과 일수 = 오늘 날짜, 지난 달은 말일 · 일수", () => {
    expect(MonthKey.parse(undefined, oct26)).toMatchObject({ start: "2026-10-01", end: "2026-10-26", elapsedDays: 26, isCurrent: true });
    expect(MonthKey.parse("2026-09", oct26)).toMatchObject({ start: "2026-09-01", end: "2026-09-30", elapsedDays: 30, isCurrent: false });
  });

  it("이전 · 다음 달: 해를 넘기고, 이번 달의 다음 달은 없음", () => {
    expect(MonthKey.parse("2026-01", oct26).prev().key).toBe("2025-12");
    expect(MonthKey.parse("2025-12", oct26).next()?.key).toBe("2026-01");
    expect(MonthKey.parse(undefined, oct26).next()).toBeNull();
  });

  it("한국 시간 0~9시: UTC로는 전날 · 전달이어도 한국 날짜로 판단", () => {
    const m = MonthKey.parse(undefined, at("2026-10-31T15:30:00Z")); // 한국 11-01 00:30
    expect([m.key, m.today, m.end, m.elapsedDays]).toEqual(["2026-11", "2026-11-01", "2026-11-01", 1]);
    expect(MonthKey.parse("2026-11", at("2026-10-31T14:59:00Z")).key).toBe("2026-10"); // 한국 10-31 23:59 → 11월은 미래
  });

  it("지난달 같은 기간: 같은 날까지, 지난달이 짧으면 말일까지", () => {
    expect(MonthKey.parse(undefined, oct26).prevSamePeriodEnd()).toBe("2026-09-26");
    expect(MonthKey.parse(undefined, at("2026-03-31T03:00:00Z")).prevSamePeriodEnd()).toBe("2026-02-28");
    expect(MonthKey.parse("2026-03", oct26).prevSamePeriodEnd()).toBe("2026-02-28");
  });
});

describe("WeekBuckets", () => {
  const ranges = (m: string) => WeekBuckets.of(MonthKey.parse(m, oct26)).map((b) => `${b.from}-${b.to}`);
  it("28일은 4구간, 29 · 30 · 31일은 다섯째 구간이 29–말일", () => {
    expect(ranges("2026-02")).toEqual(["1-7", "8-14", "15-21", "22-28"]);
    expect(ranges("2024-02").at(-1)).toBe("29-29");
    expect(ranges("2026-04").at(-1)).toBe("29-30");
    expect(ranges("2026-01").at(-1)).toBe("29-31");
  });

  it("이번 달: 오늘이 든 구간은 진행 중, 이후는 예정 / 지난 달은 모두 끝남", () => {
    expect(WeekBuckets.of(MonthKey.parse(undefined, oct26)).map((b) => b.state)).toEqual(["done", "done", "done", "current", "future"]);
    expect(WeekBuckets.of(MonthKey.parse("2026-09", oct26)).every((b) => b.state === "done")).toBe(true);
  });
});

describe("RecordDate 날짜 계산", () => {
  it("n일 앞뒤 · 요일(월 = 0)", () => {
    expect(RecordDate.addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(RecordDate.addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(RecordDate.weekday("2026-10-01")).toBe(3); // 목요일
    expect(RecordDate.weekday("2026-10-26")).toBe(0); // 월요일
  });
});
