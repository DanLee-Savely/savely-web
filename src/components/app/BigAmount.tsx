import { appContent } from "@/content/app.content";
import { formatAmount } from "@/lib/recordFormat";

// 큰 금액 + 「원」 (오늘 쓴 돈 · 이번 달 쓴 돈 · 이 날 쓴 돈 · 월 지출)
export function BigAmount({ label, value }: { label?: string; value: number }) {
  return (
    <div>
      {label && <p className="sv-text-support-13 text-sv-text-2">{label}</p>}
      <p className="mt-1 sv-text-amount-44 text-sv-text">
        {formatAmount(value)}
        <span className="ml-1.5 sv-text-label-15 text-sv-text-2">{appContent.form.won}</span>
      </p>
    </div>
  );
}
