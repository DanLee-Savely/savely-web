"use client";

import { ArrowRightIcon } from "lucide-react";
import { Fragment, type Ref } from "react";
import { homeContent } from "@/content/home.content";
import { ProblemTimeline } from "@/interaction/ProblemTimeline";
import { cn } from "@/lib/utils";

const { example } = homeContent.problem;
const total = example.items[example.items.length - 1];
const TOTAL = Number(total.value.replace(/\D/g, ""));
const timeline = new ProblemTimeline();

// 03 금액 블록 + I12 금액 카운트 — 「하루 → 한 달 → 1년」 강조 후 0 → 1,825,000원
// 시계(t)는 ProblemStory가 흘려보낸다: PC에서는 흐름이 돌아오는 선까지 보여 준 뒤에 시작한다.
// 차례가 오기 전(t = 0)에는 PC에서 아직 강조되지 않은 흐름 단계처럼 흐리게 둔다
// 스크린리더는 처음부터 최종값만 읽는다(sr-only), 움직이는 숫자는 aria-hidden
export function ProblemAmount({ ref, t, reducedMotion }: { ref: Ref<HTMLDivElement>; t: number; reducedMotion: boolean }) {
  const f = reducedMotion
    ? timeline.stillAmount(TOTAL)
    : timeline.amount(t, TOTAL);

  // 「하루 5,000원 → 한 달 150,000원 → 1년」 — example.items를 이어 만들고, 마지막 값은 아래 큰 숫자로 뺀다
  const calc = example.items.map((item, i) => (
    <Fragment key={item.label}>
      {i > 0 && (
        <ArrowRightIcon
          aria-hidden
          strokeWidth={1.75}
          className="size-[1em] shrink-0"
        />
      )}
      <span
        className={cn(
          "transition-colors duration-200 motion-reduce:transition-none",
          f.lit[i] && "text-sv-accent",
        )}
      >
        {item === total ? item.label : `${item.label} ${item.value}`}
      </span>
    </Fragment>
  ));

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-2 transition-opacity duration-500 motion-reduce:transition-none lg:gap-2.5",
        !reducedMotion && t === 0 && "lg:opacity-25",
      )}
    >
      <p className="sv-text-label-15 text-sv-text-2">{example.label}</p>
      <p className="text-sv-text-3">
        <span className="flex items-center gap-1.5 sv-text-body-15 lg:hidden">
          {calc}
        </span>
        <span className="hidden items-center gap-2 sv-text-title-section-20 lg:flex">
          {calc}
        </span>
      </p>
      <p className="sv-text-amount-display text-sv-risk">
        <span className="sr-only">{total.value}</span>
        <span
          aria-hidden
          className="inline-block"
          style={{
            opacity: f.opacity,
            transform: f.scale === 1 ? undefined : `scale(${f.scale})`,
          }}
        >
          {f.value.toLocaleString("ko-KR")}원
        </span>
      </p>
      <p className="sv-text-support-13 text-sv-text-3">{example.note}</p>
    </div>
  );
}
