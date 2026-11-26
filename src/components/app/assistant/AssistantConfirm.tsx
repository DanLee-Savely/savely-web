"use client";

import { AppButton } from "@/components/common/AppButton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type AssistantConfirmProps = {
  open: boolean;
  title: string;
  /** 본문 줄들(줄마다 한 줄) */
  lines: string[];
  labels: { cancel: string; confirm: string };
  /** 되돌릴 수 없는 동작이면 확인 버튼을 위험 색으로 */
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// 대화 패널의 확인 창(저장 확인 · 나가기 확인). 화면 전체를 흐린다. 닫기: 취소 · Esc · 바깥 클릭
export function AssistantConfirm({ open, title, lines, labels, danger, onCancel, onConfirm }: AssistantConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="block max-w-110 rounded-[20px] border border-sv-border-2 bg-sv-surface p-7 ring-0 sm:max-w-110">
        <DialogTitle className="sv-text-title-section-20 text-sv-text">{title}</DialogTitle>
        <DialogDescription className="mt-2 sv-text-support-14_5 whitespace-pre-line text-sv-text-2">{lines.join("\n")}</DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <AppButton variant="outline" onClick={onCancel}>
            {labels.cancel}
          </AppButton>
          <AppButton variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {labels.confirm}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
