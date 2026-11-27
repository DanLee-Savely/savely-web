export type NaverWindow = { wcs_add?: Record<string, string>; wcs?: unknown; wcs_do?: () => void };

// 네이버 애널리틱스 공통 스크립트 (90-measurement-search §2-1). 방문 · 페이지뷰 · 유입 경로만 본다 — 이벤트는 GA4에만 보낸다.
// 네이버 애널리틱스가 준 설치 코드와 같다(2026-11-26 대조):
//   ① wcslog.js를 불러오고 ② wcs_add["wa"]에 발급 ID를 넣고 ③ window.wcs가 있으면 wcs_do()로 페이지뷰를 보낸다.
//   광고 전환용 설정(wcs.inflow · wcs.trans)은 넣지 않는다 — 검색광고를 할 때만 쓴다(§2-1)
export class NaverAnalyticsScript {
  /** 설치 코드의 주소(`//wcs.pstatic.net/wcslog.js`)를 https로 불러온다 */
  static readonly SRC = "https://wcs.pstatic.net/wcslog.js";

  constructor(
    private readonly accountId: string,
    private readonly window: () => NaverWindow | null,
  ) {}

  /** wcslog.js를 불러온 뒤에 부른다: ID를 넣고 페이지뷰를 보낸다 */
  pageView(): void {
    const w = this.window();
    if (!w?.wcs || !w.wcs_do) return;
    w.wcs_add = { ...w.wcs_add, wa: this.accountId };
    w.wcs_do();
  }
}
