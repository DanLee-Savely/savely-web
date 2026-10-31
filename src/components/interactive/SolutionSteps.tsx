"use client";

import Image from "next/image";
import { useId, useRef } from "react";
import { appScreens, screenAlt } from "@/assets";
import { homeContent } from "@/content/home.content";
import { usePointerTilt } from "@/hooks/usePointerTilt";
import { useStepSequence } from "@/hooks/useStepSequence";
import { cn } from "@/lib/utils";
import { SolutionCard } from "./SolutionCard";

const { steps } = homeContent.solution;
const DELAYS = steps.map(() => 3500); // 3.5초마다 다음 단계, 3 → 1 순환

// I5 해결 스텝 (PC) — 자동 전환, 단계를 클릭하면 그 단계로 가서 자동 전환을 멈춘다
// I13 단계 카드 · 휴대폰 마우스 기울기(최대 4° · 3°) · 위아래 3px 떠 있음
export function SolutionSteps() {
  const { ref, step, stopped, active, select } =
    useStepSequence<HTMLDivElement>(DELAYS, { loop: true, still: 0 });
  const phone = useRef<HTMLDivElement>(null);
  const id = useId();
  usePointerTilt(phone);

  return (
    <div ref={ref} className="hidden items-center gap-14 lg:flex">
      <div role="tablist" className="relative flex flex-1 flex-col gap-3">
        {steps.map((s, i) => {
          const on = step === i;
          return (
            <button
              key={s.no}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              onClick={() => select(i)}
              className={cn(
                "flex items-baseline gap-4 rounded-sv-lg border px-6 py-[22px] text-left transition-colors duration-400 outline-none focus-visible:ring-2 focus-visible:ring-sv-accent",
                on ? "border-sv-accent bg-sv-accent-tint" : "border-sv-border",
              )}
            >
              <span
                className={cn(
                  "sv-text-mono-15",
                  on ? "text-sv-accent" : "text-sv-text-3",
                )}
              >
                {s.no}
              </span>
              <span className="flex flex-col gap-1.5">
                <span
                  className={cn(
                    "sv-text-title-section-20",
                    on ? "text-sv-text" : "text-sv-text-2",
                  )}
                >
                  {s.title}
                </span>
                <span
                  className={cn(
                    "sv-text-support-14_5",
                    on ? "text-sv-text-2" : "text-sv-text-3",
                  )}
                >
                  {s.desc}
                </span>
              </span>
            </button>
          );
        })}
        <SolutionCard step={step} auto={!stopped} />
      </div>
      <div ref={phone} className="shrink-0 perspective-[1400px]">
        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${step}`}
          style={{ animationPlayState: active ? "running" : "paused" }}
          className="h-[598px] w-[280px] rounded-[44px] bg-sv-surface-3 p-2.5 shadow-sv-phone transition-transform duration-300 ease-out [--sv-float:3px] motion-safe:animate-[sv-float_3.5s_ease-in-out_infinite_alternate] motion-safe:[transform:rotateY(calc(var(--rx,0)*4deg))_rotateX(calc(var(--ry,0)*3deg))]"
        >
          <div className="relative size-full overflow-hidden rounded-[36px]">
            {steps.map((s, i) => (
              <Image
                key={s.image}
                src={appScreens[s.image]}
                alt={screenAlt(s.image)}
                aria-hidden={step !== i}
                sizes="260px"
                className={cn(
                  "absolute inset-0 size-full object-cover object-top transition-opacity duration-400 motion-reduce:transition-none",
                  step === i ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
