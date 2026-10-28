"use client";

import { ArrowRightIcon, RotateCwIcon } from "lucide-react";
import { BreakText } from "@/components/common/BreakText";
import { homeContent } from "@/content/home.content";
import { useStepSequence } from "@/hooks/useStepSequence";
import { cn } from "@/lib/utils";

const { steps, repeat } = homeContent.problem;
// Figma: Step 1 → 2 → 3 → 4 → 5 (0.9초 간격). 사이트에서는 5에서 멈춘다
const DELAYS = [900, 900, 900, 900];
const LAST = steps.length; // 5단계(인덱스 4) = 띠 강조

// 모바일 설명은 한 줄 — 마지막 카드만 Figma 줄바꿈을 유지한다 (content 메모)
const descFor = (desc: string, i: number) => ({ pc: desc, mobile: i === steps.length - 1 ? desc : desc.replace("\n", " ") });

// I3 문제 흐름 — 쓰고 → 잊고 → 놀라고 → 반복하고 → 「매달 반복」 띠 순서로 강조 (PC만, 모바일은 정적)
export function ProblemFlow() {
  const { ref, step } = useStepSequence<HTMLDivElement>(DELAYS);

  return (
    <div ref={ref} className="flex flex-col gap-2 lg:gap-4">
      <ol className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        {steps.map((s, i) => (
          <li key={s.title} className="contents">
            {i > 0 && (
              <ArrowRightIcon
                aria-hidden
                strokeWidth={1.75}
                className={cn(
                  "hidden size-5 shrink-0 text-sv-text-3 transition-colors duration-300 lg:block",
                  step >= i && "text-sv-accent",
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-3.5 rounded-[14px] bg-sv-surface px-[18px] py-4 transition-colors duration-300",
                "lg:flex-1 lg:flex-col lg:items-start lg:gap-2 lg:rounded-sv-lg lg:p-6",
                step === i && "lg:bg-sv-accent-tint lg:ring-1 lg:ring-sv-accent lg:ring-inset",
              )}
            >
              <p
                className={cn(
                  "w-[84px] shrink-0 sv-text-title-section-20 text-sv-text transition-colors duration-300 lg:w-auto",
                  step === i && "lg:text-sv-accent",
                )}
              >
                {s.title}
              </p>
              <p className="sv-text-support-14_5 text-sv-text-2">
                <BreakText text={descFor(s.desc, i)} />
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p
        className={cn(
          "flex items-center gap-2.5 rounded-sv-md bg-sv-accent-tint px-5 py-3.5 sv-text-body-15 text-sv-text transition-colors duration-300",
          step === LAST && "lg:bg-sv-accent lg:text-sv-on-accent",
        )}
      >
        <RotateCwIcon
          aria-hidden
          strokeWidth={1.75}
          className={cn("size-5 shrink-0 text-sv-accent transition-colors duration-300", step === LAST && "lg:text-sv-on-accent")}
        />
        {repeat}
      </p>
    </div>
  );
}
