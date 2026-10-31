import { clamp, easeOutCubic, floatUp, popScale, type DayMark } from "./motion";

const LOOP = 4.1; // I6 고리 한 바퀴: 0.9 · 0.9 · 1.4 · 0.9초
const STEP_AT = [0.9, 1.8, 3.2];
const WEEK = 5.6; // 카드 2 주기
const FIRST_DAY = 25; // 카드 1은 25일부터 하루씩 넘어간다

type Float = { opacity: number; dy: number };
export type StripDay = DayMark & { x: number };
export type RewardFrame = {
  step: number;
  /** 「포인트 받고」 칩의 +P */
  badge: Float;
  /** 카드 1: 날짜 4칸(왼쪽 밖 · 어제 · 오늘 · 내일), x = 칸 위치(px, 칸 간격 36) */
  strip: StripDay[];
  stripFloat: Float;
  /** 카드 2: 월~일 7칸 + ★ */
  week: DayMark[];
  star: number;
  starFloat: Float;
  weekOpacity: number;
};

// I6 · I14 보상 — 고리 단계와 카드 2개를 한 시계로 그린다. 「마감하고」에서 오늘 도장, 「포인트 받고」에서 +P
export class RewardTimeline {
  constructor(private readonly days: number) {}

  at(t: number): RewardFrame {
    const cycle = Math.floor(t / LOOP);
    const l = t - cycle * LOOP;
    const step = STEP_AT.filter((s) => l >= s).length;
    const p = floatUp((l - 1.8) / 0.9);
    return {
      step,
      badge: p,
      strip: this.strip(
        FIRST_DAY + cycle,
        cycle ? easeOutCubic(clamp(l / 0.45)) : 1,
        step >= 1 ? l - 0.9 : -1,
      ),
      stripFloat: p,
      ...this.week(t % WEEK),
    };
  }

  /** 동작 줄이기: 「포인트 받고」 고정, 카드 1은 오늘 도장, 카드 2는 7칸 + ★ */
  still(): RewardFrame {
    const none = { opacity: 0, dy: 0 };
    return {
      step: 2,
      badge: none,
      strip: this.strip(FIRST_DAY, 1, Infinity),
      stripFloat: none,
      ...this.week(4.2),
      starFloat: none,
    };
  }

  // 오늘(today)을 가운데 칸에 두고, 하루가 넘어갈 때 0.45초 동안 왼쪽으로 한 칸 민다. stamped = 오늘 도장이 찍힌 뒤 초(음수면 아직)
  private strip(today: number, slide: number, stamped: number): StripDay[] {
    return [-2, -1, 0, 1].map((d, j) => {
      const date = today + d;
      const on = d < 0 || (d === 0 && stamped >= 0);
      return {
        n: ((date - 1) % this.days) + 1,
        look: on ? "on" : d === 0 ? "today" : "off",
        since: d === 0 && stamped >= 0 ? stamped : undefined,
        x: (j - 1) * 36 + 36 * (1 - slide),
      };
    });
  }

  // 0.3초부터 0.42초마다 도장 → 3.25초 ★ → 3.45초 +P → 5.0~5.3초 흐려지고 5.3~5.6초 빈 상태로 나타난다
  private week(
    l: number,
  ): Pick<RewardFrame, "week" | "star" | "starFloat" | "weekOpacity"> {
    const reset = l >= 5.3;
    return {
      week: Array.from({ length: 7 }, (_, j): DayMark => {
        const since = l - (0.3 + 0.42 * j);
        const on = !reset && since >= 0;
        return {
          n: 19 + j,
          look: on ? "on" : "off",
          since: on ? since : undefined,
        };
      }),
      star: !reset && l >= 3.25 ? popScale((l - 3.25) / 0.42) : 0,
      starFloat: floatUp((l - 3.45) / 0.9),
      weekOpacity:
        l >= 5.0 && l < 5.3 ? 1 - (l - 5.0) / 0.3 : reset ? (l - 5.3) / 0.3 : 1,
    };
  }
}
