"use client";

import { ChevronDown, ChevronUp, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { RecordActionResult } from "@/app/app/records/actions";
import { AppButton } from "@/components/common/AppButton";
import { appContent, errorMessage } from "@/content/app.content";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import { FEELINGS, PAYMENT_METHODS, type RecordDraft, REASONS } from "@/domain/record/RecordEntry";
import { RecordMemo, RecordTitle } from "@/domain/record/RecordText";
import { useRecordForm } from "@/hooks/useRecordForm";
import { AmountInput } from "./AmountInput";
import { ChipGroup, chipButtonClass } from "./ChipGroup";
import { CountedInput } from "./CountedInput";
import { PhotoPicker } from "./PhotoPicker";
import { Field, inputClass } from "./Field";
import { SegmentedControl } from "./SegmentedControl";

const { form, kinds, categories, paymentMethods, reasons, feelings } = appContent;
const toOptions = (values: readonly string[], labels: Record<string, string>) => values.map((value) => ({ value, label: labels[value] }));
const MORE = CategoryCatalog.expense.filter((c) => !CategoryCatalog.featured.includes(c));

type RecordFormProps = {
  initial: RecordDraft;
  today: string;
  action: (data: FormData) => Promise<RecordActionResult>;
  submitLabel: string;
  cancelHref: string;
  hint: string;
  existingImage?: string | null;
};

// 기록 폼(등록 · 수정 공용, §4-3). 왼쪽 열: 구분 · 금액 · 날짜 · 내용 · 메모 / 가운데 열: 카테고리 · 지출 정보 / 오른쪽 카드: 사진
export function RecordForm({ initial, today, action, submitLabel, cancelHref, hint, existingImage = null }: RecordFormProps) {
  const { flow, preview, set, setKind, pickImage, removeImage, submit } = useRecordForm(initial, action, existingImage);
  const { draft, errors } = flow;
  const [expanded, setExpanded] = useState(!!initial.categoryId && MORE.includes(initial.categoryId as never));
  const err = (field: keyof RecordDraft) => (errors[field] ? errorMessage(field, errors[field]) : null);
  const expense = draft.kind === "expense";
  const categoryValues = !expense ? CategoryCatalog.income : expanded ? [...CategoryCatalog.featured, ...MORE] : CategoryCatalog.featured;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid items-start gap-5 xl:grid-cols-[1fr_340px]"
    >
      <fieldset disabled={flow.locked} className="min-w-0 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-7">
        {flow.formError && (
          <p role="alert" className="mb-6 flex items-center gap-2 rounded-sv-md border border-sv-danger px-4 py-3 sv-text-label-13 text-sv-danger">
            <CircleAlert aria-hidden className="size-4 shrink-0" />
            {errorMessage("form", flow.formError)}
          </p>
        )}
        <div className="grid gap-x-7 gap-y-6 md:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-5">
            <Field id="field-kind" label={form.labels.kind} required group>
              <SegmentedControl id="field-kind" options={toOptions(["expense", "income"], kinds)} value={draft.kind} onChange={setKind} />
            </Field>
            <Field id="field-amount" label={form.labels.amount} required error={err("amount")}>
              <AmountInput id="field-amount" value={draft.amount} onChange={(v) => set("amount", v)} invalid={!!errors.amount} />
            </Field>
            <Field id="field-date" label={form.labels.date} required error={err("date")}>
              <input
                id="field-date"
                type="date"
                max={today}
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "field-date-error" : undefined}
                className={`${inputClass(!!errors.date)} h-11.5 sv-text-body-15`}
              />
            </Field>
            <CountedInput
              id="field-title"
              label={form.labels.title}
              max={RecordTitle.MAX}
              value={draft.title}
              onChange={(v) => set("title", v)}
              error={err("title")}
              placeholder={form.titlePlaceholder}
            />
            <CountedInput
              id="field-memo"
              label={form.labels.memo}
              max={RecordMemo.MAX}
              value={draft.memo}
              onChange={(v) => set("memo", v)}
              error={err("memo")}
              placeholder={form.memoPlaceholder}
              multiline
            />
          </div>

          <div className="flex flex-col gap-5">
            <Field id="field-categoryId" label={form.labels.categoryId} required group error={err("categoryId")}>
              <ChipGroup
                id="field-categoryId"
                options={toOptions(categoryValues, categories)}
                value={draft.categoryId}
                onChange={(v) => set("categoryId", v)}
                invalid={!!errors.categoryId}
              >
                {expense && (
                  <button type="button" className={chipButtonClass} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
                    {expanded ? <ChevronUp aria-hidden className="size-4" /> : <ChevronDown aria-hidden className="size-4" />}
                    {expanded ? form.less : form.more.replace("{n}", String(MORE.length))}
                  </button>
                )}
              </ChipGroup>
            </Field>
            {expense && (
              <section className="flex flex-col gap-4">
                <h2 className="sv-text-label-15 text-sv-text">
                  {form.expenseInfo} <span className="ml-1 sv-text-support-13 text-sv-text-3">{form.expenseInfoHint}</span>
                </h2>
                {(
                  [
                    ["paymentMethod", PAYMENT_METHODS, paymentMethods],
                    ["reason", REASONS, reasons],
                    ["feeling", FEELINGS, feelings],
                  ] as const
                ).map(([field, values, labels]) => (
                  <Field key={field} id={`field-${field}`} label={form.labels[field]} group error={err(field)}>
                    <ChipGroup id={`field-${field}`} options={toOptions(values, labels)} value={draft[field]} onChange={(v) => set(field, v)} optional />
                  </Field>
                ))}
              </section>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-sv-border-2 pt-5 md:col-span-2">
            <p className="sv-text-support-13 text-sv-text-3">{hint}</p>
            <div className="flex gap-2">
              <AppButton asChild variant="outline">
                <Link href={cancelHref}>{form.cancel}</Link>
              </AppButton>
              <AppButton type="submit" className="disabled:opacity-60">
                {flow.locked && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
                {flow.locked ? form.saving : submitLabel}
              </AppButton>
            </div>
          </footer>
        </div>
      </fieldset>
      <fieldset disabled={flow.locked} className="min-w-0">
        <PhotoPicker preview={preview} error={errors.image ? errorMessage("image", errors.image) : null} onPick={pickImage} onRemove={removeImage} />
      </fieldset>
    </form>
  );
}
