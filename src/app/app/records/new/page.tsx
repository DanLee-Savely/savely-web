import { NewRecordForm } from "@/components/app/NewRecordForm";
import { DomainError } from "@/domain/DomainError";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock } from "@/infrastructure/container";
import { emptyDraft } from "@/interaction/RecordFormFlow";
import { createRecord } from "../actions";

// 등록 /app/records/new?date=YYYY-MM-DD (§4-3 · §4-9). 날짜 기본값 · 최댓값은 한국 날짜 오늘
// ?date=가 올바른 과거 · 오늘 날짜면(달력의 「이 날 기록 추가」) 그 날짜로 채운다
// 머리말 오른쪽의 「대화로 적기」는 폼 상태를 봐야 해서 NewRecordForm이 머리말까지 그린다(80 E4)
export default async function NewRecordPage({ searchParams }: PageProps<"/app/records/new">) {
  const { date } = await searchParams;
  const today = RecordDate.today(clock);
  const valid = typeof date === "string" && DomainError.codeOf(() => RecordDate.create(date, clock)) === null;
  return <NewRecordForm initial={emptyDraft(valid ? date : today)} today={today} action={createRecord} />;
}
