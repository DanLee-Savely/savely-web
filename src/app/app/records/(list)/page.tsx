import { Inbox } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateRecordButton } from "@/components/app/CreateRecordButton";
import { PageHeader } from "@/components/app/PageHeader";
import { Pagination } from "@/components/app/Pagination";
import { RecordRow } from "@/components/app/RecordRow";
import { StateMessage } from "@/components/app/StateMessage";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { createRecordsServer } from "@/infrastructure/container";

const { list } = appContent;

// 목록 /app/records?page=N (§4-1). 잘못된 page는 1페이지, 마지막보다 크면 마지막 페이지로 이동
export default async function RecordsPage({ searchParams }: PageProps<"/app/records">) {
  const { page } = await searchParams;
  const result = await (await createRecordsServer()).list.execute(typeof page === "string" ? page : undefined);
  if (result.redirectTo) redirect(`/app/records?page=${result.redirectTo}`);

  return (
    <>
      <PageHeader eyebrow={list.total.replace("{n}", result.total.toLocaleString("ko-KR"))} title={list.title} actions={<CreateRecordButton />} />
      {result.total ? (
        <>
          <ul className="rounded-sv-lg border border-sv-border-2 bg-sv-surface px-6 py-1">
            {result.items.map((r) => (
              <RecordRow key={r.id} record={r} />
            ))}
          </ul>
          <Pagination page={result.page} lastPage={result.lastPage} />
        </>
      ) : (
        <StateMessage
          icon={Inbox}
          title={list.empty.title}
          action={
            <AppButton asChild>
              <Link href="/app/records/new">{list.empty.cta}</Link>
            </AppButton>
          }
        />
      )}
    </>
  );
}
