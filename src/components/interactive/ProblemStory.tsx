"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTimeline } from "@/hooks/useTimeline";
import { ProblemTimeline } from "@/interaction/ProblemTimeline";
import { ProblemAmount } from "./ProblemAmount";
import { ProblemFlow } from "./ProblemFlow";

const timeline = new ProblemTimeline();

// 03 문제의 두 장면을 순서대로 잇는다(I3 → I12): 쓰고 → 잊고 → 놀라고 → 반복하고 → 돌아오는 선 → 금액.
// 금액 시계는 흐름 시계가 amountStart에 닿은 뒤에 흐른다. 기다리지 않는 경우:
// - 모바일: 흐름이 움직이지 않는 그림이라 기다릴 것이 없다
// - 흐름이 화면에 없을 때: 빠르게 지나쳐 내려온 사람에게 금액이 영영 안 나오면 안 된다
export function ProblemStory() {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { ref: flowRef, t: flowT, inView: flowInView, reducedMotion } = useTimeline<HTMLDivElement>({ until: timeline.flowEnd });
  const waiting = desktop && flowInView && flowT < timeline.amountStart;
  const { ref: amountRef, t: amountT } = useTimeline<HTMLDivElement>({ until: timeline.countEnd, ready: !waiting });

  return (
    <>
      <ProblemFlow ref={flowRef} t={flowT} reducedMotion={reducedMotion} />
      <ProblemAmount ref={amountRef} t={amountT} reducedMotion={reducedMotion} />
    </>
  );
}
