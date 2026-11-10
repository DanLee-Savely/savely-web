import { cn } from "@/lib/utils";

export type Column = {
  label: string;
  /** null이면 막대 대신 「–」(예정 구간) */
  value: number | null;
  /** 진한 막대 · 초록 글자(오늘 · 가장 많이 쓴 주) */
  strong?: boolean;
  /** 점선 막대(진행 중 구간) */
  dashed?: boolean;
  sub?: string;
  subStrong?: boolean;
};

const BAR_MAX = 120;

// 세로 막대(최근 7일 · 주별 지출). 가장 큰 값 = 120px, 0은 최소 막대. CSS로만 그린다
export function ColumnChart({ columns, format }: { columns: Column[]; format: (n: number) => string }) {
  const max = Math.max(1, ...columns.map((c) => c.value ?? 0));
  return (
    <ol className="flex items-end gap-2.5" style={{ minHeight: BAR_MAX + 64 }}>
      {columns.map((c) => (
        <li key={c.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className={cn("sv-text-mono-13", c.strong ? "text-sv-accent" : "text-sv-text-2")}>{c.value === null ? "–" : format(c.value)}</span>
          <span
            aria-hidden
            className={cn(
              "w-full rounded-t-sv-sm",
              c.value === null ? "bg-sv-surface-3" : c.strong ? "bg-sv-accent" : "bg-sv-accent-tint-2",
              c.dashed && "border-2 border-dashed border-sv-accent/60 bg-sv-accent-tint",
            )}
            style={{ height: c.value ? Math.max(4, Math.round((c.value / max) * BAR_MAX)) : 4 }}
          />
          <span className={cn("sv-text-label-13 whitespace-nowrap", c.strong ? "text-sv-accent" : "text-sv-text-2")}>{c.label}</span>
          {c.sub && <span className={cn("-mt-1.5 sv-text-support-13", c.subStrong ? "text-sv-accent" : "text-sv-text-3")}>{c.sub}</span>}
        </li>
      ))}
    </ol>
  );
}
