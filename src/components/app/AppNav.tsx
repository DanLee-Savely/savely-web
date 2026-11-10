"use client";

import { ChartPie, Calendar, House, List } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appContent } from "@/content/app.content";
import { cn } from "@/lib/utils";

const { nav } = appContent;
const ITEMS = [
  { href: "/app", label: nav.home, icon: House },
  { href: "/app/records", label: nav.records, icon: List },
  { href: "/app/calendar", label: nav.calendar, icon: Calendar },
  { href: "/app/report", label: nav.report, icon: ChartPie },
];

/** 홈은 /app만, 나머지는 그 경로와 하위 경로(/app/records/… 은 「기록」) */
const isActive = (pathname: string, href: string) => (href === "/app" ? pathname === href : pathname.startsWith(href));

// 왼쪽 메뉴: 홈 · 기록 · 달력 · 리포트 (M3). 현재 경로를 활성 표시
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 lg:flex-col lg:gap-1.5">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sv-md px-3 py-2.5 sv-text-label-15 lg:px-4",
              active ? "bg-sv-accent-tint text-sv-accent" : "text-sv-text-2 hover:bg-sv-surface-2",
            )}
          >
            <Icon aria-hidden className="size-5" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
