import { ChartPie, Pencil } from "lucide-react";
import Link from "next/link";
import type { HomeSummary } from "@/application/record/GetHomeSummaryService";
import { AppButton } from "@/components/common/AppButton";
import { appContent, fill } from "@/content/app.content";
import { formatAmount, formatDayShort } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";
import { BigAmount } from "./BigAmount";
import { CategoryIcon } from "./CategoryIcon";
import { ColumnChart } from "./ColumnChart";
import { DashCard } from "./DashCard";
import { RecordRow } from "./RecordRow";
import { shade } from "./ShareBar";

const { home, categories, form } = appContent;
const won = (n: number) => `${formatAmount(n)}${form.won}`;

/** 오늘 카드: 기록 건수 · 오늘 쓴 돈 · 최근 3건, 0건이면 H3 (§4-8) */
export function TodayCard({ s }: { s: HomeSummary }) {
  return (
    <DashCard title={home.today} chip={fill(home.recordCount, { n: s.todayCount })} link={{ href: "/app/records", label: home.allRecords }}>
      <BigAmount label={home.todaySpent} value={s.todaySpent} />
      {s.todayCount ? (
        <ul className="mt-3">
          {s.todayRecords.map((r) => (
            <RecordRow key={r.id} record={r} compact />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-sv-surface-2">
            <Pencil aria-hidden className="size-5 text-sv-text-2" />
          </span>
          <p className="sv-text-label-15 text-sv-text-2">{home.emptyToday}</p>
          <AppButton asChild>
            <Link href="/app/records/new">{home.emptyCta}</Link>
          </AppButton>
        </div>
      )}
    </DashCard>
  );
}

/** 이번 달 카드: 1일 – 오늘 · 쓴 돈 · 수입 · 기록 · 하루 평균 */
export function MonthCard({ s }: { s: HomeSummary }) {
  const rows: [string, string, boolean?][] = [
    [home.income, s.income ? `+${won(s.income)}` : won(0), s.income > 0],
    [home.count, fill(home.countValue, { n: s.count })],
    [home.dailyAverage, won(s.dailyAverage)],
  ];
  return (
    <DashCard title={fill(home.monthRange, { M: s.month.month, D: Number(s.today.slice(8)) })} link={{ href: "/app/report", label: home.report }}>
      <BigAmount label={home.monthSpent} value={s.expense} />
      <dl className="mt-4 border-t border-sv-border-2">
        {rows.map(([label, value, green]) => (
          <div key={label} className="flex items-center justify-between border-b border-sv-border-2 py-3 last:border-b-0">
            <dt className="sv-text-support-13 text-sv-text-2">{label}</dt>
            <dd className={cn("sv-text-mono-15", green ? "text-sv-accent" : "text-sv-text")}>{value}</dd>
          </div>
        ))}
      </dl>
    </DashCard>
  );
}

/** 최근 7일 지출 막대: 오늘만 진하게 */
export function Last7Card({ s }: { s: HomeSummary }) {
  return (
    <DashCard title={home.last7} chip={won(s.last7Total)} link={{ href: "/app/calendar", label: home.calendar }}>
      <ColumnChart
        format={formatAmount}
        columns={s.last7.map((d) => ({ label: formatDayShort(d.date), value: d.amount, strong: d.date === s.today }))}
      />
    </DashCard>
  );
}

/** 이번 달 많이 쓴 곳 상위 3개, 막대 길이는 1위 대비. 0건이면 H5 */
export function TopCategoriesCard({ s }: { s: HomeSummary }) {
  const first = s.topCategories[0]?.sum ?? 1;
  return (
    <DashCard title={fill(home.top, { M: s.month.month })} link={{ href: "/app/report", label: home.report }}>
      {s.topCategories.length ? (
        <ul className="flex flex-col gap-4">
          {s.topCategories.map((c, i) => (
            <li key={c.categoryId} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <CategoryIcon categoryId={c.categoryId} />
                <span className="flex-1 sv-text-label-13 text-sv-text">{categories[c.categoryId]}</span>
                <span className="w-12 text-right sv-text-mono-13 text-sv-text-3">{c.percent}%</span>
                <span className="w-28 text-right sv-text-mono-13 text-sv-text">{won(c.sum)}</span>
              </div>
              <span aria-hidden className="h-1.5 w-full overflow-hidden rounded-sv-pill bg-sv-surface-3">
                <span className={cn("block h-full rounded-sv-pill", shade(i * 2))} style={{ width: `${(c.sum / first) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-sv-surface-2">
            <ChartPie aria-hidden className="size-5 text-sv-text-2" />
          </span>
          <p className="sv-text-support-13 text-sv-text-2">{home.topEmpty}</p>
        </div>
      )}
    </DashCard>
  );
}
