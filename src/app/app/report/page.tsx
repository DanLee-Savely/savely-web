import { FileText } from "lucide-react";
import Link from "next/link";
import { MonthNav } from "@/components/app/MonthNav";
import { PageHeader } from "@/components/app/PageHeader";
import { SummaryCard, WeeklyCard, WhereCard, WhyCard } from "@/components/app/ReportCards";
import { StateMessage } from "@/components/app/StateMessage";
import { AppButton } from "@/components/common/AppButton";
import { appContent, fill } from "@/content/app.content";
import { createRecordsServer } from "@/infrastructure/container";

const { report } = appContent;

// 리포트 /app/report?month=YYYY-MM (§4-10). 금액 · 비율 · 막대는 지출만(M19), 예산 없음(M18)
export default async function ReportPage({ searchParams }: PageProps<"/app/report">) {
  const { month } = await searchParams;
  const r = await (await createRecordsServer()).report.execute(typeof month === "string" ? month : undefined);
  const m = r.month;
  return (
    <>
      <PageHeader
        eyebrow={fill(report.subtitle, { M: m.month, D: Number(m.end.slice(8)), n: r.count })}
        title={report.title}
        actions={<MonthNav base="/app/report" year={m.year} month={m.month} prev={m.prev} next={m.next} />}
      />
      {r.count ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <SummaryCard r={r} />
            <WeeklyCard r={r} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
            <WhereCard r={r} />
            <WhyCard r={r} />
          </div>
        </div>
      ) : (
        <StateMessage
          icon={FileText}
          title={report.empty}
          action={
            <AppButton asChild>
              <Link href="/app/records/new">{report.emptyCta}</Link>
            </AppButton>
          }
        />
      )}
    </>
  );
}
