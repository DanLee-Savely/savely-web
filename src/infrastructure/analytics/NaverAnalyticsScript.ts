export type NaverWindow = { wcs_add?: Record<string, string>; wcs?: unknown; wcs_do?: () => void };

// 네이버 애널리틱스 공통 스크립트 (90-measurement-search §2-1). 방문 · 페이지뷰 · 유입 경로만 본다 — 이벤트는 GA4에만 보낸다.
// 네이버 공식 가이드(naver.github.io/conversion-tracking, 2026-11-26 확인)의 공통 부분을 따른다:
//   ① wcslog.js를 불러오고 ② wcs_add["wa"]에 발급 ID를 넣고 ③ wcs_do()로 페이지뷰를 보낸다.
//   광고 전환용 설정(wcs.inflow · wcs.trans)은 넣지 않는다 — 검색광고를 할 때만 쓴다(§2-1).
// ⚠️ ID를 받으면 analytics.naver.com의 「스크립트 복사」로 받은 코드와 한 번 대조한다
// ⚠️ 화면 안 이동(/app)이 집계되는지는 설치 뒤 「실시간 분석」으로 확인한다(§2-2-7). 안 잡히면 경로가 바뀔 때 pageView()를 다시 부른다
export class NaverAnalyticsScript {
  static readonly SRC = "//wcs.naver.net/wcslog.js";

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
