import Image from "next/image";
import Link from "next/link";
import { logoWordmark } from "@/assets";
import { homeContent } from "@/content/home.content";

const { footer, a11y } = homeContent;

// 99 Footer — PC: 로고 → info(2줄) → 테두리 + © (gap 32) / 모바일: 로고 → 구분선 → info(3줄) → © (gap 20)
// 「개인정보처리방침」 링크는 시안에 없어 info 아래에 추가 (00-decisions C4)
export function SiteFooter() {
  return (
    <footer
      id="footer"
      data-section="99-footer"
      className="border-t border-sv-border bg-sv-page-bg px-5 pt-10 pb-12 lg:border-t-0 lg:py-16"
    >
      <div className="mx-auto flex max-w-(--sv-content-max) flex-col gap-5 sv-text-support-13 text-sv-text-3 lg:gap-8">
        <Image src={logoWordmark} alt={a11y.logo} className="h-5 w-auto self-start" />
        <hr className="border-sv-border lg:hidden" />
        <div className="flex flex-col items-start gap-1.5 lg:gap-1">
          <p>{footer.company}</p>
          <p className="flex flex-col gap-1.5 lg:flex-row lg:gap-0">
            <span>{footer.contact}</span>
            <span aria-hidden className="hidden px-2.5 lg:inline">
              ·
            </span>
            <span>{footer.site}</span>
          </p>
          <Link href={footer.privacyLink.href} className="text-sv-text-2 hover:underline">
            {footer.privacyLink.label}
          </Link>
        </div>
        <p className="lg:border-t lg:border-sv-border-2 lg:pt-6">{footer.copyright}</p>
      </div>
    </footer>
  );
}
