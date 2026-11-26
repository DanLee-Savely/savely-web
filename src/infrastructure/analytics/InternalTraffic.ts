// 대표 본인 방문 표시 (90-measurement-search §2-2-6).
// `/home?sv_internal=1`로 한 번 들어오면 브라우저에 남기고, 그 뒤로는 이 브라우저의 이벤트에 traffic_type=internal이 붙는다.
// 저장소를 쓸 수 없는 브라우저(쿠키를 모두 막은 경우 등)에서는 조용히 넘어간다 — 표시가 남지 않을 뿐이다
export class InternalTraffic {
  constructor(
    private readonly param: string,
    private readonly storage: () => Pick<Storage, "getItem" | "setItem">,
  ) {}

  /** 주소의 쿼리에 표시가 있으면 브라우저에 남긴다 */
  capture(search: string): void {
    if (new URLSearchParams(search).get(this.param) !== "1") return;
    try {
      this.storage().setItem(this.param, "1");
    } catch {
      // 남기지 못해도 사이트는 그대로 쓴다
    }
  }

  get marked(): boolean {
    try {
      return this.storage().getItem(this.param) === "1";
    } catch {
      return false;
    }
  }
}
