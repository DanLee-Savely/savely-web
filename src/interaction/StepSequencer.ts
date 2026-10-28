// 시간에 따라 단계를 넘기는 애니메이션의 상태 (I2 공감 · I3 문제 · I5 해결 · I6 보상)
// delays[i] = i단계에서 다음 단계로 넘어가기까지의 대기(ms)
// - 한 번 재생: 단계 수 = delays.length + 1, 마지막 단계에서 멈춘다
// - 반복: 단계 수 = delays.length, 마지막 단계 다음은 0단계
// 불변 객체 — 타이머는 갖지 않는다. 시간 흐름은 훅이 advance()를 불러 표현한다
export class StepSequencer {
  constructor(
    readonly delays: readonly number[],
    readonly loop = false,
    readonly step = 0,
  ) {
    if (delays.length === 0) throw new RangeError("delays가 비어 있어요");
    if (!Number.isInteger(step) || step < 0 || step >= this.stepCount) throw new RangeError("step이 범위를 벗어났어요");
  }

  get stepCount(): number {
    return this.loop ? this.delays.length : this.delays.length + 1;
  }

  /** 다음 단계까지 남은 대기(ms). 한 번 재생이 끝났으면 null */
  get nextDelay(): number | null {
    return this.done ? null : this.delays[this.step];
  }

  get done(): boolean {
    return !this.loop && this.step === this.stepCount - 1;
  }

  advance(): StepSequencer {
    if (this.done) return this;
    return this.at((this.step + 1) % this.stepCount);
  }

  /** 마지막 단계로 바로 이동 (reduced-motion) */
  finish(): StepSequencer {
    return this.at(this.stepCount - 1);
  }

  private at(step: number): StepSequencer {
    return new StepSequencer(this.delays, this.loop, step);
  }
}
