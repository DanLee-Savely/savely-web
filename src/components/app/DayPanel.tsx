import Link from "next/link";
import type { CalendarDay } from "@/application/record/GetMonthCalendarService";
import { AppButton } from "@/components/common/AppButton";
import { appContent, fill } from "@/content/app.content";
import { formatDay } from "@/lib/recordFormat";
import { BigAmount } from "./BigAmount";
import { Chip } from "./DashCard";
import { RecordRow } from "./RecordRow";

const { calendar, feelings } = appContent;

// 달력의 선택한 날: 날짜 · 이 날 쓴 돈 · 건수 · 기록 · 기분 집계 · 「이 날 기록 추가」 (§4-9)
export function DayPanel({ day }: { day: CalendarDay }) {
  return (
    <section className="flex flex-col gap-4 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6">
      <div>
        <p className="sv-text-support-13 text-sv-text-3">{calendar.selected}</p>
        <h2 className="mt-1 sv-text-title-section-20 text-sv-text">{formatDay(day.date)}</h2>
      </div>
      <BigAmount label={calendar.spent} value={day.spent} />
      {day.count ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Chip>{fill(calendar.recordCount, { n: day.count })}</Chip>
            {day.fixedCount > 0 && <Chip>{fill(calendar.fixedCount, { n: day.fixedCount })}</Chip>}
          </div>
          <ul className="border-t border-sv-border-2">
            {day.records.map((r) => (
              <RecordRow key={r.id} record={r} compact />
            ))}
          </ul>
          {day.feelings.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="sv-text-support-13 text-sv-text-2">{calendar.feeling}</p>
              <div className="flex flex-wrap gap-2">
                {day.feelings.map((f) => (
                  <span key={f.feeling} className="rounded-sv-pill border border-sv-border-2 px-3 py-1 sv-text-label-13 text-sv-text-2">
                    {feelings[f.feeling]} {f.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="py-6 text-center sv-text-body-15 text-sv-text-2">{calendar.empty}</p>
      )}
      <AppButton asChild variant="outline" size="l" className="mt-auto w-full">
        <Link href={`/app/records/new?date=${day.date}`}>{calendar.add}</Link>
      </AppButton>
    </section>
  );
}
