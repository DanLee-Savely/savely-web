import Image from "next/image";
import { logoLockup } from "@/assets";
import { AppButton } from "@/components/common/AppButton";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { homeContent } from "@/content/home.content";

// 기반 확인용 임시 페이지 — 섹션 구현 때 교체한다
export default function Home() {
  const { problem, literacy } = homeContent;
  return (
    <main>
      <Section name="00-sample" background="page">
        <div className="flex flex-col gap-8">
          <Image src={logoLockup} alt="세이블리" width={136} height={36} priority />
          <SectionHeader eyebrow={problem.eyebrow} title={problem.title} desc={problem.desc} />
          <div className="flex flex-wrap items-center gap-3">
            <AppButton>{homeContent.gnb.cta}</AppButton>
            <AppButton size="l">{homeContent.hero.cta}</AppButton>
            <AppButton size="l" variant="secondary">
              {homeContent.waitlistDialog.doneConfirm}
            </AppButton>
            <AppButton size="l" disabled>
              {homeContent.waitlistDialog.submit}
            </AppButton>
          </div>
          <p className="flex items-baseline gap-1">
            <span className="sv-text-amount-44 text-sv-text">{literacy.stats[0].value}</span>
            <span className="sv-text-title-section-20 text-sv-text-2">{literacy.stats[0].unit}</span>
          </p>
          <p className="sv-text-amount-40 text-sv-accent">{problem.example.items[2].value}</p>
        </div>
      </Section>
    </main>
  );
}
