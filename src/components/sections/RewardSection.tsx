import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { RewardLoop } from "@/components/interactive/RewardLoop";
import { homeContent } from "@/content/home.content";

const { reward } = homeContent;

// 06 습관 보상 — 머리말 → 고리(I6) → 카드 3장. 간격 PC 48 · 모바일 28
export function RewardSection() {
  return (
    <Section name="06-reward" id={reward.id} background="page">
      <div className="flex flex-col gap-7 lg:gap-12">
        <SectionHeader eyebrow={reward.eyebrow} title={reward.title} desc={reward.desc} />
        <RewardLoop />
        <ul className="flex flex-col gap-2.5 lg:flex-row lg:gap-4">
          {reward.cards.map((c) => (
            <li key={c.title} className="flex flex-col gap-2.5 rounded-sv-lg bg-sv-accent-tint p-[22px] lg:flex-1 lg:p-7">
              <h3 className="sv-text-title-section-20 text-sv-accent">{c.title}</h3>
              <p className="sv-text-body-15 text-sv-text-2">
                <BreakText text={c.desc} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
