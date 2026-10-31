import { bump, clamp, easeOutCubic } from "./motion";

// I3 흐름 단계: 0.9 · 0.9 · 0.9 · 0.9 · 2.5초 → 0~3 열 강조, 4 반복, 5 최종
const STEPS = [0.9, 1.8, 2.7, 3.6, 6.1];
// I12 금액 줄 강조 구간(하루 · 한 달 · 1년)
const LIT = [
  [0.2, 0.7],
  [0.45, 0.95],
  [0.7, 2.6],
];
const COUNT_FROM = 1.0;
const COUNT_TO = 2.6;

export type ForgetChip = { opacity: number; dy: number; blur: number };
export type AmountFrame = {
  lit: boolean[];
  value: number;
  opacity: number;
  scale: number;
};

// I3 · I12 문제 — 흐름 시계(t)와 금액 시계(t, 금액 영역이 보이는 순간부터)를 각각 받는다
export class ProblemTimeline {
  /** 흐름 시계가 멈춰도 되는 시각 */
  readonly flowEnd = STEPS[STEPS.length - 1];
  readonly countEnd = COUNT_TO + 0.35;

  flowStep(t: number): number {
    return STEPS.filter((s) => t >= s).length;
  }

  /** 「잊고」 아래 기록 카드 k: 0.95 + 0.25k초에 0.25초 동안 나타나고, 0.8초 뒤 0.55초 동안 흐려지며 위로 사라진다 */
  forget(t: number, count: number): ForgetChip[] {
    return Array.from({ length: count }, (_, k) => {
      const at = 0.95 + 0.25 * k;
      const fadeIn = clamp((t - at) / 0.25);
      const fadeOut = clamp((t - at - 0.8) / 0.55);
      return {
        opacity: fadeIn * (1 - fadeOut),
        dy: (1 - fadeIn) * 10 - fadeOut * 12,
        blur: fadeOut * 6,
      };
    });
  }

  /** 금액: 0.85초에 나타나 1.0~2.6초 동안 0 → total(천 원 단위 반올림), 끝나면 0.35초 동안 1.035배로 튄다 */
  amount(t: number, total: number): AmountFrame {
    const k = easeOutCubic(clamp((t - COUNT_FROM) / (COUNT_TO - COUNT_FROM)));
    return {
      lit: LIT.map(([a, b]) => t >= a && t < b),
      value: k >= 1 ? total : Math.round((total * k) / 1000) * 1000,
      opacity: clamp((t - (COUNT_FROM - 0.15)) / 0.2),
      scale: bump((t - COUNT_TO) / 0.35, 0.035),
    };
  }

  /** 동작 줄이기: 처음부터 최종값, 카드는 숨긴다 */
  stillAmount(total: number): AmountFrame {
    return { lit: LIT.map(() => false), value: total, opacity: 1, scale: 1 };
  }
}
