import type { Metadata } from "next";
import { HomeFunnelProvider, SectionViewObserver } from "@/components/analytics/HomeFunnelProvider";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { WaitlistDialogProvider } from "@/components/interactive/WaitlistDialogProvider";
import { AssistantSection } from "@/components/sections/AssistantSection";
import { EmpathySection } from "@/components/sections/EmpathySection";
import { HabitSection } from "@/components/sections/HabitSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiteracySection } from "@/components/sections/LiteracySection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { RewardSection } from "@/components/sections/RewardSection";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { WaitlistSection } from "@/components/sections/WaitlistSection";
import { homeContent } from "@/content/home.content";
import { jsonLdText, siteJsonLd } from "@/lib/guideSeo";

export const metadata: Metadata = { alternates: { canonical: "/home" } };

// 검색엔진에 주는 조직 · 사이트 정보 (90-measurement-search §3-2). 소개 페이지에만 넣는다
const { meta, footer } = homeContent;
const origin = `https://${footer.site}`;
const jsonLd = siteJsonLd({ origin, name: meta.organization.name, logo: `${origin}/home/icon.png` }, meta.organization);

export default function Home() {
  return (
    <HomeFunnelProvider>
      <WaitlistDialogProvider>
        <SectionViewObserver />
        <SiteHeader />
        <main className="flex-1">
          <HeroSection />
          <EmpathySection />
          <ProblemSection />
          <LiteracySection />
          <SolutionSection />
          <AssistantSection />
          <RewardSection />
          <HabitSection />
          <WaitlistSection />
        </main>
        <SiteFooter />
        <WaitlistButton
          source="floating"
          size="l"
          className="fixed right-8 bottom-8 z-40 hidden shadow-sv-floating-cta lg:inline-flex"
        >
          {homeContent.floatingCta}
        </WaitlistButton>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />
      </WaitlistDialogProvider>
    </HomeFunnelProvider>
  );
}
