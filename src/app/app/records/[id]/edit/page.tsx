import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordForm } from "@/components/app/RecordForm";
import { appContent } from "@/content/app.content";
import { RecordNotFoundError } from "@/domain/record/errors";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock, createRecordsServer } from "@/infrastructure/container";
import { formatAmount, imageUrl } from "@/lib/recordFormat";
import { updateRecord } from "../../actions";

const { form } = appContent;

// 수정 /app/records/[id]/edit (§4-4). 등록과 같은 폼에 기존 값을 채운다. 「상세로」 · 「취소」는 상세로
export default async function EditRecordPage({ params }: PageProps<"/app/records/[id]/edit">) {
  const { id } = await params;
  const r = await (await createRecordsServer()).get.execute(id).catch((e) => {
    if (e instanceof RecordNotFoundError) notFound();
    throw e;
  });
  const detail = `/app/records/${r.id}`;
  const draft = {
    kind: r.kind,
    amount: formatAmount(r.amount),
    date: r.date,
    categoryId: r.categoryId,
    title: r.title ?? "",
    paymentMethod: r.paymentMethod ?? "",
    reason: r.reason ?? "",
    feeling: r.feeling ?? "",
    memo: r.memo ?? "",
  };
  return (
    <>
      <PageHeader back={{ href: detail, label: form.backToDetail }} title={form.editTitle} />
      <RecordForm
        initial={draft}
        today={RecordDate.today(clock)}
        action={updateRecord.bind(null, r.id)}
        submitLabel={form.update}
        cancelHref={detail}
        hint={form.editHint}
        existingImage={imageUrl(r)}
      />
    </>
  );
}
