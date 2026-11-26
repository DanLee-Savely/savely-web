import { Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteRecordButton } from "@/components/app/DeleteRecordButton";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordPhoto } from "@/components/app/RecordPhoto";
import { AppButton } from "@/components/common/AppButton";
import { amountSign, amountTone, appContent, recordTitle } from "@/content/app.content";
import { CARD_METHODS } from "@/domain/record/RecordEntry";
import { RecordNotFoundError } from "@/domain/record/errors";
import { createRecordsServer } from "@/infrastructure/container";
import { formatAmount, formatDay, formatTime, imageUrl } from "@/lib/recordFormat";

const { detail, kinds, categories, paymentMethods, reasons, feelings, form } = appContent;
const TONE = { income: "text-sv-accent", muted: "text-sv-text-2", plain: "text-sv-text" };

// 상세 /app/records/[id] (§4-2). 빈 선택 항목은 「—」. 지출이 아니면 지출 전용 줄을 보여 주지 않는다
// 「카드 이름」 줄은 카드 결제일 때만(80 K12). 금액은 수입만 + 초록, 상환은 흐린 색(K2)
export default async function RecordPage({ params }: PageProps<"/app/records/[id]">) {
  const { id } = await params;
  const r = await (await createRecordsServer()).get.execute(id).catch((e) => {
    if (e instanceof RecordNotFoundError) notFound();
    throw e;
  });
  const expense = r.kind === "expense";
  const rows: [string, string | null][] = [
    [detail.labels.date, formatDay(r.date)],
    [detail.labels.categoryId, r.categoryId && categories[r.categoryId]],
    ...(expense
      ? ([
          [detail.labels.paymentMethod, r.paymentMethod && paymentMethods[r.paymentMethod]],
          ...(r.paymentMethod && CARD_METHODS.includes(r.paymentMethod) ? [[detail.labels.cardName, r.cardName]] : []),
          [detail.labels.reason, r.reason && reasons[r.reason]],
          [detail.labels.feeling, r.feeling && feelings[r.feeling]],
        ] as [string, string | null][])
      : []),
    [detail.labels.memo, r.memo],
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/app/records", label: detail.backToList }}
        title={recordTitle(r)}
        actions={
          <>
            <AppButton asChild variant="outline">
              <Link href={`/app/records/${r.id}/edit`}>
                <Pencil aria-hidden className="size-4" />
                {detail.edit}
              </Link>
            </AppButton>
            <DeleteRecordButton record={r} />
          </>
        }
      />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_440px]">
        <article className="rounded-sv-lg border border-sv-border-2 bg-sv-surface p-7">
          <span className="rounded-sv-pill bg-sv-surface-2 px-2.5 py-1 sv-text-label-13 text-sv-text-2">{kinds[r.kind]}</span>
          <p className={`mt-3 mb-6 sv-text-amount-44 ${TONE[amountTone(r.kind)]}`}>
            {amountSign(r.kind)}
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
        <RecordPhoto src={imageUrl(r)} />
      </div>
    </>
  );
}
