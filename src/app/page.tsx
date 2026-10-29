import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { WaitlistDialogProvider } from "@/components/interactive/WaitlistDialogProvider";
import { EmpathySection } from "@/components/sections/EmpathySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { LiteracySection } from "@/components/sections/LiteracySection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { homeContent } from "@/content/home.content";

export default function Home() {
  return (
    <WaitlistDialogProvider>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <EmpathySection />
        <ProblemSection />
        <LiteracySection />
        <SolutionSection />
      </main>
      <WaitlistButton
        source="floating"
        size="l"
        className="fixed right-8 bottom-8 z-40 hidden shadow-sv-floating-cta lg:inline-flex"
      >
        {homeContent.floatingCta}
      </WaitlistButton>
    </WaitlistDialogProvider>
  );
}
