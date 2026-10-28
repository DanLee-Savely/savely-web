import { WaitlistButton } from "@/components/interactive/WaitlistButton";
import { WaitlistDialogProvider } from "@/components/interactive/WaitlistDialogProvider";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { homeContent } from "@/content/home.content";

export default function Home() {
  return (
    <WaitlistDialogProvider>
      <SiteHeader />
      <main className="flex-1" />
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
