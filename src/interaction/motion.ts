// A안 공용 곡선 · 도장 모양 (preview.html과 같은 식). 상태 없는 순수 함수 — 20-interactions A안 공통
export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export const easeOutCubic = (k: number) => 1 - (1 - k) ** 3;
const easeOutBack = (k: number) => 1 + 3.2 * (k - 1) ** 3 + 2.2 * (k - 1) ** 2;

/** k가 0~1일 때 sin으로 한 번 부풀었다 돌아오는 배율 (n 튐 · 금액 끝 튐) */
export const bump = (k: number, amount: number) => (k > 0 && k < 1 ? 1 + amount * Math.sin(k * Math.PI) : 1);

/** 날짜 원. since = 도장이 찍힌 뒤 지난 초(찍히는 중인 날만) */
export type DayMark = { n: number; look: "on" | "today" | "off" | "empty"; since?: number };

/** 도장 찍힘: 0.42초 easeOutBack 확대(0.55 → 1) + 0.7초 퍼지는 테두리(투명도 0.6 → 0, 1 → 2.1배) */
export function stampFx(since = Infinity) {
  const k = since / 0.42;
  const r = since / 0.7;
  return {
    scale: k >= 0 && k < 1 ? 0.55 + 0.45 * easeOutBack(k) : 1,
    ring: r >= 0 && r < 1 ? 0.6 * (1 - r) : 0,
    ringScale: 1 + r * 1.1,
  };
}

/** 위로 떠오르며 사라지는 「+P」: k(0~1) 동안 처음 20%에 나타나고 22px 올라간다 */
export function floatUp(k: number) {
  return { opacity: k <= 0 || k >= 1 ? 0 : k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8, dy: -22 * clamp(k) };
}
