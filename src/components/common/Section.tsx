import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  /** data-section 값 (예: 03-problem) — 시안 비교 스크립트가 쓴다 */
  name: string;
  id?: string;
  /** page = 섹션 교차 배경 (S02 · S04 · S06 · S11) */
  background?: "bg" | "page";
  className?: string;
  children: ReactNode;
};

// 섹션 공통 틀: 배경 · 세로 여백(모바일 56 · PC 96) · 콘텐츠 폭 1120 · 좌우 20
export function Section({ name, id, background = "bg", className, children }: SectionProps) {
  return (
    <section
      id={id}
      data-section={name}
      className={cn(background === "page" ? "bg-sv-page-bg" : "bg-sv-bg", "px-5 py-14 lg:py-24", className)}
    >
      <div className="mx-auto max-w-(--sv-content-max)">{children}</div>
    </section>
  );
}
