"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { Field, inputClass } from "@/components/app/Field";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { appContent } from "@/content/app.content";
import { assistantContent } from "@/content/assistant.content";
import { DRAFT_LIMITS, DraftValidator } from "@/domain/assistant/DraftValidator";
import { RecordDateReader } from "@/domain/assistant/RecordDateReader";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import { KINDS, PAYMENT_METHODS } from "@/domain/record/RecordEntry";
import { RecordCardName, RecordMemo, RecordTitle } from "@/domain/record/RecordText";
import { clock } from "@/infrastructure/container";
import type { DraftCard } from "@/interaction/AssistantSession";
import { DraftEditFlow, type DraftEditValues } from "@/interaction/DraftEditFlow";
import { cn } from "@/lib/utils";

const { kinds, categories, paymentMethods, form } = appContent;
const { sheet, close } = assistantContent;
const validator = new DraftValidator(clock);
const withCommas = (raw: string) => {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13);
  return digits && Number(digits).toLocaleString("ko-KR");
};

type DraftEditSheetProps = {
  card: DraftCard;
  today: string;
  onApply: (patch: Partial<DraftCard>) => void;
  onRemove: () => void;
  onClose: () => void;
};

// 초안 카드 수정 시트(시안 32 · 55): 종류 · 날짜 · 내용 · 금액 · 카테고리 · 결제수단 · 카드 이름(카드 결제일 때만) · 메모.
// 이유 · 기분은 여기 없다 — 카드 위 칩으로 고른다. 날짜를 지우면 화면 날짜로 저장한다(오늘 ~ 30일 전만 고를 수 있다)
export function DraftEditSheet({ card, today, onApply, onRemove, onClose }: DraftEditSheetProps) {
  const [flow, setFlow] = useState(() => DraftEditFlow.of(card));
  const v = flow.values;
  const set = (field: keyof DraftEditValues) => (e: { target: { value: string } }) => setFlow(flow.set(field, e.target.value));
  const input = `${inputClass(false)} h-11 sv-text-body-15`;
  const apply = () => {
    const patch = flow.apply(validator, card);
    if (patch) onApply(patch);
  };
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-sv-backdrop">
      <button type="button" aria-label={close} className="min-h-10 flex-1" onClick={onClose} />
      <section role="dialog" aria-labelledby="draft-sheet-title" className="flex max-h-full flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-sv-surface p-5">
        <header className="flex items-center justify-between">
          <h3 id="draft-sheet-title" className="sv-text-title-section-20 text-sv-text">{sheet.title}</h3>
          <button type="button" aria-label={close} onClick={onClose} className="text-sv-text-2 hover:text-sv-text">
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <Field id="sheet-kind" label={sheet.labels.kind} group>
          <SegmentedControl id="sheet-kind" options={KINDS.map((k) => ({ value: k, label: kinds[k] }))} value={v.kind} onChange={(k) => setFlow(flow.setKind(k))} />
        </Field>
        <Field id="sheet-date" label={sheet.labels.date}>
          <div className="relative">
            <input id="sheet-date" type="date" min={RecordDateReader.addDays(today, -DRAFT_LIMITS.maxDaysBack)} max={today} value={v.date} onChange={set("date")} className={input} />
            {v.date && (
              <button type="button" onClick={() => setFlow(flow.set("date", ""))} className="absolute top-1/2 right-11 -translate-y-1/2 sv-text-label-13 text-sv-accent">
                {sheet.clear}
              </button>
            )}
          </div>
        </Field>
        <Field id="sheet-title" label={sheet.labels.title}>
          <input id="sheet-title" value={v.title} maxLength={RecordTitle.MAX} placeholder={sheet.titlePlaceholder} onChange={set("title")} autoComplete="off" className={input} />
        </Field>
        <Field id="sheet-amount" label={sheet.labels.amount}>
          <div className="relative">
            <input id="sheet-amount" inputMode="numeric" value={v.amount} onChange={(e) => setFlow(flow.set("amount", withCommas(e.target.value)))} autoComplete="off" className={`${input} pr-10 sv-text-mono-15`} />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 sv-text-label-13 text-sv-text-2">{form.won}</span>
          </div>
        </Field>
        <Field id="sheet-category" label={sheet.labels.categoryId}>
          <select id="sheet-category" value={v.categoryId} onChange={set("categoryId")} className={input}>
            <option value="">{sheet.pickCategory}</option>
            {CategoryCatalog.of(v.kind).map((id) => (
              <option key={id} value={id}>{categories[id]}</option>
            ))}
          </select>
        </Field>
        {flow.expense && (
          <Field id="sheet-payment" label={sheet.labels.paymentMethod} group>
            <div id="sheet-payment" role="group" aria-labelledby="sheet-payment-label" className="flex flex-wrap gap-1.5">
              {["", ...PAYMENT_METHODS].map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={v.paymentMethod === m}
                  onClick={() => setFlow(flow.set("paymentMethod", m))}
                  className={cn(
                    "h-8 rounded-sv-pill border px-3 sv-text-support-13",
                    v.paymentMethod === m ? "border-sv-accent bg-sv-accent text-sv-on-accent" : "border-sv-border-2 bg-sv-surface text-sv-text-2 hover:bg-sv-surface-2",
                  )}
                >
                  {m ? paymentMethods[m] : sheet.noPayment}
                </button>
              ))}
            </div>
          </Field>
        )}
        {flow.byCard && (
          <Field id="sheet-card" label={sheet.labels.cardName}>
            <input id="sheet-card" value={v.cardName} maxLength={RecordCardName.MAX} placeholder={sheet.cardNamePlaceholder} onChange={set("cardName")} autoComplete="off" className={input} />
          </Field>
        )}
        <Field id="sheet-memo" label={sheet.labels.memo}>
          <input id="sheet-memo" value={v.memo} maxLength={RecordMemo.MAX} placeholder={sheet.memoPlaceholder} onChange={set("memo")} autoComplete="off" className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <AppButton variant="outline-danger" onClick={onRemove}>
            {sheet.remove}
          </AppButton>
          <AppButton disabled={!flow.canApply} onClick={apply}>
            {flow.canApply ? sheet.apply : sheet.needAmount}
          </AppButton>
        </div>
      </section>
    </div>
  );
}
