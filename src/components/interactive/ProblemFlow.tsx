"use client";

import {
  ArrowDownIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  RotateCwIcon,
} from "lucide-react";
import { BreakText } from "@/components/common/BreakText";
import { RecordChip } from "@/components/common/Stamp";
import { homeContent } from "@/content/home.content";
import { useTimeline } from "@/hooks/useTimeline";
import { ProblemTimeline } from "@/interaction/ProblemTimeline";
import { cn } from "@/lib/utils";

const { steps, repeat } = homeContent.problem;
const forgotten = homeContent.stamps.records.slice(0, 3);
const timeline = new ProblemTimeline();
// 0~3 = n번째 열 강조(1.35초 간격, 선 · 알약은 흐리게) → 4 = 반복(선 · 알약 강조, 3.75초) → 5 = 최종(전부 보임)에서 멈춘다. 전환 0.5초
const REPEAT = 4;
const FINAL = 5;
const fade = "transition-opacity duration-500 motion-reduce:transition-none";
const tint = "transition-all duration-500 motion-reduce:transition-none";

// I3 문제 흐름(C안, D12) — PC 4열 + 돌아오는 선 + 알약, 모바일은 세로 + 오른쪽 선(정적)
// I12 「잊고」 아래에서 사라지는 기록 카드(PC만, 흐름과 같은 시계)
export function ProblemFlow() {
  const { ref, t, reducedMotion } = useTimeline<HTMLDivElement>({
    until: timeline.flowEnd,
  });
  const step = reducedMotion ? FINAL : timeline.flowStep(t);
  const looping = step === REPEAT;
  const lit = (on: boolean) =>
    step === FINAL || on ? "lg:opacity-100" : "lg:opacity-25";
  const loopDim = step < REPEAT && "lg:opacity-25";

  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-6 lg:gap-0">
      <ol className="relative flex w-full flex-col items-center lg:grid lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex flex-col items-center">
            {i > 0 && (
              <>
                <ArrowDownIcon
                  aria-hidden
                  strokeWidth={1.75}
                  className="my-2.5 size-5 text-sv-text-3 lg:hidden"
                />
                <ArrowRightIcon
                  aria-hidden
                  strokeWidth={1.75}
                  className={cn(
                    "absolute top-[37px] left-0 hidden size-5 -translate-x-1/2 text-sv-text-3 lg:block",
                    fade,
                    lit(step === i || step === i - 1),
                  )}
                />
              </>
            )}
            <div
              className={cn(
                "flex flex-col items-center gap-1 lg:gap-1.5",
                fade,
                lit(step === i),
              )}
            >
              <span
                className={cn(
                  "sv-text-mono-13",
                  i === steps.length - 1 ? "text-sv-text" : "text-sv-text-3",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="sv-text-hero-34 text-sv-text">{s.title}</p>
              <p className="sv-text-support-14_5 text-sv-text-2">
                <BreakText text={s.desc} />
              </p>
            </div>
          </li>
        ))}
        {/* 모바일 돌아오는 선: 4단계 제목 옆 → 오른쪽 → 1단계 제목 옆(r16, 왼쪽 화살촉)
            ponytail: 제목 중심(위 45 · 아래 71)과 제목 옆 시작점(44 · 76)은 Hero/34 · 2줄 설명 · 간격 4 기준 고정값. 글자 크기가 바뀌면 다시 잰다 */}
        <div
          aria-hidden
          className="absolute top-[45px] right-2 bottom-[71px] left-1/2 flex flex-col text-sv-text-3 lg:hidden"
        >
          <div className="relative ml-11 flex-1 rounded-tr-2xl border-t-[1.5px] border-r-[1.5px] border-current">
            <ChevronLeftIcon
              strokeWidth={1.5}
              className="absolute -top-[8.75px] -left-1.5 size-4"
            />
          </div>
          <div className="ml-[76px] flex-1 rounded-br-2xl border-r-[1.5px] border-b-[1.5px] border-current" />
        </div>
      </ol>
      {!reducedMotion && (
        <div aria-hidden className="relative z-10 hidden w-full lg:block">
          <div className="absolute top-1.5 left-[37.5%] flex -translate-x-1/2 gap-2.5">
            {timeline.forget(t, forgotten.length).map((c, k) => (
              <RecordChip
                key={forgotten[k].label}
                record={forgotten[k]}
                style={{
                  opacity: c.opacity,
                  transform: `translateY(${c.dy}px)`,
                  filter: c.blur ? `blur(${c.blur}px)` : undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}
      {/* PC 돌아오는 선: 4열 가운데 아래 → 52px 아래 → 1열 가운데 → 위(r20, 위 화살촉) */}
      <div
        aria-hidden
        className={cn(
          "relative mx-[12.5%] mt-2.5 hidden h-[52px] self-stretch rounded-b-[20px] border-current lg:block",
          tint,
          looping
            ? "border-x-2 border-b-2 text-sv-accent"
            : "border-x-[1.5px] border-b-[1.5px] text-sv-text-3",
          loopDim,
        )}
      >
        <ChevronUpIcon
          strokeWidth={1.5}
          className="absolute -top-1.5 left-0 size-4 -translate-x-1/2"
        />
      </div>
      <p
        className={cn(
          "relative flex w-fit items-center gap-2 rounded-sv-pill bg-sv-surface px-4 py-2 sv-text-label-15 lg:-mt-5 lg:bg-sv-bg lg:px-[18px]",
          tint,
          looping
            ? "text-sv-accent lg:shadow-[inset_0_0_0_100px_var(--sv-accent-tint-2)]"
            : "text-sv-text",
        )}
      >
        <RotateCwIcon
          aria-hidden
          strokeWidth={1.75}
          className={cn("size-5 shrink-0 text-sv-accent", tint, loopDim)}
        />
        <span className={cn(tint, loopDim)}>{repeat}</span>
      </p>
    </div>
  );
}
