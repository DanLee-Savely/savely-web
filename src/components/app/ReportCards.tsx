import { Info, Sparkles, Wallet } from "lucide-react";
import type { MonthlyReport } from "@/application/record/GetMonthlyReportService";
import { appContent, fill, withCopula } from "@/content/app.content";
import { formatAmount } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";
import { BigAmount } from "./BigAmount";
import { CategoryIcon } from "./CategoryIcon";
import { ColumnChart } from "./ColumnChart";
import { Chip, DashCard } from "./DashCard";
import { ShareBar, shade } from "./ShareBar";

const { report, categories, reasons, feelings, form } = appContent;
const won = (n: number) => `${formatAmount(n)}${form.won}`;
const weekRange = (w: { from: number; to: number }) => fill(report.weekRange, { from: w.from, to: w.to });

/** 요약: 지출 · 수입 · 하루 평균 · 지난달 비교 · 가장 많이 쓴 곳 (§4-10) */
export function SummaryCard({ r }: { r: MonthlyReport }) {
  const top = r.categories[0];
  const cat = top && categories[top.categoryId];
  return (
    <DashCard title={fill(report.expense, { M: r.month.month })}>
      <BigAmount value={r.expense} />
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            [report.income, r.income ? `+${won(r.income)}` : won(0), r.income > 0],
            [report.dailyAverage, won(r.dailyAverage), false],
          ] as const
        ).map(([label, value, green]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-sv-md bg-sv-surface-2 px-3.5 py-3">
            <dt className="sv-text-support-13 text-sv-text-2">{label}</dt>
            <dd className={cn("sv-text-mono-13", green ? "text-sv-accent" : "text-sv-text")}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-center gap-1.5 sv-text-support-13 text-sv-text-2">
        <Info aria-hidden className="size-4 shrink-0" />
        {fill(report.compare[r.compare.state], { amount: formatAmount(r.compare.diff) })}
      </p>
      {top && (
        <div className="mt-4 rounded-sv-md bg-sv-accent-tint px-5 py-4">
          <p className="sv-text-label-15 text-sv-accent-deep">{fill(report.insight, { M: r.month.month, category: withCopula(cat) })}</p>
          <p className="mt-1 sv-text-support-13 text-sv-accent">
            {fill(report.insightSub, { category: cat, amount: formatAmount(top.sum), n: top.percent })}
          </p>
        </div>
      )}
    </DashCard>
  );
}

/** 주별 지출: 가장 큰 구간 진하게, 진행 중은 점선, 예정은 「–」 */
export function WeeklyCard({ r }: { r: MonthlyReport }) {
  const max = r.weeks.find((w) => w.isMax);
  return (
    <DashCard title={report.weekly} aside={max && <Chip>{fill(report.maxWeek, { range: weekRange(max) })}</Chip>}>
      <ColumnChart
        format={formatAmount}
        columns={r.weeks.map((w) => ({
          label: weekRange(w),
          value: w.amount,
          strong: w.isMax,
          dashed: w.state === "current",
          sub: w.state === "current" ? report.progress : w.state === "future" ? report.planned : undefined,
          subStrong: w.state === "current",
        }))}
      />
    </DashCard>
  );
}

/** 어디에 썼나요: 누적 막대 + 2열 목록 + 합계 */
export function WhereCard({ r }: { r: MonthlyReport }) {
  return (
    <DashCard title={report.where}>
      <ShareBar parts={r.categories.map((c, i) => ({ key: c.categoryId, value: c.sum, color: shade(i) }))} className="mb-5" />
      <ul className="grid gap-x-6 gap-y-3 md:grid-cols-2">
        {r.categories.map((c, i) => (
          <li key={c.categoryId} className="flex items-center gap-3">
            <span aria-hidden className={cn("h-7 w-1 rounded-sv-pill", shade(i))} />
            <CategoryIcon categoryId={c.categoryId} />
            <span className="min-w-0 flex-1 truncate sv-text-label-13 text-sv-text">{categories[c.categoryId]}</span>
            <span className="sv-text-mono-13 text-sv-text-3">{c.percent}%</span>
            <span className="text-right whitespace-nowrap sv-text-mono-13 text-sv-text">{won(c.sum)}</span>
          </li>
        ))}
        <li className="flex items-center gap-3">
          <span aria-hidden className="h-7 w-1" />
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-sv-accent-tint-2 text-sv-accent">
            <Wallet className="size-4" />
          </span>
          <span className="flex-1 sv-text-label-13 text-sv-text">{report.total}</span>
          <span className="sv-text-mono-13 text-sv-text-3">100%</span>
          <span className="text-right whitespace-nowrap sv-text-mono-13 text-sv-accent">{won(r.expense)}</span>
        </li>
      </ul>
    </DashCard>
  );
}

// 이유 · 기분 색과 보여 줄 순서 (디자인 변수 색과 그 투명도만)
const REASON_ORDER: [string, string][] = [
  ["need", "bg-sv-accent"], ["fixed", "bg-sv-accent/60"], ["value", "bg-sv-accent/30"], ["impulse", "bg-[var(--sv-warning)]"], ["other", "bg-sv-border"],
];
const FEELING_ORDER: [string, string][] = [
  ["proud", "bg-sv-accent"], ["satisfied", "bg-sv-accent/60"], ["meh", "bg-sv-border"], ["unsatisfied", "bg-[var(--sv-warning)]"], ["regret", "bg-sv-danger"],
];

function Distribution({ title, order, counts, labels }: { title: string; order: [string, string][]; counts: { id: string; count: number }[]; labels: Record<string, string> }) {
  const n = (id: string) => counts.find((c) => c.id === id)?.count ?? 0;
  const shown = order.filter(([id]) => n(id) > 0);
  return (
    <div className="flex flex-col gap-2.5">
      <p className="sv-text-support-13 text-sv-text-2">{title}</p>
      <ShareBar parts={shown.map(([id, color]) => ({ key: id, value: n(id), color }))} />
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {shown.map(([id, color]) => (
          <li key={id} className="flex items-center gap-1.5 sv-text-support-13 text-sv-text-2">
            <span aria-hidden className={cn("size-2 rounded-full", color)} />
            {labels[id]} <span className="sv-text-mono-13 text-sv-text">{n(id)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 왜 썼고, 기분은 어땠나요: 이유 · 기분을 적은 지출의 건수 분포 + 충동 인사이트 */
export function WhyCard({ r }: { r: MonthlyReport }) {
  return (
    <DashCard title={report.why}>
      <div className="flex flex-col gap-5">
        <Distribution title={report.reason} order={REASON_ORDER} counts={r.reasons} labels={reasons} />
        <Distribution title={report.feeling} order={FEELING_ORDER} counts={r.feelings} labels={feelings} />
        {r.impulse && (
          <p className="flex items-center gap-2 rounded-sv-md bg-sv-surface-2 px-4 py-3 sv-text-label-13 text-sv-text">
            <Sparkles aria-hidden className="size-4 shrink-0 text-sv-accent" />
            {fill(report.impulse, { n: r.impulse.total, m: r.impulse.regret })}
          </p>
        )}
      </div>
    </DashCard>
  );
}
