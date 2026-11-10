import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = { title: string; back?: { href: string; label: string }; eyebrow?: string; actions?: ReactNode };

// /app 화면 머리말: 돌아가기 링크 · 작은 제목 · 제목 · 오른쪽 버튼
export function PageHeader({ title, back, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="mt-7 mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1.5 inline-flex items-center gap-1 sv-text-support-13 text-sv-text-2 hover:text-sv-text">
            <ChevronLeft aria-hidden className="size-4" />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="sv-text-eyebrow-12_5 text-sv-accent">{eyebrow}</p>}
        <h1 className="break-all sv-text-hero-34 text-sv-text">{title}</h1>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}
