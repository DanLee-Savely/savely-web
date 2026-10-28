import { describe, expect, it } from "vitest";
import { CarouselCursor } from "./CarouselCursor";

describe("CarouselCursor", () => {
  const start = new CarouselCursor(5);

  it("다음 · 이전은 한 칸 슬라이드한다", () => {
    expect(start.next()).toMatchObject({ index: 1, transition: "slide" });
    expect(start.next().next().prev()).toMatchObject({ index: 1, transition: "slide" });
  });

  it("끝에서 순환할 때는 페이드한다 (5→1, 1→5)", () => {
    expect(start.prev()).toMatchObject({ index: 4, transition: "fade" });
    expect(start.goTo(4).next()).toMatchObject({ index: 0, transition: "fade" });
  });

  it("점 이동은 3칸 이상이면 페이드, 아니면 슬라이드한다", () => {
    expect(start.goTo(2)).toMatchObject({ index: 2, transition: "slide" });
    expect(start.goTo(3)).toMatchObject({ index: 3, transition: "fade" });
    expect(start.goTo(1).goTo(3)).toMatchObject({ index: 3, transition: "slide" });
    expect(start.goTo(1).goTo(4)).toMatchObject({ index: 4, transition: "fade" });
  });

  it("화면에서 손을 떼면: 탭은 다음, 스와이프는 방향대로, 짧은 끌기 · 세로 이동은 무시한다", () => {
    expect(start.release(3, 2)).toMatchObject({ index: 1 });
    expect(start.release(-40, 10)).toMatchObject({ index: 1 });
    expect(start.goTo(2).release(60, 0)).toMatchObject({ index: 1 });
    expect(start.release(-30, 0)).toBe(start);
    expect(start.release(-50, 80)).toBe(start);
  });

  it("이동해도 원래 커서는 바뀌지 않는다", () => {
    start.next();
    expect(start.index).toBe(0);
  });

  it("범위를 벗어난 값은 거부한다", () => {
    expect(() => new CarouselCursor(0)).toThrow(RangeError);
    expect(() => start.goTo(5)).toThrow(RangeError);
    expect(() => start.goTo(-1)).toThrow(RangeError);
  });
});
