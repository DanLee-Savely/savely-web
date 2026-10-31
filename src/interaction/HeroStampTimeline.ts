import { bump, type DayMark } from "./motion";

const START = 11; // 1~11일 도장, 12일이 오늘
const STAMPS = 14; // 25일까지
const FIRST = 0.25;
const EVERY = 1.3;
const STAMP_AFTER = 0.55;
const SHOW = 2.3;
// 첫 카드 기준 초: 마지막 카드가 끝난 뒤 19.8초에 0.5초 흐려지고, 20.3초에 11일 상태로 0.5초 나타나 20.8초 주기로 반복
const FADE_OUT = 19.8;
const RESET = 20.3;
const PERIOD = 20.8;

export type HeroCard = { slot: 0 | 1; record: number; opacity: number; dy: number };
export type HeroFrame = { days: DayMark[]; streak: number; streakScale: number; calOpacity: number; cards: HeroCard[] };

// I11 히어로 — 0.25초부터 1.3초마다 기록 카드가 두 칸에 번갈아 나오고, 0.55초 뒤 오늘에 도장이 찍혀 n이 오른다
export class HeroStampTimeline {
  constructor(
    private readonly days: number,
    private readonly records: number,
  ) {}

  at(t: number): HeroFrame {
    const u = t - FIRST;
    if (u < 0) return this.frame(START, Infinity, 1, []);
    const l = u % PERIOD;
    const n = l >= RESET ? 0 : Math.max(0, Math.min(STAMPS, Math.floor((l - STAMP_AFTER) / EVERY) + 1));
    const calOpacity = l < FADE_OUT ? 1 : l < RESET ? 1 - (l - FADE_OUT) / 0.5 : (l - RESET) / 0.5;
    const k0 = Math.floor(l / EVERY);
    const cards = [k0, k0 - 1]
      .filter((k) => k >= 0 && k < STAMPS && l - k * EVERY < SHOW)
      .map((k) => this.card(k, (l - k * EVERY) / SHOW));
    return this.frame(START + n, n ? l - STAMP_AFTER - (n - 1) * EVERY : Infinity, calOpacity, cards);
  }

  /** 동작 줄이기: 14일까지 도장, 첫 기록 카드 고정 */
  still(): HeroFrame {
    return this.frame(14, Infinity, 1, [{ slot: 0, record: 0, opacity: 1, dy: 0 }]);
  }

  // 한 장은 2.3초: 처음 12%는 아래 14px에서 올라오며 나타나고, 마지막 14%는 8px 올라가며 사라진다
  private card(k: number, ph: number): HeroCard {
    const opacity = ph < 0.12 ? ph / 0.12 : ph > 0.86 ? (1 - ph) / 0.14 : 1;
    const dy = ph < 0.12 ? (1 - ph / 0.12) * 14 : ph > 0.86 ? (-(ph - 0.86) / 0.14) * 8 : 0;
    return { slot: (k % 2) as 0 | 1, record: k % this.records, opacity, dy };
  }

  private frame(stamped: number, since: number, calOpacity: number, cards: HeroCard[]): HeroFrame {
    const days = Array.from({ length: this.days }, (_, i): DayMark => ({
      n: i + 1,
      look: i < stamped ? "on" : i === stamped ? "today" : "off",
      since: i === stamped - 1 ? since : undefined,
    }));
    return { days, streak: stamped, streakScale: bump(since / 0.35, 0.25), calOpacity, cards };
  }
}
