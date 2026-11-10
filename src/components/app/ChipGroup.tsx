import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipGroupProps = {
  id: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** 선택한 칩을 다시 누르면 선택 해제 */
  optional?: boolean;
  invalid?: boolean;
  children?: ReactNode;
};

// 칩 묶음(하나 선택). 눌림 상태는 aria-pressed. 오류 시 첫 칩으로 포커스를 옮길 수 있게 묶음에 id를 단다
export function ChipGroup({ id, options, value, onChange, optional, invalid, children }: ChipGroupProps) {
  return (
    <div
      id={id}
      role="group"
      tabIndex={-1}
      aria-labelledby={`${id}-label`}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className="flex flex-wrap gap-2 outline-none"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected && optional ? "" : o.value)}
            className={cn(
              "h-9.5 rounded-sv-pill border px-3.5 sv-text-label-13 transition-colors disabled:opacity-60",
              selected
                ? "border-sv-accent bg-sv-accent text-sv-on-accent"
                : "border-sv-border-2 bg-sv-surface text-sv-text-2 hover:bg-sv-surface-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
      {children}
    </div>
  );
}

/** 칩 모양의 보조 버튼(「더보기」 · 「접기」) */
export const chipButtonClass =
  "inline-flex h-9.5 items-center gap-1.5 rounded-sv-pill border border-sv-border-2 bg-sv-surface px-3.5 sv-text-label-13 text-sv-text-2 hover:bg-sv-surface-2";
