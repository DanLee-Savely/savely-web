// 방문 통계 도구의 ID (90-measurement-search §2-2). 비밀값이 아니다 — 페이지 소스에 그대로 보이는 값이다.
// 비어 있으면 아무것도 불러오지 않고 아무것도 보내지 않는다(Noop). 대표가 값을 주면 여기에만 넣는다.
// ⚠️ 값을 넣는 배포에는 개인정보처리방침 변경(§2-6)이 함께 들어 있어야 한다.
//    배포 전에 할 일은 명세 §2-7 「배포 전 할 일」을 따른다(방침 6번 문장 확정 · 개정일을 배포일로)

/** GA4 측정 ID — 「G-」로 시작한다 */
export const GA4_MEASUREMENT_ID: string = "";
/** 네이버 애널리틱스 발급 ID(wa) */
export const NAVER_ANALYTICS_ID: string = "";
/** 이 주소에서만 스크립트를 넣는다. localhost · 미리보기 주소에서는 보내지 않는다 */
export const ANALYTICS_HOSTNAME = "www.savelyglobal.com";
/** 개발 서버에서 GA4 DebugView로 확인할 때만 주소에 붙인다 — `?sv_ga_debug=1`(개발 빌드에서만 듣는다) */
export const GA_DEBUG_PARAM = "sv_ga_debug";
/** 대표 본인 방문 표시 — `/home?sv_internal=1`로 한 번 들어오면 브라우저에 남기고, 이후 이벤트에 traffic_type=internal을 붙인다 */
export const INTERNAL_PARAM = "sv_internal";
