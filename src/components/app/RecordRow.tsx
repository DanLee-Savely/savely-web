import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { amountSign, amountTone, appContent, recordSub, recordTitle } from "@/content/app.content";
import type { RecordData } from "@/domain/record/RecordEntry";
import { formatAmount, formatDay } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

const { list, form } = appContent;
const TONE = { income: "text-sv-accent", muted: "text-sv-text-2", plain: "text-sv-text" };

// 기록 행: 내용(비었으면 카테고리, 그것도 없으면 구분) · 보조줄(카테고리 · 결제수단 + 카드 이름 · 왜 썼나요, 지출이 아니면 카테고리만)
// · 날짜 · 사진 표시 · 금액(수입만 + 초록, 상환은 흐린 색 — 80 K2) (§4-1)
// compact: 날짜 칸 없이(홈 오늘 카드 · 달력 선택한 날)
export function RecordRow({ record: r, compact }: { record: RecordData; compact?: boolean }) {
  const sub = recordSub(r);
  return (
    <li className="border-b border-sv-border-2 last:border-b-0">
      <Link
        href={`/app/records/${r.id}`}
        className={cn(
          "grid grid-cols-[36px_1fr_auto] items-center gap-x-4 py-3 hover:bg-sv-surface-2",
          compact ? "md:grid-cols-[36px_1fr_24px_auto]" : "md:grid-cols-[36px_1fr_120px_24px_150px]",
        )}
      >
        <CategoryIcon categoryId={r.categoryId} income={r.kind === "income"} />
        <div className="min-w-0">
          <p className="truncate sv-text-label-15 text-sv-text">{recordTitle(r)}</p>
          <p className="min-h-[1lh] truncate sv-text-support-13 text-sv-text-3">
            {sub}
            {!compact && <span className="md:hidden">{sub ? " · " : ""}{formatDay(r.date)}</span>}
          </p>
        </div>
        {!compact && <p className="hidden sv-text-support-13 text-sv-text-2 md:block">{formatDay(r.date)}</p>}
        <span className="hidden md:block">
          {r.imageKey && <ImageIcon role="img" aria-label={list.hasPhoto} className="size-4 text-sv-text-3" />}
        </span>
        <p className={cn("text-right sv-text-mono-15", TONE[amountTone(r.kind)])}>
          {amountSign(r.kind)}
          {formatAmount(r.amount)}
          {form.won}
        </p>
      </Link>
    </li>
  );
}
