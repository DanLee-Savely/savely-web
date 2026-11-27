// 대표 본인 방문 표시 (90-measurement-search §2-2-6 · §2-9).
// `/home?sv_internal=1`로 한 번 들어오면 브라우저에 남기고, 그 뒤로 이 브라우저에서는 통계 스크립트를 불러오지 않는다(VisitGate).
// 저장소를 쓸 수 없는 브라우저(쿠키를 모두 막은 경우 등)에서는 조용히 넘어간다 — 표시가 남지 않을 뿐이고, 이 방문은 주소의 표시만으로 뺀다
export class InternalTraffic {
  /** 이 방문의 주소에서 표시를 봤는가 — 저장하지 못해도 이 방문은 본인 방문이다 */
  private seen = false;

  constructor(
    private readonly param: string,
    private readonly storage: () => Pick<Storage, "getItem" | "setItem">,
  ) {}

  /** 주소의 쿼리에 표시가 있으면 브라우저에 남긴다 */
  capture(search: string): void {
    if (new URLSearchParams(search).get(this.param) !== "1") return;
    this.seen = true;
    try {
      this.storage().setItem(this.param, "1");
    } catch {
      // 남기지 못해도 사이트는 그대로 쓴다
    }
  }

  get marked(): boolean {
    if (this.seen) return true;
    try {
      return this.storage().getItem(this.param) === "1";
    } catch {
      return false;
    }
  }
}
