import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { EmpathyBubbles } from "@/components/interactive/EmpathyBubbles";
import { homeContent } from "@/content/home.content";

const { empathy } = homeContent;

// 02 공감 — PC: 머리말(400) · 간격 64 · 대화(656) 가로 배치 / 모바일: 세로 배치, 간격 32
export function EmpathySection() {
  return (
    <Section name="02-empathy" id={empathy.id} background="page">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
        <div className="lg:w-[400px] lg:shrink-0">
          <SectionHeader eyebrow={empathy.eyebrow} title={empathy.title} />
        </div>
        <EmpathyBubbles />
      </div>
    </Section>
  );
}
