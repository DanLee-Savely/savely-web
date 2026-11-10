import { CreateRecordButton } from "@/components/app/CreateRecordButton";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordListSkeleton, Skeleton } from "@/components/app/Skeleton";
import { appContent } from "@/content/app.content";

// 목록 로딩: 기록 행 모양 회색 막대 10줄 (§4-1)
export default function Loading() {
  return (
    <>
      <Skeleton className="mt-7 -mb-6 h-3 w-18" />
      <PageHeader title={appContent.list.title} actions={<CreateRecordButton />} />
      <RecordListSkeleton />
    </>
  );
}
