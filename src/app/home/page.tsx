import type { Metadata } from "next";
import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { WaitlistDialogProvider } from "@/components/interactive/WaitlistDialogProvider";
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

export const metadata: Metadata = { alternates: { canonical: "/home" } };

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
    </WaitlistDialogProvider>
  );
}
