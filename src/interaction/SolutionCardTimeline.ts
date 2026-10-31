import { clamp, popScale, type DayMark } from "./motion";

const STEP = 3.5; // I5 자동 전환 간격
const WEEK = [20, 21, 22, 23, 24, 25, 26]; // 26일이 오늘

export type SolutionCardFrame = {
  opacity: number;
  dy: number;
  /** 01: 입력 중인 금액(숫자만)과 커서 · 체크 */
  typed: string;
  caret: boolean;
  check: number;
  /** 02: 한 주 도장 · 연속 정산 일수 */
  week: DayMark[];
  streak: number;
  /** 03: 「식비」 강조 */
  mark: boolean;
};

// I13 해결 단계 카드 — lt = 단계가 바뀐 뒤 지난 초, auto = 자동 전환 중(다음 단계 0.3초 전부터 사라진다)
export class SolutionCardTimeline {
  /** 입력 순서: 「4,800원」이면 0 → 4 → 48 → 480 → 4,800 */
  private readonly typing: string[];

  constructor(amount: string) {
    const digits = amount.replace(/\D/g, "");
    this.typing = [
      "0",
      ...Array.from(digits, (_, i) =>
        Number(digits.slice(0, i + 1)).toLocaleString("ko-KR"),
      ),
    ];
  }

  at(lt: number, auto: boolean): SolutionCardFrame {
    const fadeIn = clamp((lt - 0.15) / 0.35);
    const fadeOut = auto ? clamp((lt - (STEP - 0.3)) / 0.25) : 0;
    const k = clamp((lt - 0.55) / 0.8);
    const since = lt - 1.0;
    return {
      opacity: fadeIn * (1 - fadeOut),
      dy: (1 - fadeIn) * 12 - fadeOut * 6,
      typed:
        this.typing[
          Math.min(this.typing.length - 1, Math.floor(k * this.typing.length))
        ],
      caret: k > 0 && k < 1,
      check: lt >= 1.5 ? popScale((lt - 1.5) / 0.4) : 0,
      week: WEEK.map((n, i) => {
        const today = i === WEEK.length - 1;
        return {
          n,
          look: !today || since >= 0 ? "on" : "today",
          since: today && since >= 0 ? since : undefined,
        };
      }),
      streak: since >= 0 ? 26 : 25,
      mark: lt >= 0.9,
    };
  }

  /** 동작 줄이기: 완성 상태(4,800원 + 체크 · 26일 도장 · 강조) */
  still(): SolutionCardFrame {
    return this.at(9, false);
  }
}
