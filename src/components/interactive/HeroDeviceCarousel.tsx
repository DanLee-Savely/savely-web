"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { appScreens } from "@/assets";
import { homeContent } from "@/content/home.content";
import { CarouselCursor } from "@/interaction/CarouselCursor";
import { HeroStage } from "./HeroStage";
import { cn } from "@/lib/utils";

const { screens } = homeContent.hero.device;
const { a11y } = homeContent;

// CarouselCursor를 화면에 연결하는 얇은 어댑터. 페이드 이동마다 fadeKey를 바꿔 애니메이션을 다시 시작한다
function useCarouselCursor(count: number) {
  const [cursor, setCursor] = useState(() => new CarouselCursor(count));
  const [fadeKey, setFadeKey] = useState(0);
  const move = (to: (c: CarouselCursor) => CarouselCursor) => {
    const moved = to(cursor);
    if (moved === cursor) return;
    setCursor(moved);
    if (moved.transition === "fade") setFadeKey((k) => k + 1);
  };
  return { cursor, fadeKey, move };
}

const arrowClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full border border-sv-border bg-sv-surface text-sv-text lg:size-10";

// I1 히어로 앱 화면 캐러셀 — 자동 넘김 없음 (00-decisions D4)
export function HeroDeviceCarousel() {
  const { cursor, fadeKey, move } = useCarouselCursor(screens.length);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    move((c) => (e.key === "ArrowLeft" ? c.prev() : c.next()));
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={a11y.heroCarousel}
      onKeyDown={onKeyDown}
      className="flex shrink-0 flex-col items-center gap-3 lg:gap-4"
    >
      <div className="flex items-center gap-3 lg:gap-5">
        <button
          type="button"
          aria-label={a11y.prevScreen}
          onClick={() => move((c) => c.prev())}
          className={arrowClass}
        >
          <ChevronLeftIcon className="size-6" />
        </button>
        <HeroStage>
          <div className="h-[465px] w-[217px] rounded-[33.85px] bg-sv-surface-3 p-[7.05px] shadow-sv-phone lg:h-[660px] lg:w-[308px] lg:rounded-[48px] lg:p-2.5">
            <div
              className="size-full cursor-pointer touch-pan-y overflow-hidden rounded-[26.8px] select-none lg:rounded-[38px]"
              onPointerDown={(e) => {
                pointerStart.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                const start = pointerStart.current;
                pointerStart.current = null;
                if (start)
                  move((c) =>
                    c.release(e.clientX - start.x, e.clientY - start.y),
                  );
              }}
            >
              <div
                key={fadeKey}
                className={cn(
                  "size-full",
                  cursor.transition === "fade" &&
                    "animate-in duration-300 fade-in motion-reduce:animate-none",
                )}
              >
                <div
                  className={cn(
                    "flex h-full",
                    cursor.transition === "slide" &&
                      "transition-transform duration-450 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none",
                  )}
                  style={{ transform: `translateX(-${cursor.index * 100}%)` }}
                >
                  {screens.map((screen, i) => (
                    <Image
                      key={screen.image}
                      src={appScreens[screen.image]}
                      alt={screen.alt}
                      aria-hidden={i !== cursor.index}
                      priority={i === 0}
                      sizes="(min-width: 1024px) 288px, 203px"
                      draggable={false}
                      className="size-full shrink-0 object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </HeroStage>
        <button
          type="button"
          aria-label={a11y.nextScreen}
          onClick={() => move((c) => c.next())}
          className={arrowClass}
        >
          <ChevronRightIcon className="size-6" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p aria-live="polite" className="sv-text-support-13 text-sv-text-2">
          {screens[cursor.index].label}
        </p>
        <div className="flex items-center gap-1.5">
          {screens.map((screen, i) => (
            <button
              key={screen.image}
              type="button"
              aria-label={a11y.screenDot
                .replace("{n}", String(i + 1))
                .replace("{label}", screen.label)}
              aria-current={i === cursor.index}
              onClick={() => move((c) => c.goTo(i))}
              className={cn(
                "relative h-1.5 rounded-[3px] transition-all after:absolute after:-inset-2 motion-reduce:transition-none",
                i === cursor.index
                  ? "w-4 bg-sv-accent lg:w-5"
                  : "w-1.5 bg-sv-border",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
