import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { HeroDeviceCarousel } from "@/components/interactive/HeroDeviceCarousel";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { homeContent } from "@/content/home.content";

const { hero } = homeContent;

// 01 히어로 — PC: 문구(632) · 간격 60 · 휴대폰(428) 가로 배치 / 모바일: 세로 배치, 간격 40
// 가로 배치는 1120을 다 쓰는 xl(1280)부터 — 1024~1279에서는 56px 제목이 꺾이지 않게 세로 배치
export function HeroSection() {
  return (
    <Section name="01-hero" id="hero" className="pt-10 pb-14 lg:pt-24 lg:pb-28">
      <div className="flex flex-col items-center gap-10 xl:flex-row xl:gap-[60px]">
        <div className="flex w-full flex-col items-start gap-6 xl:flex-1">
          <p className="sv-text-eyebrow-12_5 text-sv-accent">{hero.eyebrow}</p>
          <h1 className="text-sv-text">
            <span className="block sv-text-hero-34 lg:hidden">
              <BreakText text={hero.title.mobile} />
            </span>
            <span className="hidden sv-text-hero-web-56 lg:block">
              <BreakText text={hero.title.pc} />
            </span>
          </h1>
          <p className="sv-text-body-15 text-sv-text-2">
            <BreakText text={hero.desc} />
          </p>
          <WaitlistButton source="hero" size="l">
            {hero.cta}
          </WaitlistButton>
          <p className="sv-text-support-13 text-sv-text-3">{hero.note}</p>
        </div>
        <HeroDeviceCarousel />
      </div>
    </Section>
  );
}
