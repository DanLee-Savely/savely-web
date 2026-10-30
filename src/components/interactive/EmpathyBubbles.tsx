"use client";

import { BreakText } from "@/components/common/BreakText";
import { homeContent } from "@/content/home.content";
import { useStepSequence } from "@/hooks/useStepSequence";
import { cn } from "@/lib/utils";

const { empathy } = homeContent;
// Figma: Step 0 →(0.8초) 1 →(1초) 2 →(1초) 3. 사이트에서는 3에서 멈춘다
const DELAYS = [800, 1000, 1000];
const INDENTS = ["", "pl-6 lg:pl-14", "pl-12 lg:pl-28"]; // 모바일 0/24/48 · PC 0/56/112
const bubbleClass = "rounded-[20px_20px_20px_6px] bg-sv-surface px-[22px] py-4";

// I2 공감 말풍선 — 「입력 중」 뒤에 말풍선이 하나씩 나타나고, 마지막 문장은 끝에 나타난다
export function EmpathyBubbles() {
  const { ref, step } = useStepSequence<HTMLDivElement>(DELAYS);

  return (
    <div ref={ref} className="flex flex-col gap-3 lg:flex-1">
      {empathy.bubbles.map((text, i) => (
        <div key={text} className={cn("relative", INDENTS[i])}>
          <p
            className={cn(
              bubbleClass,
              "w-fit sv-text-body-15 text-sv-text transition duration-350 ease-out motion-reduce:transition-none",
              step > i ? "opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            {text}
          </p>
          <p
            aria-hidden
            className={cn(
              bubbleClass,
              "absolute top-0 whitespace-pre sv-text-label-15 text-sv-text-3 transition-opacity duration-350",
              step === i ? "opacity-100" : "opacity-0",
            )}
          >
            {empathy.typing}
          </p>
        </div>
      ))}
      {/* Figma: gap 12 + 빈 칸 12 + gap 12 = 36. 마지막 말풍선과 함께(3단계) 나타난다 */}
      <p
        className={cn(
          "mt-6 sv-text-title-section-20 text-sv-text transition-opacity duration-350 ease-out motion-reduce:transition-none",
          step === empathy.bubbles.length ? "opacity-100" : "opacity-0",
        )}
      >
        <BreakText text={empathy.closing} />
      </p>
    </div>
  );
}
