"use client";

import { CircleAlert, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppButton } from "@/components/common/AppButton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  desc: string;
  children?: ReactNode;
  error: string | null;
  busy: boolean;
  labels: { cancel: string; confirm: string; busy: string };
  onConfirm: () => void;
};

// 확인 창(위험 동작). 닫기: 「취소」 · Esc · 바깥 클릭. 진행 중에는 닫히지 않는다
export function ConfirmDialog({ open, onOpenChange, icon: Icon, title, desc, children, error, busy, labels, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent showCloseButton={false} className="block max-w-110 rounded-[20px] border border-sv-border-2 bg-sv-surface p-7 ring-0 sm:max-w-110">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-sv-surface-2">
          <Icon aria-hidden className="size-5 text-sv-danger" />
        </span>
        <DialogTitle className="sv-text-title-section-20 text-sv-text">{title}</DialogTitle>
        <DialogDescription className="mt-2 sv-text-support-14_5 text-sv-text-2">{desc}</DialogDescription>
        {children}
        {error && (
          <p role="alert" className="mt-4 flex items-center gap-1.5 sv-text-support-13 text-sv-danger">
            <CircleAlert aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <AppButton variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </AppButton>
          <AppButton variant="danger" disabled={busy} onClick={onConfirm} className="disabled:opacity-60">
            {busy && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
            {busy ? labels.busy : labels.confirm}
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
