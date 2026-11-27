"use client";

import Link from "next/link";
import { type ComponentProps, createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { DemoPlacement } from "@/application/analytics/AnalyticsPort";
import type { HomeFunnel } from "@/application/analytics/HomeFunnel";
import { createHomeFunnel } from "@/infrastructure/container";

const HomeFunnelContext = createContext<HomeFunnel | null>(null);

// 소개 사이트 한 페이지의 측정 흐름을 그 페이지의 버튼 · 신청 창이 함께 쓴다 (90-measurement-search §2-3).
// 페이지마다 새로 만들므로 「섹션별 1회」 · 「마지막으로 본 섹션」은 페이지를 다시 열면 처음부터 센다.
// [guideSlug]: 가이드 글 화면이면 그 글 — 그 화면의 신청 · 체험판 이벤트에 함께 실린다(91-content §4-6)
export function HomeFunnelProvider({ guideSlug = null, children }: { guideSlug?: string | null; children: ReactNode }) {
  const [funnel] = useState(() => createHomeFunnel(guideSlug));
  return <HomeFunnelContext value={funnel}>{children}</HomeFunnelContext>;
}

/** 공급자 밖(측정하지 않는 화면)에서는 null */
export function useHomeFunnel(): HomeFunnel | null {
  return useContext(HomeFunnelContext);
}

/** 절반 이상 보였는가: 섹션의 절반이 화면에 들어왔거나, 화면의 절반을 그 섹션이 채웠을 때(화면보다 훨씬 긴 섹션은 앞의 조건을 영영 채우지 못한다) */
const halfSeen = (entry: IntersectionObserverEntry): boolean =>
  entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= (entry.rootBounds?.height ?? Infinity) * 0.5);
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

// 화면의 섹션(main 안의 id가 있는 section)을 지켜보다가 절반 이상 보이면 흐름에 알린다 → section_view · last_section
export function SectionViewObserver() {
  const funnel = useHomeFunnel();
  useEffect(() => {
    if (!funnel) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => halfSeen(entry) && funnel.sectionSeen(entry.target.id)), { threshold: THRESHOLDS });
    document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [funnel]);
  return null;
}

// 체험판으로 가는 링크 — 누르면 demo_click을 보낸다. 사이트 안 링크라 UTM은 붙이지 않는다
export function DemoLink({ placement, onClick, ...props }: ComponentProps<typeof Link> & { placement: DemoPlacement }) {
  const funnel = useHomeFunnel();
  return (
    <Link
      {...props}
      onClick={(e) => {
        funnel?.demoClicked(placement);
        onClick?.(e);
      }}
    />
  );
}
