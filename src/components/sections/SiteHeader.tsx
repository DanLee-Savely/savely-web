import { Logo } from "@/components/common/Logo";
import { MobileMenu } from "@/components/interactive/MobileMenu";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { homeContent } from "@/content/home.content";

const { gnb } = homeContent;

// 00 GNB — 스크롤해도 위에 고정, 반투명 배경 + 흐림 (PC 78 · 모바일 70)
export function SiteHeader() {
  return (
    <header
      data-section="00-gnb"
      className="sticky top-0 z-40 border-b border-sv-border bg-sv-gnb-bg px-5 backdrop-blur-(--sv-gnb-blur) lg:border-sv-border-2"
    >
      <div className="mx-auto flex max-w-(--sv-content-max) items-center justify-between py-3 lg:py-4">
        <a href="#">
          <Logo className="h-7 lg:h-9" priority />
        </a>
        <nav aria-label="주요 메뉴" className="hidden lg:block">
          {gnb.menu.map((item) => (
            <a key={item.target} href={item.target} className="sv-text-support-14_5 text-sv-text-2 hover:text-sv-text">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <WaitlistButton source="gnb">{gnb.cta}</WaitlistButton>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
