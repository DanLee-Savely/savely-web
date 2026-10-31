"use client";

import { useEffect, type RefObject } from "react";
import { clamp } from "@/interaction/motion";

// I11 · I13 마우스: 커서 위치를 섹션의 CSS 변수로만 넘긴다. 기울기 · 반대 방향 이동은 CSS transition이 부드럽게 따라간다
// --tx · --ty: 기준 요소 중심에서 커서까지(섹션 크기로 나눈 값, 부호 반대) / --rx · --ry: 기울기(-1~1) / --gx · --gy · --on: 커서 빛
export function usePointerTilt(centerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const center = centerRef.current;
    const section = center?.closest("section");
    if (!center || !section) return;
    const set = (vars: Record<string, number>) =>
      Object.entries(vars).forEach(([k, v]) => section.style.setProperty(`--${k}`, String(v)));
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const s = section.getBoundingClientRect();
      const c = center.getBoundingClientRect();
      const dx = e.clientX - (c.left + c.width / 2);
      const dy = e.clientY - (c.top + c.height / 2);
      set({ tx: -dx / s.width, ty: -dy / s.height, rx: clamp(dx / 620, -1, 1), ry: -clamp(dy / 700, -1, 1), gx: e.clientX - s.left, gy: e.clientY - s.top, on: 1 });
    };
    const leave = () => set({ tx: 0, ty: 0, rx: 0, ry: 0, on: 0 });
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, [centerRef]);
}
