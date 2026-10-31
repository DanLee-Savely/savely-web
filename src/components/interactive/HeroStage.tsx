"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  RecordChip,
  StampGrid,
  StreakHead,
  floatCard,
} from "@/components/common/Stamp";
import { homeContent } from "@/content/home.content";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePointerTilt } from "@/hooks/usePointerTilt";
import { useTimeline } from "@/hooks/useTimeline";
import { HeroStampTimeline } from "@/interaction/HeroStampTimeline";
import { clamp } from "@/interaction/motion";
import { cn } from "@/lib/utils";

const { stamps } = homeContent;
const timeline = new HeroStampTimeline(
  stamps.month.days,
  stamps.records.length,
);
// 휴대폰 중심 기준 위치(PC). 모바일은 × 0.64, 달력은 0.82배 · 기록 카드는 0.88배로 줄인다
const CAL = [-252, 232] as const;
const CAL_MOBILE = [-128, 236] as const;
const SLOTS = [
  [-192, -238],
  [186, 96],
] as const;
const glow = (color: string, alpha: number) =>
  `radial-gradient(closest-side, color-mix(in srgb, var(${color}) ${alpha}%, transparent), transparent)`;
const paused = (active: boolean): CSSProperties => ({
  animationPlayState: active ? "running" : "paused",
});

type Box = { cx: number; cy: number; w: number; sizes: number[] };

// I11 히어로 A안 — 휴대폰(children)을 감싸 마우스 기울기 · 떠 있음을 주고, 뒤에 빛 · 앞에 달력 카드와 기록 카드 2칸을 띄운다
// 위치는 히어로 섹션 기준(섹션이 relative · isolate · overflow-hidden). 좌우는 섹션 안쪽 8px로 제한
export function HeroStage({ children }: { children: ReactNode }) {
  const { ref, t, reducedMotion, active } = useTimeline<HTMLDivElement>();
  const pc = useMediaQuery("(min-width: 64rem)");
  const floats = useRef<(HTMLDivElement | null)[]>([]);
  const [box, setBox] = useState<Box | null>(null);
  usePointerTilt(ref);

  useEffect(() => {
    const el = ref.current!;
    const section = el.closest("section")!;
    const measure = () => {
      const s = section.getBoundingClientRect();
      const p = el.getBoundingClientRect();
      setBox({
        cx: p.left - s.left + p.width / 2,
        cy: p.top - s.top + p.height / 2,
        w: s.width,
        sizes: floats.current.map((f) => f?.offsetWidth ?? 0),
      });
    };
    const observer = new ResizeObserver(measure);
    [section, ...floats.current].forEach((f) => f && observer.observe(f));
    return () => observer.disconnect();
  }, [ref]);

  const f = reducedMotion ? timeline.still() : timeline.at(t);
  const S = pc ? 1 : 0.64;
  const place = (
    i: number,
    [ox, oy]: readonly [number, number],
    scale: number,
    dy = 0,
  ) => {
    if (!box) return "scale(0)";
    const half = (box.sizes[i] * scale) / 2;
    const x = clamp(box.cx + ox * S, 8 + half, box.w - 8 - half);
    return `translate(${x}px, ${box.cy + oy * S + dy}px) translate(-50%, -50%) scale(${scale})`;
  };

  return (
    <>
      <div ref={ref} className="perspective-[1400px]">
        <div
          className="transition-transform duration-300 ease-out motion-safe:animate-[sv-float_3.5s_ease-in-out_infinite_alternate] motion-safe:[transform:rotateY(calc(var(--rx,0)*4.5deg))_rotateX(calc(var(--ry,0)*3.5deg))]"
          style={paused(active)}
        >
          {children}
        </div>
      </div>
      {box && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span
            className="absolute rounded-full motion-safe:animate-[sv-drift_24s_ease-in-out_infinite_alternate]"
            style={{
              ...paused(active),
              left: box.cx - 430 * S,
              top: box.cy - 40 - 430 * S,
              width: 860 * S,
              height: 860 * S,
              background: glow("--sv-accent", 7.5),
            }}
          />
          <span
            className="absolute rounded-full motion-safe:animate-[sv-drift_32s_ease-in-out_infinite_alternate-reverse]"
            style={{
              ...paused(active),
              left: box.cx + (210 - 360) * S,
              top: box.cy - (230 + 360) * S,
              width: 720 * S,
              height: 720 * S,
              background: glow("--sv-glow-gold", 38),
            }}
          />
          <span
            className="absolute top-0 left-0 size-[400px] opacity-[var(--on,0)] transition-[translate,opacity] duration-300 ease-out motion-reduce:hidden"
            style={{
              translate:
                "calc(var(--gx, 0) * 1px - 200px) calc(var(--gy, 0) * 1px - 200px)",
              background: glow("--sv-accent", 7),
            }}
          />
        </div>
      )}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          !box && "invisible",
        )}
      >
        <div
          ref={(el) => {
            floats.current[0] = el;
          }}
          className="absolute top-0 left-0 transition-[translate] duration-300 ease-out motion-safe:[translate:calc(var(--tx,0)*20.8px)_calc(var(--ty,0)*14.4px)]"
          style={{
            transform: place(0, pc ? CAL : CAL_MOBILE, pc ? 1 : 0.82),
            opacity: f.calOpacity,
          }}
        >
          <div
            className={cn(
              "flex w-[244px] flex-col gap-2.5 rounded-[20px] px-4 pt-3.5 pb-4 shadow-sv-float-lg motion-safe:animate-[sv-float_3.9s_ease-in-out_infinite_alternate] [--sv-float:3px]",
              floatCard,
            )}
            style={paused(active)}
          >
            <StreakHead n={f.streak} scale={f.streakScale} />
            <StampGrid
              days={f.days}
              lead={stamps.month.firstWeekday}
              dayClass="size-6"
              cols="grid-cols-[repeat(7,24px)] justify-between"
              rows="gap-y-1.5"
            />
          </div>
        </div>
        {SLOTS.map((pos, slot) => {
          const card = f.cards.find((c) => c.slot === slot);
          return (
            <div
              key={slot}
              ref={(el) => {
                floats.current[slot + 1] = el;
              }}
              className="absolute top-0 left-0 transition-[translate] duration-300 ease-out motion-safe:[translate:calc(var(--tx,0)*28.6px)_calc(var(--ty,0)*19.8px)]"
              style={{
                transform: place(slot + 1, pos, pc ? 1 : 0.88, card?.dy),
                opacity: card?.opacity ?? 0,
              }}
            >
              <RecordChip record={stamps.records[card?.record ?? slot]} />
            </div>
          );
        })}
      </div>
    </>
  );
}
