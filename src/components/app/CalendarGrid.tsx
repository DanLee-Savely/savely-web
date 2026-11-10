import { Wallet } from "lucide-react";
import Link from "next/link";
import type { MonthCalendar } from "@/application/record/GetMonthCalendarService";
import { appContent, fill } from "@/content/app.content";
import { formatAmount } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";
import { Chip } from "./DashCard";

const { calendar, form } = appContent;
const cellBase = "flex h-21 flex-col justify-between rounded-sv-md border p-2.5 text-left";

// 달력 칸(월요일 시작). 칸 금액은 그날 지출(0이면 비움). 다른 달 · 미래 날짜는 누를 수 없음 (§4-9)
export function CalendarGrid({ c }: { c: MonthCalendar }) {
  return (
    <section className="rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6">
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip className="inline-flex items-center gap-1.5 text-sv-text">
          <Wallet aria-hidden className="size-4" />
          {fill(calendar.monthExpense, { M: c.month.month, amount: formatAmount(c.expense) })}
        </Chip>
        <Chip>{fill(calendar.recordCount, { n: c.count })}</Chip>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendar.weekdays.map((d, i) => (
          <span key={d} className={cn("pb-1 pl-2 sv-text-label-13", i === 5 ? "text-[var(--sv-info)]" : i === 6 ? "text-sv-danger" : "text-sv-text-3")}>
            {d}
          </span>
        ))}
        {c.cells.map((cell) => {
          const selected = cell.date === c.selected.date;
          const inner = (
            <>
              <span className="flex items-center justify-between sv-text-label-13">
                {cell.day}
                {cell.isToday && <span className="rounded-sv-pill bg-sv-accent px-2 py-0.5 sv-text-caption-11 text-sv-on-accent">{calendar.today}</span>}
              </span>
              <span className="truncate sv-text-mono-13 text-sv-text-2">{cell.amount ? formatAmount(cell.amount) : ""}</span>
            </>
          );
          if (!cell.inMonth || cell.isFuture)
            return (
              <span key={cell.date} aria-disabled className={cn(cellBase, "border-sv-border-2 text-sv-text-3", !cell.inMonth && "opacity-50")}>
                {inner}
              </span>
            );
          return (
            <Link
              key={cell.date}
              href={`/app/calendar?month=${c.month.key}&date=${cell.date}`}
              scroll={false}
              aria-current={selected ? "date" : undefined}
              aria-label={cell.amount ? `${cell.date} ${formatAmount(cell.amount)}${form.won}` : cell.date}
              className={cn(
                cellBase,
                "text-sv-text hover:border-sv-accent/50",
                selected ? "border-sv-accent bg-sv-accent-tint" : "border-sv-border-2",
                cell.isToday && "border-2 border-sv-accent",
              )}
            >
              {inner}
            </Link>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between sv-text-support-13 text-sv-text-2">
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full border-2 border-sv-accent" />
            {calendar.today}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-[4px] border border-sv-accent bg-sv-accent-tint" />
            {calendar.selected}
          </span>
        </span>
        <span>
          {calendar.average} <span className="ml-1 sv-text-mono-13 text-sv-text">{formatAmount(c.dailyAverage)}{form.won}</span>
        </span>
      </div>
    </section>
  );
}
