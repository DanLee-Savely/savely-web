"use client";

import { ArrowRightIcon, RotateCwIcon } from "lucide-react";
import { homeContent } from "@/content/home.content";
import { useStepSequence } from "@/hooks/useStepSequence";
import { cn } from "@/lib/utils";

const { loop, loopBadge } = homeContent.reward;
// Figma: 1 →(0.9초) 2 →(0.9초) 3 →(1.4초) 4 →(0.9초) 1. 포인트 단계에서 조금 더 머문다
const DELAYS = [900, 900, 1400, 900];
const BADGE_AT = 2; // 「포인트 받고」
const fade = "transition-colors duration-300 motion-reduce:transition-none";

// I6 보상 고리 — 화면에 보이는 동안 칩 강조가 순환한다. reduced-motion이면 「포인트 받고」에 고정
export function RewardLoop() {
  const { ref, step } = useStepSequence<HTMLOListElement>(DELAYS, { loop: true, still: BADGE_AT });

  return (
    <ol ref={ref} className="flex flex-wrap items-center gap-2">
      {loop.map((label, i) => {
        const on = step === i;
        const Icon = i === loop.length - 1 ? RotateCwIcon : ArrowRightIcon;
        return (
          <li key={label} className="contents">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-sv-pill px-4 py-2.5 sv-text-label-15",
                fade,
                on ? "bg-sv-accent text-sv-on-accent" : "bg-sv-surface text-sv-text",
              )}
            >
              {label}
              {i === BADGE_AT && (
                <span className={cn("sv-text-label-13", fade, on ? "text-sv-on-accent" : "text-sv-accent")}>
                  {loopBadge}
                </span>
              )}
            </span>
            <Icon
              aria-hidden
              strokeWidth={1.75}
              className={cn("size-5", fade, on ? "text-sv-accent" : "text-sv-text-3")}
            />
          </li>
        );
      })}
    </ol>
  );
}
