import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { homeContent } from "@/content/home.content";

const { waitlistSection } = homeContent;

// 11 출시 알림 신청 (마지막 CTA) — 가운데 정렬, 간격 20, 세로 여백 PC 112 · 모바일 72
export function WaitlistSection() {
  return (
    <Section name="11-waitlist" id={waitlistSection.id} background="page" className="py-[72px] lg:py-28">
      <div className="flex flex-col items-center gap-5 text-center">
        <h2 className="text-sv-text">
          <span className="block sv-text-hero-34 lg:hidden">
            <BreakText text={waitlistSection.title.mobile} />
          </span>
          <span className="hidden sv-text-hero-web-56 lg:block">
            <BreakText text={waitlistSection.title.pc} />
          </span>
        </h2>
        <p className="sv-text-body-15 text-sv-text-2">
          <BreakText text={waitlistSection.desc} />
        </p>
        <WaitlistButton source="final-cta" size="l">
          {waitlistSection.cta}
        </WaitlistButton>
      </div>
    </Section>
  );
}
