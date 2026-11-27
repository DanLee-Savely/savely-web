// 방문 통계 도구의 ID (90-measurement-search §2-2). 비밀값이 아니다 — 페이지 소스에 그대로 보이는 값이다.
// 비어 있으면 그 도구는 불러오지 않고 아무것도 보내지 않는다(Noop). 값은 여기에만 둔다 (대표 전달 2026-11-26).
// 값이 있어도 실서비스 주소에서만 보낸다
// ⚠️ 값을 넣는 배포에는 개인정보처리방침 변경(§2-6)이 함께 들어 있어야 한다.
//    배포 전에 할 일은 명세 §2-7 「배포 전 할 일」을 따른다(개정일을 배포일로)

/**
 * Google 태그 ID — GA4 관리 화면이 준 설치 코드(`gtm.js?id=…`)에 있는 값. 스크립트 주소에 이 값을 쓴다.
 * 비우면 GA4로는 아무것도 보내지 않는다
 */
export const GOOGLE_TAG_ID: string = "GTM-5MBT2278";
/** GA4 측정 ID — 참고용(DebugView · 보고서에서 이 속성을 찾을 때). 코드가 보내는 곳을 정하는 값은 위의 태그 ID다 */
export const GA4_MEASUREMENT_ID: string = "G-2ZNQ5RB05K";
/**
 * 네이버 애널리틱스 발급 ID(wa). 비우면 네이버로는 아무것도 보내지 않는다.
 * ⚠️ 꺼 둔 상태다(대표 결정 2026-11-27) — 네이버 스크립트가 부르는 `nam.veta.naver.com` 요청의 정체를 확인할 때까지.
 *    다시 켤 때는 명세 §2-9 「네이버 애널리틱스를 다시 켤 때」의 값과 방침 문장을 **함께** 되돌린다(config.test.ts가 둘이 어긋나면 실패한다)
 */
export const NAVER_ANALYTICS_ID: string = "";
/** 이 주소에서만 스크립트를 넣는다. localhost · 미리보기 주소에서는 보내지 않는다 */
export const ANALYTICS_HOSTNAME = "www.savelyglobal.com";
/** 개발 서버에서 GA4 DebugView로 확인할 때만 주소에 붙인다 — `?sv_ga_debug=1`(개발 빌드에서만 듣는다) */
export const GA_DEBUG_PARAM = "sv_ga_debug";
/** 대표 본인 방문 표시 — `/home?sv_internal=1`로 한 번 들어오면 브라우저에 남기고, 이후 그 브라우저에서는 통계 스크립트를 불러오지 않는다 */
export const INTERNAL_PARAM = "sv_internal";
