// 목록 페이지 번호: 현재 페이지를 가운데 두고 최대 5개 (70-mvp-records §4-1). 끝에 닿으면 반대쪽으로 채운다
export class PageWindow {
  private static readonly SPAN = 5;

  constructor(
    readonly current: number,
    readonly last: number,
  ) {}

  get pages(): number[] {
    const count = Math.min(PageWindow.SPAN, this.last);
    const start = Math.min(Math.max(1, this.current - Math.floor(PageWindow.SPAN / 2)), this.last - count + 1);
    return Array.from({ length: count }, (_, i) => start + i);
  }

  get hasPrev(): boolean {
    return this.current > 1;
  }

  get hasNext(): boolean {
    return this.current < this.last;
  }
}
