"use client";

import { LoadError } from "@/components/app/LoadError";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";

// 목록 불러오기 오류 (§4-1)
export default function ListError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PageHeader title={appContent.list.title} />
      <LoadError retry={retry} />
    </>
  );
}
