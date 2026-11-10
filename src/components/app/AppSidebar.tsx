import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { appContent } from "@/content/app.content";
import { AppNav } from "./AppNav";

// 왼쪽 메뉴 틀: 로고 · 메뉴(홈 · 기록 · 달력 · 리포트, M3) · 아래 「세이블리 웹 체험판」. 좁은 화면에서는 위쪽 막대
export function AppSidebar() {
  return (
    <aside className="flex items-center justify-between gap-4 border-b border-sv-border-2 bg-sv-surface px-5 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-62 lg:shrink-0 lg:flex-col lg:items-stretch lg:justify-start lg:gap-14 lg:border-r lg:border-b-0 lg:py-8">
      <Link href="/app" className="lg:px-2">
        <Logo className="h-7 lg:h-9" />
      </Link>
      <AppNav />
      <p className="mt-auto hidden sv-text-support-13 text-sv-text-3 lg:block">{appContent.nav.footer}</p>
    </aside>
  );
}
