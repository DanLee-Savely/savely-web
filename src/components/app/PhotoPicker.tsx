"use client";

import { CircleAlert, Info, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { cn } from "@/lib/utils";

const { photo } = appContent;

type PhotoPickerProps = {
  /** 미리보기 주소(새로 고른 사진 또는 기존 사진), 없으면 null */
  preview: string | null;
  error: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
};

// 사진 선택기(1장): 끌어 놓기 · 눌러서 고르기, 미리보기 + 「바꾸기」 · 「삭제」 (§4-3 · §4-4)
export function PhotoPicker({ preview, error, onPick, onRemove }: PhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (files: FileList | null) => files?.[0] && onPick(files[0]);

  return (
    <section className="flex flex-col gap-4 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6">
      <h2 className="sv-text-label-15 text-sv-text">
        {photo.title} <span className="ml-1 sv-text-support-13 text-sv-text-3">{photo.titleHint}</span>
      </h2>
      <input
        ref={input}
        id="field-image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-describedby={error ? "field-image-error" : undefined}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      {preview ? (
        <>
          <Image src={preview} alt={photo.previewAlt} width={640} height={480} unoptimized className="h-auto max-h-80 w-full rounded-sv-md bg-sv-surface-2 object-contain" />
          <div className="grid grid-cols-2 gap-2">
            <AppButton type="button" variant="outline" onClick={() => input.current?.click()}>
              <Upload aria-hidden className="size-4" />
              {photo.change}
            </AppButton>
            <AppButton type="button" variant="outline-danger" onClick={onRemove}>
              <Trash2 aria-hidden className="size-4" />
              {photo.remove}
            </AppButton>
          </div>
        </>
      ) : (
        <div
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => (e.preventDefault(), setOver(false), pick(e.dataTransfer.files))}
          className={cn(
            "flex flex-col items-center gap-2 rounded-sv-md border border-dashed px-4 py-7 text-center",
            error ? "border-sv-danger" : over ? "border-sv-accent bg-sv-accent-tint" : "border-sv-border bg-sv-surface-2",
          )}
        >
          <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-sv-surface">
            <Upload aria-hidden className={cn("size-5", error ? "text-sv-danger" : "text-sv-text")} />
          </span>
          <p className="sv-text-label-13 text-sv-text">{photo.drop}</p>
          <p className="sv-text-support-13 text-sv-text-3">{photo.rule}</p>
          <AppButton type="button" variant="outline" onClick={() => input.current?.click()} className="mt-1">
            {photo.pick}
          </AppButton>
        </div>
      )}
      {error && (
        <p id="field-image-error" className="flex items-center gap-1.5 sv-text-support-13 text-sv-danger">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          {error}
        </p>
      )}
      <p className="flex gap-2 rounded-sv-md bg-sv-surface-2 px-4 py-3 sv-text-support-13 text-sv-text-2">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {photo.privacy}
      </p>
    </section>
  );
}
