"use client";

import { useRef, useState } from "react";
import { deleteRecord } from "@/app/app/records/actions";

// 삭제 확인 창 상태: 열림 · 삭제 중 · 오류 code. 성공이면 Action이 목록으로 이동시킨다
export function useDeleteRecord(id: string) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  const confirm = async () => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const result = await deleteRecord(id).catch(() => ({ formError: "DELETE_FAILED" }));
    if (!result) return; // 이동 중
    sending.current = false;
    setBusy(false);
    setError(result.formError ?? "DELETE_FAILED");
  };

  return { open, setOpen: (o: boolean) => (setOpen(o), setError(null)), busy, error, confirm };
}
