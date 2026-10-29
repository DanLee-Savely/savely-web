"use client";

import { ArrowRightIcon } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { BreakText } from "@/components/common/BreakText";
import { homeContent } from "@/content/home.content";
import { cn } from "@/lib/utils";

const { habit } = homeContent;
const MODES = ["before", "after"] as const;

// I7 습관 전후 토글 — 선택 배경이 미끄러지고(0.35초) 카드 문구 · 색이 페이드로 바뀐다. ←/→로 이동
export function HabitToggle() {
  const [mode, setMode] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const thumb = useRef<HTMLSpanElement>(null);
  const id = useId();
  const after = mode === 1;

  // 칸 폭이 글자에 따라 달라서(PC 147/189) 선택 배경의 위치 · 폭을 실제 칸에 맞춘다
  useLayoutEffect(() => {
    const place = () => {
      const tab = tabs.current[mode];
      if (!tab || !thumb.current) return;
      thumb.current.style.left = `${tab.offsetLeft}px`;
      thumb.current.style.width = `${tab.offsetWidth}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(tabs.current[mode]!.parentElement!);
    return () => observer.disconnect();
  }, [mode]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? 1 : 0;
    setMode(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-3.5 lg:gap-5">
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="relative flex gap-1 rounded-sv-pill bg-sv-surface p-1 lg:w-fit"
      >
        <span
          aria-hidden
          ref={thumb}
          className="absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-sv-pill bg-sv-accent transition-[left,width] duration-350 ease-out motion-reduce:transition-none lg:w-[147px]"
        />
        {MODES.map((m, i) => (
          <button
            key={m}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-${m}`}
            aria-selected={mode === i}
            aria-controls={`${id}-panel`}
            tabIndex={mode === i ? 0 : -1}
            onClick={() => setMode(i)}
            className={cn(
              "relative flex-1 rounded-sv-pill px-3 py-2.5 sv-text-label-15 transition-colors duration-350 outline-none focus-visible:ring-2 focus-visible:ring-sv-accent focus-visible:ring-offset-2 lg:flex-none lg:px-5",
              mode === i ? "text-sv-on-accent" : "text-sv-text-2",
            )}
          >
            {habit[m].label}
          </button>
        ))}
      </div>
      <ol
        key={mode}
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${MODES[mode]}`}
        className="flex animate-in flex-col gap-2 duration-350 fade-in motion-reduce:animate-none lg:flex-row lg:items-center lg:gap-3"
      >
        {habit[MODES[mode]].steps.map((s, i) => (
          <li key={s.title} className="contents">
            {i > 0 && (
              <ArrowRightIcon
                aria-hidden
                strokeWidth={1.75}
                className={cn("hidden size-5 shrink-0 lg:block", after ? "text-sv-accent" : "text-sv-text-3")}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-3.5 rounded-[14px] px-[18px] py-4 lg:flex-1 lg:flex-col lg:items-start lg:gap-2 lg:rounded-sv-lg lg:p-6",
                after ? "bg-sv-accent-tint" : "bg-sv-surface",
              )}
            >
              <p
                className={cn(
                  "w-[92px] shrink-0 sv-text-title-section-20 lg:w-auto",
                  after ? "text-sv-accent" : "text-sv-text-2",
                )}
              >
                {s.title}
              </p>
              <p className={cn("sv-text-support-14_5", after ? "text-sv-text-2" : "text-sv-text-3")}>
                <BreakText text={s.desc} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
