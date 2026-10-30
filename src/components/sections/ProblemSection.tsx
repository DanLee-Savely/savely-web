import { ArrowRightIcon } from "lucide-react";
import { Fragment } from "react";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ProblemFlow } from "@/components/interactive/ProblemFlow";
import { homeContent } from "@/content/home.content";

const { problem } = homeContent;
const { example } = problem;
const total = example.items[example.items.length - 1];

// 「하루 5,000원 → 한 달 150,000원 → 1년」 — example.items를 이어 만들고, 마지막 값은 아래 큰 숫자로 뺀다
const calc = (
  <>
    {example.items.map((item, i) => (
      <Fragment key={item.label}>
        {i > 0 && <ArrowRightIcon aria-hidden strokeWidth={1.75} className="size-[1em] shrink-0" />}
        {item === total ? item.label : `${item.label} ${item.value}`}
      </Fragment>
    ))}
  </>
);

// 03 문제(C안, D12) — 가운데 정렬. 머리말 → 흐름(I3) → 금액. 간격 PC 64 · 모바일 40
export function ProblemSection() {
  return (
    <Section name="03-problem" id={problem.id}>
      <div className="flex flex-col items-center gap-10 text-center lg:gap-16">
        <SectionHeader eyebrow={problem.eyebrow} title={problem.title} desc={problem.desc} />
        <ProblemFlow />
        <div className="flex flex-col items-center gap-2 lg:gap-2.5">
          <p className="sv-text-label-15 text-sv-text-2">{example.label}</p>
          <p className="text-sv-text-3">
            <span className="flex items-center gap-1.5 sv-text-body-15 lg:hidden">{calc}</span>
            <span className="hidden items-center gap-2 sv-text-title-section-20 lg:flex">{calc}</span>
          </p>
          <p className="sv-text-amount-display text-sv-risk">{total.value}</p>
          <p className="sv-text-support-13 text-sv-text-3">{example.note}</p>
        </div>
      </div>
    </Section>
  );
}
