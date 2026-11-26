import { describe, expect, it } from "vitest";
import { StepSequencer } from "./StepSequencer";

describe("StepSequencer", () => {
  it("한 번 재생: 단계별 대기를 알려 주고 마지막 단계에서 멈춘다", () => {
    const s = new StepSequencer([800, 1000, 1000]);
    expect(s.stepCount).toBe(4);
    expect(s.nextDelay).toBe(800);
    const last = s.advance().advance().advance();
    expect(last).toMatchObject({ step: 3, done: true, nextDelay: null });
    expect(last.advance()).toBe(last);
  });

  it("반복: 마지막 단계 다음은 0단계이고 끝나지 않는다", () => {
    const s = new StepSequencer([900, 900, 1400, 900], true);
    expect(s.stepCount).toBe(4);
    const last = s.advance().advance().advance();
    expect(last).toMatchObject({ step: 3, done: false, nextDelay: 900 });
    expect(last.advance().step).toBe(0);
  });

  it("finish는 마지막 단계로 바로 간다", () => {
    expect(new StepSequencer([800, 1000, 1000]).finish().step).toBe(3);
  });

  it("select는 그 단계로 가고, 자동 진행은 그 단계에서 이어진다", () => {
    const s = new StepSequencer([6000, 6000, 6000], true).select(1);
    expect(s).toMatchObject({ step: 1, picked: true, done: false, nextDelay: 6000 });
    expect(s.advance()).toMatchObject({ step: 2, picked: false });
    expect(s.advance().advance().step).toBe(0);
  });

  it("hold는 그 단계로 가서 머문다 — 자동 진행을 다시 시작하지 않는다", () => {
    const before = new StepSequencer([6000]).hold(1);
    expect(before).toMatchObject({ step: 1, picked: true, held: true, done: true, nextDelay: null });
    // 자동으로 넘어간 뒤 앞 단계를 다시 골라도 또 넘어가지 않는다
    const back = new StepSequencer([6000]).advance().hold(0);
    expect(back).toMatchObject({ step: 0, done: true, nextDelay: null });
    expect(back.advance()).toBe(back);
  });

  it("이동해도 원래 객체는 바뀌지 않는다", () => {
    const s = new StepSequencer([800]);
    s.advance();
    expect(s.step).toBe(0);
  });

  it("잘못된 값은 거부한다", () => {
    expect(() => new StepSequencer([])).toThrow(RangeError);
    expect(() => new StepSequencer([800], false, 2)).toThrow(RangeError);
  });
});
