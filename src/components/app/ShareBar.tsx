import { cn } from "@/lib/utils";

/** 누적 막대 색: 초록 단계(진한 → 연한) 다음 회색. 디자인 변수 색과 그 투명도만 쓴다 */
export const SHADES = ["bg-sv-accent", "bg-sv-accent/75", "bg-sv-accent/55", "bg-sv-accent/40", "bg-sv-accent/28", "bg-sv-accent/18", "bg-sv-border"];
export const shade = (i: number) => SHADES[Math.min(i, SHADES.length - 1)];

// 가로 누적 막대(비율). 값이 0인 조각은 그리지 않는다
export function ShareBar({ parts, className }: { parts: { key: string; value: number; color: string }[]; className?: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div aria-hidden className={cn("flex h-2.5 w-full gap-0.5 overflow-hidden rounded-sv-pill bg-sv-surface-3", className)}>
      {total > 0 && parts.filter((p) => p.value > 0).map((p) => <span key={p.key} className={p.color} style={{ width: `${(p.value / total) * 100}%` }} />)}
    </div>
  );
}
