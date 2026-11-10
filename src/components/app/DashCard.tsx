import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashCardProps = {
  title: ReactNode;
  /** 제목 옆 회색 알약(예: 「기록 3건」) */
  chip?: ReactNode;
  link?: { href: string; label: string };
  /** 오른쪽 위 보조 내용(링크 대신) */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

// 홈 · 달력 · 리포트 카드 틀: 제목 · 알약 · 오른쪽 링크
export function DashCard({ title, chip, link, aside, className, children }: DashCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 sv-text-label-15 text-sv-text">
          {title}
          {chip && <Chip>{chip}</Chip>}
        </h2>
        {link && (
          <Link href={link.href} className="inline-flex items-center sv-text-support-13 text-sv-text-2 hover:text-sv-text">
            {link.label}
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        )}
        {aside}
      </header>
      {children}
    </section>
  );
}

/** 회색 알약 */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("rounded-sv-pill bg-sv-surface-2 px-2.5 py-1 sv-text-label-13 text-sv-text-2", className)}>{children}</span>;
}
