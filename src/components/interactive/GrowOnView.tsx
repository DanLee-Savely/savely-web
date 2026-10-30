"use client";

import type { ReactNode } from "react";
import { useStepSequence } from "@/hooks/useStepSequence";
import { cn } from "@/lib/utils";

// I4 막대 성장 — 화면에 들어오면(30%) data-grown을 한 번 켠다. 자식은 group-data-grown: 으로 최종 상태를 그린다
// reduced-motion이면 처음부터 최종 상태 (useStepSequence 공통 규칙)
export function GrowOnView({ className, children }: { className?: string; children: ReactNode }) {
  const { ref, step } = useStepSequence<HTMLDivElement>([0]);
  return (
    <div ref={ref} data-grown={step === 1 || undefined} className={cn("group", className)}>
      {children}
    </div>
  );
}
