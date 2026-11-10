"use client";

import { LoadError } from "@/components/app/LoadError";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";

// 리포트 불러오기 오류 (X2)
export default function ReportError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PageHeader title={appContent.report.title} />
      <LoadError retry={retry} />
    </>
  );
}
