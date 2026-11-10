import { PageHeader } from "@/components/app/PageHeader";
import { RecordForm } from "@/components/app/RecordForm";
import { appContent } from "@/content/app.content";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock } from "@/infrastructure/container";
import { emptyDraft } from "@/interaction/RecordFormFlow";
import { createRecord } from "../actions";

const { form } = appContent;

// 등록 /app/records/new (§4-3). 날짜 기본값 · 최댓값은 한국 날짜 오늘
export default function NewRecordPage() {
  const today = RecordDate.today(clock);
  return (
    <>
      <PageHeader back={{ href: "/app/records", label: form.backToList }} title={form.createTitle} />
      <RecordForm initial={emptyDraft(today)} today={today} action={createRecord} submitLabel={form.save} cancelHref="/app/records" />
    </>
  );
}
