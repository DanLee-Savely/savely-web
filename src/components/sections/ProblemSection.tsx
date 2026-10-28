import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ProblemFlow } from "@/components/interactive/ProblemFlow";
import { homeContent } from "@/content/home.content";
import { cn } from "@/lib/utils";

const { problem } = homeContent;
const { example } = problem;

// 03 문제 — 머리말 → 흐름(I3) → 예시 계산 카드. 간격 PC 48 · 모바일 28
export function ProblemSection() {
  return (
    <Section name="03-problem" id={problem.id}>
      <div className="flex flex-col gap-7 lg:gap-12">
        <SectionHeader eyebrow={problem.eyebrow} title={problem.title} desc={problem.desc} />
        <ProblemFlow />
        <div className="flex flex-col gap-4 rounded-sv-lg bg-sv-surface px-5 py-6 lg:px-8 lg:py-7">
          <p className="sv-text-eyebrow-12_5 text-sv-accent">{example.label}</p>
          <ol className="flex flex-col items-start gap-1.5 lg:flex-row lg:items-center lg:gap-5">
            {example.items.map((item, i) => (
              <li key={item.label} className="contents">
                {i > 0 && (
                  <span aria-hidden className="flex h-6 items-center text-sv-text-3">
                    <ArrowDownIcon strokeWidth={1.75} className="size-5 lg:hidden" />
                    <ArrowRightIcon strokeWidth={1.75} className="hidden size-5 lg:block" />
                  </span>
                )}
                <div className="flex flex-col gap-1">
                  <span className="sv-text-support-13 text-sv-text-3">{item.label}</span>
                  <span
                    className={cn(
                      "emphasis" in item ? "sv-text-amount-40 text-sv-accent" : "sv-text-title-section-20 text-sv-text",
                    )}
                  >
                    {item.value}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <p className="sv-text-support-13 text-sv-text-3">{example.note}</p>
        </div>
      </div>
    </Section>
  );
}
