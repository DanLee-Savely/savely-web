import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { appContent } from "@/content/app.content";
import { PageWindow } from "@/interaction/PageWindow";
import { cn } from "@/lib/utils";

const { list } = appContent;
const pill = "inline-flex h-10 items-center gap-1 rounded-sv-pill px-3.5 sv-text-label-13";
const href = (page: number) => `/app/records?page=${page}`;

// 페이지 나누기: 이전 · 번호(현재 중심 최대 5개) · 다음. 첫 · 마지막 페이지에서 이전 · 다음은 비활성 (§4-1)
export function Pagination({ page, lastPage }: { page: number; lastPage: number }) {
  const w = new PageWindow(page, lastPage);
  const edge = (to: number, enabled: boolean, label: string, icon: ReactNode, iconFirst: boolean) =>
    enabled ? (
      <Link href={href(to)} className={cn(pill, "border border-sv-border-2 bg-sv-surface text-sv-text hover:bg-sv-surface-2")}>
        {iconFirst && icon}
        {label}
        {!iconFirst && icon}
      </Link>
    ) : (
      <span aria-disabled className={cn(pill, "border border-sv-border-2 text-sv-text-3 opacity-60")}>
        {iconFirst && icon}
        {label}
        {!iconFirst && icon}
      </span>
    );
  return (
    <nav aria-label={list.title} className="mt-6 flex items-center justify-center gap-1.5">
      {edge(page - 1, w.hasPrev, list.prev, <ChevronLeft aria-hidden className="size-4" />, true)}
      {w.pages.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "flex size-10 items-center justify-center rounded-full sv-text-label-13",
            n === page ? "bg-sv-text text-sv-surface" : "text-sv-text-2 hover:bg-sv-surface-2",
          )}
        >
          {n}
        </Link>
      ))}
      {edge(page + 1, w.hasNext, list.next, <ChevronRight aria-hidden className="size-4" />, false)}
    </nav>
  );
}
