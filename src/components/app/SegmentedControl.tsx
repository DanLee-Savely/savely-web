import { cn } from "@/lib/utils";

type SegmentedControlProps = { id: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void };

// 여럿 중 하나 고르기(구분: 지출 · 수입 · 상환 · 저축). 칸 수는 선택지 수만큼
export function SegmentedControl({ id, options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      id={id}
      role="group"
      aria-labelledby={`${id}-label`}
      className="grid gap-1 rounded-sv-md bg-sv-surface-2 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9.5 rounded-sv-sm sv-text-label-15 disabled:opacity-60",
            o.value === value ? "bg-sv-surface text-sv-text" : "text-sv-text-3 hover:text-sv-text-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
