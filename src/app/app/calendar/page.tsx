import { CalendarGrid } from "@/components/app/CalendarGrid";
import { DayPanel } from "@/components/app/DayPanel";
import { MonthNav } from "@/components/app/MonthNav";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";
import { createRecordsServer } from "@/infrastructure/container";

// 달력 /app/calendar?month=YYYY-MM&date=YYYY-MM-DD (§4-9). 잘못된 · 미래 month는 이번 달
export default async function CalendarPage({ searchParams }: PageProps<"/app/calendar">) {
  const { month, date } = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const c = await (await createRecordsServer()).calendar.execute(one(month), one(date));
  return (
    <>
      <PageHeader title={appContent.calendar.title} actions={<MonthNav base="/app/calendar" year={c.month.year} month={c.month.month} prev={c.month.prev} next={c.month.next} />} />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <CalendarGrid c={c} />
        <DayPanel day={c.selected} />
      </div>
    </>
  );
}
