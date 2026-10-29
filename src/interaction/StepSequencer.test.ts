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

  it("select는 그 단계로 가서 자동 진행을 멈춘다", () => {
    const s = new StepSequencer([3500, 3500, 3500], true).select(2);
    expect(s).toMatchObject({ step: 2, done: true, nextDelay: null });
    expect(s.advance()).toBe(s);
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
