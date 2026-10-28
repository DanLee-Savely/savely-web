"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { StepSequencer } from "@/interaction/StepSequencer";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// StepSequencer를 화면에 연결하는 얇은 어댑터 (20-interactions 공통 규칙)
// - 요소가 30% 이상 보일 때 진행하고, 화면에서 벗어나면 멈춘다
// - reduced-motion이면 자동 재생 없이 마지막 단계를 보여준다
export function useStepSequence<T extends Element>(delays: readonly number[], loop = false) {
  const ref = useRef<T>(null);
  const [sequencer, setSequencer] = useState(() => new StepSequencer(delays, loop));
  const [inView, setInView] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const delay = sequencer.nextDelay;
    if (reducedMotion || !inView || delay === null) return;
    const timer = setTimeout(() => setSequencer((s) => s.advance()), delay);
    return () => clearTimeout(timer);
  }, [sequencer, inView, reducedMotion]);

  return { ref, step: reducedMotion ? sequencer.finish().step : sequencer.step };
}
