import { cn } from "@/lib/utils";

type SegmentedControlProps = { id: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void };

// 둘 중 하나 고르기(구분: 지출 · 수입)
export function SegmentedControl({ id, options, value, onChange }: SegmentedControlProps) {
  return (
    <div id={id} role="group" aria-labelledby={`${id}-label`} className="grid grid-cols-2 gap-1 rounded-sv-md bg-sv-surface-2 p-1">
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
