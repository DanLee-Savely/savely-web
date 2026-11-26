import Link from "next/link";
import { Logo } from "./Logo";

// 소개 사이트의 딸린 페이지(개인정보처리방침 · 가이드) 머리: 로고만 두고 누르면 소개 페이지로 간다
export function SiteTopBar() {
  return (
    <header className="border-b border-sv-border bg-sv-bg px-5 py-3 lg:border-sv-border-2 lg:py-4">
      <div className="mx-auto max-w-(--sv-content-max)">
        <Link href="/home" className="inline-block">
          <Logo className="h-7 lg:h-9" />
        </Link>
      </div>
    </header>
  );
}
