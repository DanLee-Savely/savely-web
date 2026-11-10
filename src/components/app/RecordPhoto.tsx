"use client";

import { ChevronRight, CircleAlert, ImageIcon } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { appContent } from "@/content/app.content";

const { photo } = appContent;

// 상세의 사진 카드: 가로 최대 640px, 누르면 원본을 새 탭에서. 없음(X4) · 불러오기 실패(X5) 자리 표시 (§4-2)
export function RecordPhoto({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  const empty = (icon: ReactNode, title: string, desc?: string) => (
    <div className="flex aspect-[39/34] flex-col items-center justify-center gap-2 rounded-sv-md border border-dashed border-sv-border-2 bg-sv-surface-2 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-sv-surface">{icon}</span>
      <p className="sv-text-label-15 text-sv-text-2">{title}</p>
      {desc && <p className="sv-text-support-13 text-sv-text-3">{desc}</p>}
    </div>
  );
  return (
    <section className="rounded-sv-lg border border-sv-border-2 bg-sv-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="sv-text-label-15 text-sv-text">{photo.title}</h2>
        {src && !failed && (
          <a href={src} target="_blank" rel="noopener" className="inline-flex items-center sv-text-support-13 text-sv-text-2 hover:text-sv-text">
            {photo.original}
            <ChevronRight aria-hidden className="size-4" />
          </a>
        )}
      </div>
      {!src ? (
        empty(<ImageIcon aria-hidden className="size-5 text-sv-text-2" />, photo.none.title, photo.none.desc)
      ) : failed ? (
        empty(<CircleAlert aria-hidden className="size-5 text-[var(--sv-warning)]" />, photo.failed)
      ) : (
        <a href={src} target="_blank" rel="noopener" className="block">
          <Image
            src={src}
            alt={photo.alt}
            width={640}
            height={480}
            unoptimized
            onError={() => setFailed(true)}
            className="h-auto w-full max-w-160 rounded-sv-md bg-sv-surface-2"
          />
        </a>
      )}
    </section>
  );
}
