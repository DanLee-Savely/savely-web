import { describe, expect, it } from "vitest";
import { HabitCalendarTimeline } from "./HabitCalendarTimeline";
import { HeroStampTimeline } from "./HeroStampTimeline";
import { ProblemTimeline } from "./ProblemTimeline";
import { RewardTimeline } from "./RewardTimeline";
import { SolutionCardTimeline } from "./SolutionCardTimeline";

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

describe("ProblemTimeline (I3 · I12)", () => {
  const tl = new ProblemTimeline();

  it("흐름 단계는 1.35 · 1.35 · 1.35 · 1.35 · 3.75초 간격(1.5배)", () => {
    expect([0, 1.35, 2.69, 5.4, 9.14, 9.15].map((t) => tl.flowStep(t))).toEqual([0, 1, 1, 4, 4, 5]);
    expect(tl.flowEnd).toBeCloseTo(9.15);
  });

  it("「잊고」 카드는 1.425 + 0.375k초에 나타나 1.2초 뒤 흐려지며 사라진다", () => {
    expect(tl.forget(1.35, 3).map((c) => c.opacity)).toEqual([0, 0, 0]);
    expect(tl.forget(2.25, 3).map((c) => c.opacity)).toEqual([1, 1, expect.closeTo(0.2, 5)]);
    expect(tl.forget(4.5, 3).every((c) => c.opacity === 0 && c.blur === 6)).toBe(true);
  });

  it("금액은 1.0~2.6초 동안 천 원 단위로 올라 최종값에서 멈춘다", () => {
    expect(tl.amount(0.5, 1825000)).toMatchObject({ value: 0, opacity: 0, lit: [true, true, false] });
    expect(tl.amount(1.8, 1825000).value % 1000).toBe(0);
    expect(tl.amount(2.6, 1825000).value).toBe(1825000);
    expect(tl.stillAmount(1825000)).toEqual({ lit: [false, false, false], value: 1825000, opacity: 1, scale: 1 });
  });
});

describe("SolutionCardTimeline (I13)", () => {
  const tl = new SolutionCardTimeline("4,800원");

  it("금액이 0 → 4 → 48 → 480 → 4,800으로 입력되고 1.5초에 체크가 튀어나온다", () => {
    expect([0.5, 0.6, 0.8, 1.0, 1.1, 1.4].map((t) => tl.at(t, true).typed)).toEqual(["0", "0", "4", "48", "480", "4,800"]);
    expect(tl.at(1.0, true).caret).toBe(true);
    expect(tl.at(1.49, true).check).toBe(0);
    expect(tl.at(2, true).check).toBe(1);
  });

  it("1.0초에 26일 도장 · 25 → 26일, 0.9초에 「식비」 강조", () => {
    expect(tl.at(0.99, true)).toMatchObject({ streak: 25, mark: true });
    expect(tl.at(0.99, true).week[6].look).toBe("today");
    expect(tl.at(1.0, true).week[6].look).toBe("on");
    expect(tl.at(1.0, true).streak).toBe(26);
  });

  it("자동 전환 중에는 다음 단계 0.3초 전부터 사라지고, 고른 단계에서는 남는다", () => {
    expect(tl.at(3.0, true).opacity).toBe(1);
    expect(tl.at(3.45, true).opacity).toBe(0);
    expect(tl.at(3.45, false).opacity).toBe(1);
    expect(tl.still()).toMatchObject({ typed: "4,800", check: 1, streak: 26, opacity: 1 });
  });
});

describe("RewardTimeline (I6 · I14)", () => {
  const tl = new RewardTimeline(31);

  it("고리는 0.9 · 0.9 · 1.4 · 0.9초(4.1초 한 바퀴)로 그대로 순환한다", () => {
    expect([0, 0.9, 1.8, 3.2, 4.1].map((t) => tl.at(t).step)).toEqual([0, 1, 2, 3, 0]);
  });

  it("카드 1: 「마감하고」에서 오늘 도장, 한 바퀴마다 하루씩 넘어가고 31일 다음은 1일", () => {
    expect(tl.at(0.5).strip[2]).toMatchObject({ n: 25, look: "today" });
    expect(tl.at(1).strip[2]).toMatchObject({ n: 25, look: "on" });
    expect(tl.at(4.1 + 0.5).strip[2].n).toBe(26);
    expect(tl.at(4.1 * 7 + 0.5).strip[2].n).toBe(1);
    expect(tl.at(2.2).badge.opacity).toBeGreaterThan(0);
  });

  it("카드 2: 0.42초마다 도장 → 3.25초 ★ → 5.6초 주기로 다시", () => {
    expect(tl.at(0.3 + 0.42 * 3).week.filter((d) => d.look === "on")).toHaveLength(4);
    expect(tl.at(3.2).star).toBe(0);
    expect(tl.at(4).star).toBe(1);
    expect(tl.at(5.4).week.every((d) => d.look === "off")).toBe(true);
    expect(tl.at(5.6 + 1).week).toEqual(tl.at(1).week);
  });

  it("동작 줄이기: 「포인트 받고」 고정, 오늘 도장, 7칸 + ★", () => {
    const f = tl.still();
    expect(f).toMatchObject({ step: 2, star: 1, weekOpacity: 1 });
    expect(f.strip[2].look).toBe("on");
    expect(f.week.every((d) => d.look === "on")).toBe(true);
  });
});
