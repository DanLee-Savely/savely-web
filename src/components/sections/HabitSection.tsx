import { RotateCwIcon } from "lucide-react";
import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { SectionHeader } from "@/components/common/SectionHeader";
import { HabitToggle } from "@/components/interactive/HabitToggle";
import { homeContent } from "@/content/home.content";

const { habit } = homeContent;

// 07 습관이 되면 — 머리말 → 전후 토글(I7) · 달력(I15) → 반복 띠. 간격 PC 48 · 모바일 28. relative = PC 달력 위치 기준
export function HabitSection() {
  return (
    <Section name="07-habit" id={habit.id}>
      <div className="relative flex flex-col gap-7 lg:gap-12">
        <SectionHeader eyebrow={habit.eyebrow} title={habit.title} desc={habit.desc} />
        <HabitToggle />
        <p className="flex items-center gap-2.5 rounded-sv-md bg-sv-surface px-5 py-3.5 sv-text-body-15 text-sv-text">
          <RotateCwIcon aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-sv-accent" />
          <span>
            <BreakText text={habit.repeat} />
          </span>
        </p>
      </div>
    </Section>
  );
}
