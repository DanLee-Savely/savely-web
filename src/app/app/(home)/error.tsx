"use client";

import { LoadError } from "@/components/app/LoadError";
import { PageHeader } from "@/components/app/PageHeader";
import { appContent } from "@/content/app.content";

// 홈 불러오기 오류: 목록과 같은 X2 (§4-8)
export default function HomeError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <PageHeader title={appContent.nav.home} />
      <LoadError retry={retry} />
    </>
  );
}
