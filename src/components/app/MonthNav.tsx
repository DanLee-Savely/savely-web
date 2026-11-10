import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { appContent, fill } from "@/content/app.content";
import { cn } from "@/lib/utils";

const { calendar } = appContent;
const btn = "flex size-8 items-center justify-center rounded-full";

// 달 이동 ‹ 2026년 10월 ›. 다음 달이 없으면(이번 달) 비활성 (§4-9)
export function MonthNav({ base, year, month, prev, next }: { base: string; year: number; month: number; prev: string; next: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-sv-pill border border-sv-border-2 bg-sv-surface px-2 py-1.5">
      <Link href={`${base}?month=${prev}`} aria-label={calendar.prevMonth} className={cn(btn, "text-sv-text hover:bg-sv-surface-2")}>
        <ChevronLeft aria-hidden className="size-4" />
      </Link>
      <span className="px-1 sv-text-label-15 text-sv-text">{fill(calendar.monthLabel, { Y: year, M: month })}</span>
      {next ? (
        <Link href={`${base}?month=${next}`} aria-label={calendar.nextMonth} className={cn(btn, "text-sv-text hover:bg-sv-surface-2")}>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-disabled aria-label={calendar.nextMonth} className={cn(btn, "text-sv-text-3 opacity-40")}>
          <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </div>
  );
}
