import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ProblemAmount } from "@/components/interactive/ProblemAmount";
import { ProblemFlow } from "@/components/interactive/ProblemFlow";
import { homeContent } from "@/content/home.content";

const { problem } = homeContent;

// 03 문제(C안, D12) — 가운데 정렬. 머리말 → 흐름(I3 · I12) → 금액(I12). 간격 PC 64 · 모바일 40
export function ProblemSection() {
  return (
    <Section name="03-problem" id={problem.id}>
      <div className="flex flex-col items-center gap-10 text-center lg:gap-16">
        <SectionHeader eyebrow={problem.eyebrow} title={problem.title} desc={problem.desc} />
        <ProblemFlow />
        <ProblemAmount />
      </div>
    </Section>
  );
}
