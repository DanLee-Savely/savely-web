import { PageHeader } from "@/components/app/PageHeader";
import { RecordForm } from "@/components/app/RecordForm";
import { appContent } from "@/content/app.content";
import { DomainError } from "@/domain/DomainError";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock } from "@/infrastructure/container";
import { emptyDraft } from "@/interaction/RecordFormFlow";
import { createRecord } from "../actions";

const { form } = appContent;

// 등록 /app/records/new?date=YYYY-MM-DD (§4-3 · §4-9). 날짜 기본값 · 최댓값은 한국 날짜 오늘
// ?date=가 올바른 과거 · 오늘 날짜면(달력의 「이 날 기록 추가」) 그 날짜로 채운다
export default async function NewRecordPage({ searchParams }: PageProps<"/app/records/new">) {
  const { date } = await searchParams;
  const today = RecordDate.today(clock);
  const valid = typeof date === "string" && DomainError.codeOf(() => RecordDate.create(date, clock)) === null;
  return (
    <>
      <PageHeader back={{ href: "/app/records", label: form.backToList }} title={form.createTitle} />
      <RecordForm
        initial={emptyDraft(valid ? date : today)}
        today={today}
        action={createRecord}
        submitLabel={form.save}
        cancelHref="/app/records"
        hint={form.hint}
      />
    </>
  );
}
