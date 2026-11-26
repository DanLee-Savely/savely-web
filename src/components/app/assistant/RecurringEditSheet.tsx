"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Field, inputClass } from "@/components/app/Field";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { assistantContent } from "@/content/assistant.content";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import { KINDS, PAYMENT_METHODS } from "@/domain/record/RecordEntry";
import { RecordTitle } from "@/domain/record/RecordText";
import { RECURRING_LIMITS } from "@/domain/recurring/RecurringRules";
import type { RecurringInput } from "@/domain/recurring/RecurringItem";
import { RecurringEditFlow, type RecurringEditValues } from "@/interaction/RecurringEditFlow";
import { cn } from "@/lib/utils";

const { kinds, categories, paymentMethods, form } = appContent;
const { sheet: draftSheet, close, recurring } = assistantContent;
const sheet = recurring.sheet;
const withCommas = (raw: string) => {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13);
  return digits && Number(digits).toLocaleString("ko-KR");
};
const chip = (on: boolean) => cn("h-8 rounded-sv-pill border px-3 sv-text-support-13", on ? "border-sv-accent bg-sv-accent text-sv-on-accent" : "border-sv-border-2 bg-sv-surface text-sv-text-2 hover:bg-sv-surface-2");

type Source = Parameters<typeof RecurringEditFlow.of>[0];
type RecurringEditSheetProps = { source: Source; onApply: (input: RecurringInput) => void; onRemove: () => void; onClose: () => void };

// 고정지출 수정 시트: 종류 · 이름 · 금액 · 매달 나가는 날(1~31, 「말일」 칩) · 카테고리 · 결제수단(지출만).
// 등록 전의 카드와 등록한 항목이 같은 시트를 쓴다. 이유 · 기분은 등록 정보에 없다 — 기록할 때마다 새로 고른다
export function RecurringEditSheet({ source, onApply, onRemove, onClose }: RecurringEditSheetProps) {
  const [flow, setFlow] = useState(() => RecurringEditFlow.of(source));
  const v = flow.values;
  const set = (field: keyof RecurringEditValues) => (e: { target: { value: string } }) => setFlow(flow.set(field, e.target.value));
  const input = `${inputClass(false)} h-11 sv-text-body-15`;
  const apply = () => {
    const value = flow.toInput();
    if (value) onApply(value);
  };
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-sv-backdrop">
      <button type="button" aria-label={close} className="min-h-10 flex-1" onClick={onClose} />
      <section role="dialog" aria-labelledby="recurring-sheet-title" className="flex max-h-full flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-sv-surface p-5">
        <header className="flex items-center justify-between">
          <h3 id="recurring-sheet-title" className="sv-text-title-section-20 text-sv-text">{sheet.title}</h3>
          <button type="button" aria-label={close} onClick={onClose} className="text-sv-text-2 hover:text-sv-text">
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <Field id="recurring-kind" label={sheet.labels.kind} group>
          <SegmentedControl id="recurring-kind" options={KINDS.map((k) => ({ value: k, label: kinds[k] }))} value={v.kind} onChange={(k) => setFlow(flow.setKind(k))} />
        </Field>
        <Field id="recurring-title" label={sheet.labels.title}>
          <input id="recurring-title" value={v.title} maxLength={RecordTitle.MAX} placeholder={sheet.titlePlaceholder} onChange={set("title")} autoComplete="off" className={input} />
        </Field>
        <Field id="recurring-amount" label={sheet.labels.amount}>
          <div className="relative">
            <input id="recurring-amount" inputMode="numeric" value={v.amount} onChange={(e) => setFlow(flow.set("amount", withCommas(e.target.value)))} autoComplete="off" className={`${input} pr-10 sv-text-mono-15`} />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 sv-text-label-13 text-sv-text-2">{form.won}</span>
          </div>
        </Field>
        <Field id="recurring-day" label={sheet.labels.day}>
          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <input id="recurring-day" inputMode="numeric" value={v.day} onChange={(e) => setFlow(flow.setDay(e.target.value))} autoComplete="off" className={`${input} pr-9 sv-text-mono-15`} />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 sv-text-label-13 text-sv-text-2">{sheet.dayUnit}</span>
            </div>
            <button type="button" aria-pressed={flow.day === RECURRING_LIMITS.maxDay} onClick={() => setFlow(flow.set("day", String(RECURRING_LIMITS.maxDay)))} className={chip(flow.day === RECURRING_LIMITS.maxDay)}>
              {sheet.lastDay}
            </button>
          </div>
          {flow.day === RECURRING_LIMITS.maxDay && <p className="sv-text-support-13 text-sv-text-3">{sheet.lastDayHint}</p>}
        </Field>
        <Field id="recurring-category" label={sheet.labels.categoryId}>
          <select id="recurring-category" value={v.categoryId} onChange={set("categoryId")} className={input}>
            <option value="">{draftSheet.pickCategory}</option>
            {CategoryCatalog.of(v.kind).map((id) => (
              <option key={id} value={id}>{categories[id]}</option>
            ))}
          </select>
        </Field>
        {flow.expense && (
          <Field id="recurring-payment" label={sheet.labels.paymentMethod} group>
            <div id="recurring-payment" role="group" aria-labelledby="recurring-payment-label" className="flex flex-wrap gap-1.5">
              {["", ...PAYMENT_METHODS].map((m) => (
                <button key={m} type="button" aria-pressed={v.paymentMethod === m} onClick={() => setFlow(flow.set("paymentMethod", m))} className={chip(v.paymentMethod === m)}>
                  {m ? paymentMethods[m] : draftSheet.noPayment}
                </button>
              ))}
            </div>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <AppButton variant="outline-danger" onClick={onRemove}>
            {draftSheet.remove}
          </AppButton>
          <AppButton disabled={!flow.canApply} onClick={apply}>
            {flow.canApply ? draftSheet.apply : sheet.incomplete}
          </AppButton>
        </div>
      </section>
    </div>
  );
}
