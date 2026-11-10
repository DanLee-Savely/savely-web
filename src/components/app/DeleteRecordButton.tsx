"use client";

import { Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";
import { appContent, errorMessage } from "@/content/app.content";
import type { RecordData } from "@/domain/record/RecordEntry";
import { useDeleteRecord } from "@/hooks/useDeleteRecord";
import { formatAmount, formatDay } from "@/lib/recordFormat";
import { CategoryIcon } from "./CategoryIcon";
import { ConfirmDialog } from "./ConfirmDialog";

const { confirmDelete, detail, categories, form } = appContent;

// 상세의 「삭제」 → 확인 창(D1) · 지울 기록 요약 (§4-5)
export function DeleteRecordButton({ record: r }: { record: RecordData }) {
  const { open, setOpen, busy, error, confirm } = useDeleteRecord(r.id);
  return (
    <>
      <AppButton variant="outline-danger" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden className="size-4" />
        {detail.remove}
      </AppButton>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        icon={Trash2}
        title={confirmDelete.title}
        desc={confirmDelete.desc}
        error={error && errorMessage("form", error)}
        busy={busy}
        labels={{ cancel: confirmDelete.cancel, confirm: confirmDelete.confirm, busy: confirmDelete.deleting }}
        onConfirm={confirm}
      >
        <div className="mt-5 flex items-center gap-3 rounded-sv-md bg-sv-surface-2 px-4 py-3">
          <CategoryIcon categoryId={r.categoryId} income={r.kind === "income"} className="bg-sv-surface" />
          <p className="min-w-0 flex-1 truncate sv-text-label-13 text-sv-text">
            {r.title ?? categories[r.categoryId]} · {formatDay(r.date)}
          </p>
          <p className="sv-text-mono-13 text-sv-text-2">
            {r.kind === "income" && "+"}
            {formatAmount(r.amount)}
            {form.won}
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}
