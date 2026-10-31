"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "./useMediaQuery";

// A안 타임라인 클래스(at(t))를 화면에 연결하는 얇은 어댑터 (20-interactions A안 공통)
// - 요소가 30% 이상 보이는 동안만 requestAnimationFrame으로 t(초)를 흘린다. 화면 밖 · 탭 숨김이면 멈춘다
// - resetKey가 바뀌면 0초부터 다시 센다. until초에 닿으면 멈춘다
// - reducedMotion이면 시간이 흐르지 않는다 → 화면은 타임라인의 still()을 그린다
export function useTimeline<T extends Element>({ resetKey, until = Infinity }: { resetKey?: unknown; until?: number } = {}) {
  const ref = useRef<T>(null);
  const [t, setT] = useState(0);
  const [key, setKey] = useState(resetKey);
  const [inView, setInView] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (key !== resetKey) {
    setKey(resetKey);
    setT(0);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const running = inView && !reducedMotion && t < until;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); // 탭이 돌아왔을 때 한 번에 건너뛰지 않게
      last = now;
      setT((x) => Math.min(until, x + dt));
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [running, until, key]);

  return { ref, t, reducedMotion, active: inView && !reducedMotion };
}
