export type CarouselTransition = "slide" | "fade";

// I1 히어로 캐러셀의 현재 위치와 이동 방식 (Figma 리액션 기준)
// - 이전 · 다음: 한 칸 슬라이드, 끝에서 순환(5→1 · 1→5)할 때는 페이드
// - 점 이동: 3칸 이상 떨어지면 페이드, 아니면 슬라이드
// - 화면 탭: 다음. 스와이프: 가로 이동이 세로보다 크고 40px 이상일 때만 넘긴다(세로 스크롤 방해 금지)
// 불변 객체 — 이동 메서드는 새 커서를 돌려준다
export class CarouselCursor {
  private static readonly FADE_DISTANCE = 3;
  private static readonly SWIPE_MIN = 40;
  private static readonly TAP_SLOP = 10;

  constructor(
    readonly count: number,
    readonly index = 0,
    readonly transition: CarouselTransition = "slide",
  ) {
    if (!Number.isInteger(count) || count < 1) throw new RangeError("count는 1 이상의 정수여야 해요");
    if (!Number.isInteger(index) || index < 0 || index >= count) throw new RangeError("index가 범위를 벗어났어요");
  }

  next(): CarouselCursor {
    const wraps = this.index === this.count - 1;
    return this.moveTo(wraps ? 0 : this.index + 1, wraps ? "fade" : "slide");
  }

  prev(): CarouselCursor {
    const wraps = this.index === 0;
    return this.moveTo(wraps ? this.count - 1 : this.index - 1, wraps ? "fade" : "slide");
  }

  goTo(index: number): CarouselCursor {
    const far = Math.abs(index - this.index) >= CarouselCursor.FADE_DISTANCE;
    return this.moveTo(index, far ? "fade" : "slide");
  }

  /** 화면에서 손을 뗐을 때(누른 곳부터 dx · dy 이동): 거의 안 움직였으면 탭 → 다음, 왼쪽 스와이프 → 다음, 오른쪽 → 이전, 그 외 그대로 */
  release(dx: number, dy: number): CarouselCursor {
    if (Math.hypot(dx, dy) < CarouselCursor.TAP_SLOP) return this.next();
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < CarouselCursor.SWIPE_MIN) return this;
    return dx < 0 ? this.next() : this.prev();
  }

  private moveTo(index: number, transition: CarouselTransition): CarouselCursor {
    return new CarouselCursor(this.count, index, transition);
  }
}
