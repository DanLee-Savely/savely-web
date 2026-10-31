"use client";

import { CheckIcon, PieChartIcon } from "lucide-react";
import {
  IconDot,
  RecordChip,
  StampGrid,
  StreakHead,
  floatCard,
  weekdayOf,
} from "@/components/common/Stamp";
import { homeContent } from "@/content/home.content";
import { useTimeline } from "@/hooks/useTimeline";
import { SolutionCardTimeline } from "@/interaction/SolutionCardTimeline";
import { cn } from "@/lib/utils";

const { stamps, solution } = homeContent;
const record = stamps.records[0];
const timeline = new SolutionCardTimeline(record.amount);
const unit = record.amount.replace(/[\d,]/g, "");
const week = [
  ...stamps.weekdays.slice(weekdayOf(20)),
  ...stamps.weekdays.slice(0, weekdayOf(20)),
]; // 20일(화)부터
const parallax =
  "transition-[translate] duration-300 ease-out motion-safe:[translate:calc(var(--tx,0)*24.2px)_calc(var(--ty,0)*17.6px)]";

// I13 해결 단계 카드 (PC) — 단계 목록 아래 빈 곳, 오른쪽 끝 = 휴대폰 왼쪽 + 32 · 세로 중심 = (목록 아래 + 휴대폰 아래) / 2 + 6
// 단계 목록(relative) 기준: top-full부터 (598 - 목록 높이) / 2 높이의 칸 가운데, 목록 오른쪽 + 간격 56 + 32
export function SolutionCard({ step, auto }: { step: number; auto: boolean }) {
  const { ref, t, reducedMotion } = useTimeline<HTMLDivElement>({
    resetKey: step,
    until: 3.5,
  });
  const f = reducedMotion ? timeline.still() : timeline.at(t, auto);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-full -right-22 z-10 flex h-[calc((598px-100%)/2)] translate-y-1.5 items-center justify-end"
    >
      <div
        className={parallax}
        style={{ opacity: f.opacity, transform: `translateY(${f.dy}px)` }}
      >
        {step === 0 && (
          <RecordChip
            record={record}
            className="origin-right scale-[1.08]"
            amount={
              <>
                {f.typed}
                {unit}
                {f.caret && (
                  <span className="ml-px inline-block h-[1.05em] w-[1.5px] bg-sv-accent align-[-2px]" />
                )}
              </>
            }
          >
            <span
              className="grid size-[22px] place-items-center rounded-full bg-sv-accent text-sv-on-accent"
              style={{
                opacity: f.check ? 1 : 0,
                transform: `scale(${f.check})`,
              }}
            >
              <CheckIcon strokeWidth={3} className="size-[13px]" />
            </span>
          </RecordChip>
        )}
        {step === 1 && (
          <div
            className={cn(
              "flex flex-col gap-2.5 rounded-[20px] px-4 pt-3.5 pb-4 shadow-sv-float-lg",
              floatCard,
            )}
          >
            <StreakHead n={f.streak} />
            <StampGrid
              days={f.week}
              weekdays={week}
              dayClass="size-[26px]"
              cols="grid-cols-[repeat(7,26px)] gap-x-1.5"
              rows="gap-y-1.5"
            />
          </div>
        )}
        {step === 2 && (
          <p
            className={cn(
              "flex origin-right scale-[1.08] items-center gap-2.5 rounded-sv-pill py-[7px] pr-3.5 pl-[7px] whitespace-nowrap shadow-sv-float sv-text-support-13 text-sv-text-2",
              floatCard,
            )}
          >
            <IconDot className="size-7">
              <PieChartIcon strokeWidth={2} className="size-4" />
            </IconDot>
            <span>
              {solution.report.before}
              <span
                className="font-bold! text-sv-accent transition-shadow duration-300"
                style={{
                  boxShadow: f.mark
                    ? "inset 0 -0.45em 0 var(--sv-accent-tint-2)"
                    : undefined,
                }}
              >
                {solution.report.em}
              </span>
              {solution.report.after}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
