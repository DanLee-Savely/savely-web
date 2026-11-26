import { Check, Sparkles, X } from "lucide-react";
import { CategoryIcon } from "@/components/app/CategoryIcon";
import { amountSign, amountTone, appContent } from "@/content/app.content";
import { assistantContent, dayLabel } from "@/content/assistant.content";
import { FEELINGS, REASONS } from "@/domain/record/RecordEntry";
import type { DraftCard } from "@/interaction/AssistantSession";
import { formatAmount } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";

const { kinds, categories, paymentMethods, reasons, feelings, form } = appContent;
const { card: copy, aiBadge } = assistantContent;
const TONE = { income: "text-sv-accent", muted: "text-sv-text-2", plain: "text-sv-text" };

type DraftCardViewProps = {
  card: DraftCard;
  screenDate: string;
  today: string;
  /** 정리 중 · 저장 중에는 누를 수 없다 */
  locked: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onReason: (reason: string) => void;
  onFeeling: (feeling: string) => void;
};

function Chips({ values, labels, value, disabled, onPick }: { values: readonly string[]; labels: Record<string, string>; value: string | null; disabled: boolean; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          aria-pressed={v === value}
          onClick={() => onPick(v)}
          className={cn(
            "h-8 rounded-sv-pill border px-3 sv-text-support-13 transition-colors disabled:opacity-60",
            v === value ? "border-sv-accent bg-sv-accent text-sv-on-accent" : "border-sv-border-2 bg-sv-surface text-sv-text-2 hover:bg-sv-surface-2",
          )}
        >
          {labels[v]}
        </button>
      ))}
    </div>
  );
}

// 초안 카드 한 장: 내용 · 구분 · 카테고리 · 결제수단 · 금액. 머리 줄을 누르면 수정 시트.
// 지출 카드에는 이유 칩(선택)이 붙고, 이유를 고른 뒤에만 기분을 묻는다. 다른 날에 저장될 카드에만 날짜를 적는다.
// 금액은 수입만 + 초록, 상환은 흐린 색(80 K2). 저장을 마친 카드는 흐리게 잠근다
export function DraftCardView({ card, screenDate, today, locked, onEdit, onRemove, onReason, onFeeling }: DraftCardViewProps) {
  const category = card.categoryId ? categories[card.categoryId] : null;
  const otherDay = card.date !== null && card.date !== screenDate;
  const payment = card.paymentMethod && [paymentMethods[card.paymentMethod], card.cardName].filter(Boolean).join(" ");
  const head = (
    <>
      <CategoryIcon categoryId={card.categoryId} income={card.kind === "income"} className="size-8 bg-transparent" />
      <span className="min-w-0 flex-1">
        <span className="block truncate sv-text-label-13 text-sv-text">{card.title ?? category ?? copy.noTitle}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 sv-text-support-13 text-sv-text-3">
          {card.ai && (
            <span className="inline-flex items-center gap-0.5 rounded-sv-pill bg-sv-accent-tint px-1.5 text-sv-accent">
              <Sparkles aria-hidden className="size-3" />
              {aiBadge}
            </span>
          )}
          {otherDay && <span className="text-sv-accent">{dayLabel(card.date!, today)} ·</span>}
          <span>{kinds[card.kind]} ·</span>
          <span className={category ? undefined : "text-sv-accent"}>{category ?? copy.pickCategory}</span>
          {payment && <span>· {payment}</span>}
        </span>
      </span>
      <span className={cn("sv-text-mono-13", TONE[amountTone(card.kind)])}>
        {amountSign(card.kind)}
        {formatAmount(card.amount)}
        {form.won}
      </span>
    </>
  );
  if (card.saved) {
    return (
      <li className="flex items-start gap-2 rounded-sv-md border border-sv-border-2 px-3 py-3 opacity-60">
        {head}
        <Check role="img" aria-label={copy.saved} className="size-4 shrink-0 text-sv-accent" />
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-2.5 rounded-sv-md border border-sv-border-2 px-3 py-3">
      <div className="flex items-start gap-2">
        <button type="button" disabled={locked} onClick={onEdit} className="flex min-w-0 flex-1 items-start gap-2 text-left">
          {head}
        </button>
        <button type="button" disabled={locked} onClick={onRemove} aria-label={copy.remove} className="shrink-0 text-sv-text-3 hover:text-sv-text disabled:opacity-60">
          <X aria-hidden className="size-4" />
        </button>
      </div>
      {card.kind === "expense" && <Chips values={REASONS} labels={reasons} value={card.reason} disabled={locked} onPick={onReason} />}
      {card.kind === "expense" && card.reason !== null && <Chips values={FEELINGS} labels={feelings} value={card.feeling} disabled={locked} onPick={onFeeling} />}
    </li>
  );
}
