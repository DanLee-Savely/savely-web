import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { RewardLoop } from "@/components/interactive/RewardLoop";
import { homeContent } from "@/content/home.content";

const { reward } = homeContent;

// 06 습관 보상 — 머리말 → 고리(I6) → 카드 3장(I14, 고리와 같은 시계라 RewardLoop가 함께 그린다). 간격 PC 48 · 모바일 28
export function RewardSection() {
  return (
    <Section name="06-reward" id={reward.id} background="page">
      <div className="flex flex-col gap-7 lg:gap-12">
        <SectionHeader eyebrow={reward.eyebrow} title={reward.title} desc={reward.desc} />
        <RewardLoop />
      </div>
    </Section>
  );
}
