"use client";

import { ArrowRightIcon, RotateCwIcon, StarIcon } from "lucide-react";
import { BreakText } from "@/components/common/BreakText";
import { StampDay } from "@/components/common/Stamp";
import { homeContent } from "@/content/home.content";
import { useTimeline } from "@/hooks/useTimeline";
import { RewardTimeline } from "@/interaction/RewardTimeline";
import { cn } from "@/lib/utils";

const { reward, stamps } = homeContent;
const { loop, loopBadge } = reward;
const BADGE_AT = 2; // 「포인트 받고」
const timeline = new RewardTimeline(stamps.month.days);
const fade = "transition-colors duration-300 motion-reduce:transition-none";

// 위로 떠오르는 「+P」(장식)
function FloatP({
  f,
  className,
}: {
  f: { opacity: number; dy: number };
  className: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute sv-text-mono-amount-13 whitespace-nowrap text-sv-accent",
        className,
      )}
      style={{ opacity: f.opacity, transform: `translateY(${f.dy}px)` }}
    >
      {loopBadge}
    </span>
  );
}

// I6 보상 고리 — 화면에 보이는 동안 칩 강조가 0.9 · 0.9 · 1.4 · 0.9초로 순환한다. reduced-motion이면 「포인트 받고」에 고정
// I14 같은 시계로 「+P」가 떠오르고, 카드 1 · 2에 정산 도장이 찍힌다(카드 3은 그대로)
export function RewardLoop() {
  const { ref, t, reducedMotion } = useTimeline<HTMLOListElement>();
  const f = reducedMotion ? timeline.still() : timeline.at(t);

  return (
    <>
      <ol ref={ref} className="flex flex-wrap items-center gap-2">
        {loop.map((label, i) => {
          const on = f.step === i;
          const Icon = i === loop.length - 1 ? RotateCwIcon : ArrowRightIcon;
          return (
            <li key={label} className="contents">
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-sv-pill px-4 py-2.5 sv-text-label-15",
                  fade,
                  on
                    ? "bg-sv-accent text-sv-on-accent"
                    : "bg-sv-surface text-sv-text",
                )}
              >
                {label}
                {i === BADGE_AT && (
                  <span
                    className={cn(
                      "relative sv-text-label-13",
                      fade,
                      on ? "text-sv-on-accent" : "text-sv-accent",
                    )}
                  >
                    {loopBadge}
                    <FloatP f={f.badge} className="-top-4 -left-0.5" />
                  </span>
                )}
              </span>
              <Icon
                aria-hidden
                strokeWidth={1.75}
                className={cn(
                  "size-5",
                  fade,
                  on ? "text-sv-accent" : "text-sv-text-3",
                )}
              />
            </li>
          );
        })}
      </ol>
      <ul className="flex flex-col gap-2.5 lg:flex-row lg:gap-4">
        {reward.cards.map((c, i) => (
          <li
            key={c.title}
            className="flex flex-col gap-2.5 rounded-sv-lg bg-sv-accent-tint p-[22px] lg:flex-1 lg:p-7"
          >
            <h3 className="sv-text-title-section-20 text-sv-accent">
              {c.title}
            </h3>
            <p className="sv-text-body-15 text-sv-text-2">
              <BreakText text={c.desc} />
            </p>
            {i === 0 && (
              <div aria-hidden className="relative mt-auto pt-2">
                <div className="relative h-7 w-[100px] overflow-hidden">
                  {f.strip.map((d, j) => (
                    <span
                      key={j}
                      className="absolute top-0 left-0"
                      style={{ transform: `translateX(${d.x}px)` }}
                    >
                      <StampDay mark={d} className="size-7" />
                    </span>
                  ))}
                </div>
                <FloatP f={f.stripFloat} className="top-0.5 left-[38px]" />
              </div>
            )}
            {i === 1 && (
              <div
                aria-hidden
                className="relative mt-auto pt-2"
                style={{ opacity: f.weekOpacity }}
              >
                <div className="grid grid-cols-[repeat(8,28px)] gap-x-2">
                  {stamps.weekdays.map((d) => (
                    <span
                      key={d}
                      className="text-center sv-text-caption-11 text-sv-text-3"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-[repeat(8,28px)] gap-x-2">
                  {f.week.map((d) => (
                    <StampDay key={d.n} mark={d} className="size-7" />
                  ))}
                  <span
                    className="grid size-7 place-items-center rounded-full bg-sv-accent text-sv-on-accent"
                    style={{
                      opacity: f.star ? 1 : 0,
                      transform: `scale(${f.star})`,
                    }}
                  >
                    <StarIcon strokeWidth={2} className="size-[15px]" />
                  </span>
                </div>
                <FloatP f={f.starFloat} className="top-[22px] left-[256px]" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
