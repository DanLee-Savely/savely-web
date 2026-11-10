import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordRow } from "@/components/app/RecordRow";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { createRecordsServer } from "@/infrastructure/container";

const { list } = appContent;

// 목록 /app/records?page=N (§4-1)
export default async function RecordsPage({ searchParams }: PageProps<"/app/records">) {
  const { page } = await searchParams;
  const result = await (await createRecordsServer()).list.execute(typeof page === "string" ? page : undefined);
  if (result.redirectTo) redirect(`/app/records?page=${result.redirectTo}`);

  return (
    <>
      <PageHeader
        eyebrow={list.total.replace("{n}", result.total.toLocaleString("ko-KR"))}
        title={list.title}
        actions={
          <AppButton asChild>
            <Link href="/app/records/new">
              <Plus aria-hidden className="size-4" />
              {list.create}
            </Link>
          </AppButton>
        }
      />
      <ul className="rounded-sv-lg border border-sv-border-2 bg-sv-surface px-6 py-1">
        {result.items.map((r) => (
          <RecordRow key={r.id} record={r} />
        ))}
      </ul>
    </>
  );
}
