"use client";

import { LoadError } from "@/components/app/LoadError";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";

// 달력 불러오기 오류 (X2)
export default function CalendarError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PageHeader title={appContent.calendar.title} />
      <LoadError retry={retry} />
    </>
  );
}
