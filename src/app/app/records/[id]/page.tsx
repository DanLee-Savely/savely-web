import { Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";
import { RecordNotFoundError } from "@/domain/record/errors";
import { createRecordsServer } from "@/infrastructure/container";
import { formatAmount, formatDay, formatTime } from "@/lib/recordFormat";

const { detail, kinds, categories, paymentMethods, reasons, feelings, form } = appContent;

// 상세 /app/records/[id] (§4-2). 빈 선택 항목은 「—」. 수입은 지출 전용 줄을 보여 주지 않는다
export default async function RecordPage({ params }: PageProps<"/app/records/[id]">) {
  const { id } = await params;
  const r = await (await createRecordsServer()).get.execute(id).catch((e) => {
    if (e instanceof RecordNotFoundError) notFound();
    throw e;
  });
  const expense = r.kind === "expense";
  const rows: [string, string | null][] = [
    [detail.labels.date, formatDay(r.date)],
    [detail.labels.categoryId, categories[r.categoryId]],
    ...(expense
      ? ([
          [detail.labels.paymentMethod, r.paymentMethod && paymentMethods[r.paymentMethod]],
          [detail.labels.reason, r.reason && reasons[r.reason]],
          [detail.labels.feeling, r.feeling && feelings[r.feeling]],
        ] as [string, string | null][])
      : []),
    [detail.labels.memo, r.memo],
  ];

  return (
    <>
      <PageHeader back={{ href: "/app/records", label: detail.backToList }} title={r.title ?? categories[r.categoryId]} />
      <article className="rounded-sv-lg border border-sv-border-2 bg-sv-surface p-7">
        <span className="rounded-sv-pill bg-sv-surface-2 px-2.5 py-1 sv-text-label-13 text-sv-text-2">{kinds[r.kind]}</span>
        <p className={`mt-3 mb-6 sv-text-amount-44 ${expense ? "text-sv-text" : "text-sv-accent"}`}>
          {!expense && "+"}
          {formatAmount(r.amount)}
          <span className="ml-1.5 sv-text-label-15 text-sv-text-2">{form.won}</span>
        </p>
        <dl className="border-t border-sv-border-2">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[136px_1fr] gap-4 border-b border-sv-border-2 py-3.5">
              <dt className="sv-text-support-13 text-sv-text-3">{label}</dt>
              <dd className="sv-text-label-15 break-all whitespace-pre-line text-sv-text">{value || detail.empty}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 flex items-center gap-1.5 sv-text-support-13 text-sv-text-3">
          <Clock aria-hidden className="size-4" />
          {detail.times.replace("{created}", formatTime(r.createdAt)).replace("{updated}", formatTime(r.updatedAt))}
        </p>
      </article>
    </>
  );
}
