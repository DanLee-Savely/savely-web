"use client";

import { InfoIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { BreakText } from "@/components/common/BreakText";
import { StatBar, StatValue, statBox } from "@/components/common/StatBox";
import { homeContent } from "@/content/home.content";
import { cn } from "@/lib/utils";

const { stats, tooltipSource } = homeContent.literacy;

// I4 수치 툴팁 · 막대 — PC는 마우스 hover · 키보드 focus, 모바일은 라벨(ⓘ) 탭으로 열고 바깥 탭 · Esc로 닫는다
export function LiteracyStats() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  const id = useId();

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <ul ref={ref} className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      {stats.map((s, i) => {
        const on = open === i;
        return (
          <li
            key={s.label}
            className={cn(statBox, "relative lg:flex-1")}
            onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(null)}
          >
            <button
              type="button"
              aria-describedby={`${id}-${i}`}
              aria-expanded={on}
              className="flex w-fit items-center gap-1.5 rounded-sm text-left sv-text-label-15 text-sv-text outline-none focus-visible:ring-2 focus-visible:ring-sv-accent"
              onClick={() => setOpen(on ? null : i)}
              onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(i)}
              onBlur={() => setOpen(null)}
            >
              {s.label}
              <InfoIcon
                aria-hidden
                strokeWidth={1.75}
                className={cn("size-3.5 text-sv-text-3 transition-colors duration-200", on && "text-sv-accent")}
              />
            </button>
            <StatValue
              parts={[{ num: s.value, unit: s.unit }]}
              numClassName={cn("transition-colors duration-200", on && "text-sv-accent")}
            />
            <StatBar value={Number(s.value)} avg={s.avg} />
            <p className="sv-text-support-14_5 text-sv-text-2">
              <BreakText text={s.desc} />
            </p>
            <div
              id={`${id}-${i}`}
              role="tooltip"
              className={cn(
                "absolute top-full left-0 z-10 mt-2 flex w-80 flex-col gap-1.5 rounded-[10px] bg-sv-surface-3 px-3.5 py-3 sv-text-support-13 transition duration-200",
                on ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              <p className="text-sv-text">{s.tooltip}</p>
              <p className="text-sv-text-3">{tooltipSource}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
