import type { InternalTraffic } from "./InternalTraffic";

export type VisitGateEnv = {
  /** 지금 주소의 쿼리 */
  search: () => string;
  /** 브라우저가 쿠키를 받는가(`navigator.cookieEnabled`) */
  cookieEnabled: () => boolean;
  /** 사이트 저장소. 쿠키를 모두 막은 브라우저에서는 닿기만 해도 오류가 난다 */
  storage: () => Pick<Storage, "getItem">;
};

/** 저장소에 닿는지만 보려고 읽는 이름. 값은 쓰지 않는다 */
const PROBE_KEY = "sv_probe";

// 이 방문을 통계에 넣어도 되는가 (90-measurement-search §2-9, 대표 결정 2026-11-27).
// 아래 둘 중 하나면 닫힌다 — 닫히면 통계 스크립트를 아예 불러오지 않고 아무것도 보내지 않는다.
//   ① 쿠키나 사이트 저장소를 쓸 수 없는 브라우저 — 방침 6번 「쿠키를 막으면 방문 통계에 포함되지 않아요」를 지킨다
//   ② 본인 방문 표시(`sv_internal`)가 있는 브라우저
export class VisitGate {
  private decided: boolean | null = null;

  constructor(
    private readonly internal: InternalTraffic,
    private readonly env: VisitGateEnv,
  ) {}

  /** 브라우저에서만 부른다. 방문마다 한 번 정한다 — 주소에 본인 방문 표시가 있으면 이때 남긴다 */
  get open(): boolean {
    if (this.decided === null) {
      this.internal.capture(this.env.search());
      this.decided = this.storageUsable() && !this.internal.marked;
    }
    return this.decided;
  }

  private storageUsable(): boolean {
    try {
      if (!this.env.cookieEnabled()) return false;
      this.env.storage().getItem(PROBE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}
