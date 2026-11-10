import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { appContent } from "@/content/app.content";
import type { RecordData } from "@/domain/record/RecordEntry";
import { formatAmount, formatDay } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

const { categories, paymentMethods, reasons, list, form } = appContent;

// 기록 행: 내용(비었으면 카테고리) · 보조줄(카테고리 · 결제수단 · 왜 썼나요, 수입은 카테고리만) · 날짜 · 사진 표시 · 금액 (§4-1)
// compact: 날짜 칸 없이(홈 오늘 카드 · 달력 선택한 날)
export function RecordRow({ record: r, compact }: { record: RecordData; compact?: boolean }) {
  const income = r.kind === "income";
  const category = categories[r.categoryId];
  const sub = [category, r.paymentMethod && paymentMethods[r.paymentMethod], r.reason && reasons[r.reason]].filter(Boolean);
  return (
    <li className="border-b border-sv-border-2 last:border-b-0">
      <Link
        href={`/app/records/${r.id}`}
        className={cn(
          "grid grid-cols-[36px_1fr_auto] items-center gap-x-4 py-3 hover:bg-sv-surface-2",
          compact ? "md:grid-cols-[36px_1fr_24px_auto]" : "md:grid-cols-[36px_1fr_120px_24px_150px]",
        )}
      >
        <CategoryIcon categoryId={r.categoryId} income={income} />
        <div className="min-w-0">
          <p className="truncate sv-text-label-15 text-sv-text">{r.title ?? category}</p>
          <p className="truncate sv-text-support-13 text-sv-text-3">
            {sub.join(" · ")}
            {!compact && <span className="md:hidden"> · {formatDay(r.date)}</span>}
          </p>
        </div>
        {!compact && <p className="hidden sv-text-support-13 text-sv-text-2 md:block">{formatDay(r.date)}</p>}
        <span className="hidden md:block">
          {r.imageKey && <ImageIcon role="img" aria-label={list.hasPhoto} className="size-4 text-sv-text-3" />}
        </span>
        <p className={cn("text-right sv-text-mono-15", income ? "text-sv-accent" : "text-sv-text")}>
          {income && "+"}
          {formatAmount(r.amount)}
          {form.won}
        </p>
      </Link>
    </li>
  );
}
