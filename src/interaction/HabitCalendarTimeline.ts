import type { DayMark } from "./motion";

export type HabitFrame = { days: DayMark[]; count: number };
type Mode = 0 | 1; // 0 = 점검이 빠진 한 달, 1 = 세이블리와 함께한 한 달

// I15 습관 한 달 달력 — t = 토글을 누른 뒤 지난 초
// 함께한 한 달: 0.3초부터 1일 → 31일 순서로 35ms마다 도장 / 다시 빠진 한 달: 0.05초부터 31일 → 1일 순서로 12ms마다 지워진다
export class HabitCalendarTimeline {
  constructor(private readonly days: number) {}

  /** 애니메이션이 끝나는 시각(초). 이후에는 시계를 멈춰도 된다 */
  duration(mode: Mode): number {
    return mode ? 0.3 + 0.035 * (this.days - 1) + 0.7 : 0.05 + 0.012 * (this.days - 1);
  }

  at(t: number, mode: Mode, from: Mode): HabitFrame {
    return this.frame((i) => {
      if (mode) return t - (0.3 + i * 0.035);
      return from && t < 0.05 + (this.days - 1 - i) * 0.012 ? Infinity : -1;
    });
  }

  /** 동작 줄이기: 누르면 바로 바뀐다 */
  still(mode: Mode): HabitFrame {
    return this.frame(() => (mode ? Infinity : -1));
  }

  // since(i) ≥ 0이면 도장. 도장이 하나도 없으면 날짜를 더 연하게(empty)
  private frame(since: (i: number) => number): HabitFrame {
    const s = Array.from({ length: this.days }, (_, i) => since(i));
    const count = s.filter((x) => x >= 0).length;
    const days = s.map((x, i): DayMark => ({ n: i + 1, look: x >= 0 ? "on" : count ? "off" : "empty", since: x >= 0 ? x : undefined }));
    return { days, count };
  }
}
