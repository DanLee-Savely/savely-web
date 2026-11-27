"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { NO_SCRIPTS } from "@/infrastructure/analytics/AnalyticsLoader";
import { amplitudeAnalytics, analyticsLoader } from "@/infrastructure/container";

const never = () => () => {};

// 방문 통계 스크립트 (90-measurement-search §2-2) — 루트 레이아웃에 한 번 둔다.
// 서버와 첫 그리기에서는 아무것도 넣지 않고, 브라우저에서 주소를 본 뒤(실서비스 주소 + ID가 있을 때)에만 넣는다.
// 첫 화면을 막지 않게 afterInteractive로 늦게 불러온다. ID가 비어 있으면 이 컴포넌트는 아무것도 그리지 않는다
export function AnalyticsScripts() {
  const plan = useSyncExternalStore(never, () => analyticsLoader.plan(), () => NO_SCRIPTS);
  const pathname = usePathname();
  /** 네이버로 마지막에 페이지뷰를 보낸 경로. 스크립트를 불러오기 전에는 null */
  const sentPath = useRef<string | null>(null);

  // 화면 안에서 경로가 바뀌면 네이버로 페이지뷰를 다시 보낸다(GA4는 Google 태그가 스스로 잡는다). 쿼리만 바뀐 것은 세지 않는다
  useEffect(() => {
    if (sentPath.current === null || sentPath.current === pathname) return;
    sentPath.current = pathname;
    analyticsLoader.naverPageView();
  }, [pathname]);

  /** Amplitude로 마지막에 화면 진입을 보낸 경로 */
  const amplitudePath = useRef<string | null>(null);

  // Amplitude로 화면 진입(page_view)을 보낸다 — 처음 들어올 때와 화면 안에서 경로가 바뀔 때 한 번씩. 쿼리만 바뀐 것은 세지 않는다.
  // 보내면 안 되는 방문(실서비스 주소가 아님 · 쿠키를 못 쓰는 브라우저 · 본인 방문)이면 SDK를 불러오지도 않는다
  useEffect(() => {
    if (amplitudePath.current === pathname) return;
    amplitudePath.current = pathname;
    amplitudeAnalytics?.pageView();
  }, [pathname]);

  return (
    <>
      {plan.gtagSrc && <Script id="sv-gtag" src={plan.gtagSrc} strategy="afterInteractive" />}
      {plan.naverSrc && (
        <Script
          id="sv-naver-analytics"
          src={plan.naverSrc}
          strategy="afterInteractive"
          onLoad={() => {
            // 불러오는 동안 화면이 바뀌었을 수 있다 — 지금 주소로 첫 페이지뷰를 보낸다
            sentPath.current = window.location.pathname;
            analyticsLoader.naverPageView();
          }}
        />
      )}
    </>
  );
}
