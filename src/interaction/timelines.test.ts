import { describe, expect, it } from "vitest";
import { HabitCalendarTimeline } from "./HabitCalendarTimeline";
import { HeroStampTimeline } from "./HeroStampTimeline";

const stamped = (days: { look: string }[]) => days.filter((d) => d.look === "on").length;

describe("HeroStampTimeline (I11)", () => {
  const tl = new HeroStampTimeline(31, 4);

  it("11일 도장 · 12일 오늘에서 시작하고, 첫 카드 0.55초 뒤 12일에 도장이 찍힌다", () => {
    expect(stamped(tl.at(0).days)).toBe(11);
    expect(tl.at(0).days[11].look).toBe("today");
    expect(tl.at(0.79).streak).toBe(11);
    const f = tl.at(0.85);
    expect(f.streak).toBe(12);
    expect(f.days[11]).toMatchObject({ look: "on", since: expect.closeTo(0.05, 5) });
  });

  it("카드는 두 칸에 번갈아 2.3초 보이고, 기록 4개를 순환한다", () => {
    expect(tl.at(0.25 + 1.3 + 0.5).cards.map((c) => [c.slot, c.record])).toEqual([[1, 1], [0, 0]]);
    expect(tl.at(0.25 + 1.3 * 4 + 1).cards[0]).toMatchObject({ slot: 0, record: 0, opacity: 1 });
  });

  it("25일까지 찬 뒤 흐려졌다가 11일 상태로 돌아와 20.8초 주기로 반복한다", () => {
    expect(tl.at(18).streak).toBe(25);
    expect(tl.at(0.25 + 20).calOpacity).toBeCloseTo(0.6);
    expect(tl.at(0.25 + 20.4).streak).toBe(11);
    const sig = (t: number) => {
      const f = tl.at(t);
      return [f.streak, f.calOpacity.toFixed(3), f.cards.map((c) => [c.slot, c.record, c.opacity.toFixed(3)])];
    };
    for (const t of [1, 5.5, 13.2, 20.6]) expect(sig(t + 20.8)).toEqual(sig(t));
  });

  it("동작 줄이기는 14일까지 도장, 카드 1장 고정", () => {
    const f = tl.still();
    expect(stamped(f.days)).toBe(14);
    expect(f.cards).toEqual([{ slot: 0, record: 0, opacity: 1, dy: 0 }]);
  });
});

describe("HabitCalendarTimeline (I15)", () => {
  const tl = new HabitCalendarTimeline(31);

  it("함께한 한 달: 0.3초부터 35ms마다 1일 → 31일 도장", () => {
    expect(tl.at(0.29, 1, 0).count).toBe(0);
    expect(tl.at(0.6, 1, 0).count).toBe(9);
    expect(tl.at(tl.duration(1), 1, 0).count).toBe(31);
  });

  it("빠진 한 달로 돌아가면 31일부터 12ms마다 지워지고, 도장이 없으면 더 연한 숫자", () => {
    expect(tl.at(0.1, 0, 1).days[30].look).toBe("off");
    expect(tl.at(0.1, 0, 1).days[0].look).toBe("on");
    expect(tl.at(tl.duration(0), 0, 1).days.every((d) => d.look === "empty")).toBe(true);
    expect(tl.at(1, 0, 0).count).toBe(0);
  });

  it("동작 줄이기는 누르면 바로 바뀐다", () => {
    expect(tl.still(1).count).toBe(31);
    expect(tl.still(0).count).toBe(0);
  });
});
