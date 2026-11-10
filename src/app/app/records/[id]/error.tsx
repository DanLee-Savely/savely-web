"use client";

import { LoadError } from "@/components/app/LoadError";

// 상세 · 수정 조회 오류 (§4-2)
export default function RecordError({ retry }: { error: unknown; retry: () => void }) {
  return <LoadError retry={retry} />;
}
