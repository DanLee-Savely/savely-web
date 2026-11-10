import { DomainError } from "../DomainError";
import { Amount } from "./Amount";
import { CategoryCatalog } from "./CategoryCatalog";
import type { Clock } from "./Clock";
import { InvalidOptionError, InvalidRecordError } from "./errors";
import { ImageFile } from "./ImageFile";
import { RecordDate } from "./RecordDate";
import { RecordMemo, RecordTitle } from "./RecordText";

// 값 목록 (70-mvp-records §6-3). 표시 이름은 content/app.content.ts
export const KINDS = ["expense", "income"] as const;
export const PAYMENT_METHODS = ["cash", "check_card", "credit_card", "bank_transfer", "other"] as const;
export const REASONS = ["need", "impulse", "value", "fixed", "other"] as const;
export const FEELINGS = ["proud", "satisfied", "meh", "unsatisfied", "regret"] as const;

export type RecordKind = (typeof KINDS)[number];

/** 폼에서 온 그대로의 값(문자열). 빈 선택은 "" */
export type RecordDraft = {
  kind: string;
  amount: string;
  date: string;
  categoryId: string;
  title: string;
  paymentMethod: string;
  reason: string;
  feeling: string;
  memo: string;
};

export type RecordField = keyof RecordDraft | "image";
/** 칸 → 도메인 오류 code */
export type RecordFieldErrors = Partial<Record<RecordField, string>>;

/** 저장 · 표시용 평범한 값 (테이블 records 한 행, 열 이름만 camelCase) */
export type RecordData = {
  id: string;
  kind: RecordKind;
  amount: number;
  date: string;
  categoryId: string;
  title: string | null;
  paymentMethod: string | null;
  reason: string | null;
  feeling: string | null;
  memo: string | null;
  imageKey: string | null;
  createdAt: string;
  updatedAt: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const pick = (list: readonly string[], raw: string, optional: boolean): void => {
  if (!(optional && raw === "") && !list.includes(raw)) throw new InvalidOptionError();
};

// 엔티티: 지출 · 수입 기록 한 건. 구분 ↔ 카테고리 일치, 수입이면 지출 전용 항목(결제수단 · 왜 썼나요 · 기분)을 비운다
export class RecordEntry {
  private constructor(private readonly data: RecordData) {}

  static isId(raw: string): boolean {
    return UUID.test(raw);
  }

  /** 칸별 검사. 브라우저(폼)와 서버(서비스)가 같이 쓴다. 사진 바이트를 주면 사진도 검사한다 */
  static check(draft: RecordDraft, clock: Clock, image?: Uint8Array | null): RecordFieldErrors {
    const expense = draft.kind !== "income";
    const checks: [RecordField, () => unknown][] = [
      ["kind", () => pick(KINDS, draft.kind, false)],
      ["amount", () => Amount.create(draft.amount)],
      ["date", () => RecordDate.create(draft.date, clock)],
      ["categoryId", () => CategoryCatalog.assert(draft.kind, draft.categoryId)],
      ["title", () => RecordTitle.create(draft.title)],
      ["memo", () => RecordMemo.create(draft.memo)],
      ["paymentMethod", () => expense && pick(PAYMENT_METHODS, draft.paymentMethod, true)],
      ["reason", () => expense && pick(REASONS, draft.reason, true)],
      ["feeling", () => expense && pick(FEELINGS, draft.feeling, true)],
      ["image", () => image && ImageFile.create(image)],
    ];
    return Object.fromEntries(
      checks.flatMap(([field, fn]) => {
        const code = DomainError.codeOf(fn);
        return code ? [[field, code]] : [];
      }),
    );
  }

  /** 검사를 통과하면 새 기록, 아니면 InvalidRecordError(칸별 오류) */
  static create(id: string, draft: RecordDraft, clock: Clock): RecordEntry {
    const errors = RecordEntry.check(draft, clock);
    if (Object.keys(errors).length) throw new InvalidRecordError(errors);
    const now = clock.now().toISOString();
    const expense = draft.kind === "expense";
    return new RecordEntry({
      id,
      kind: draft.kind as RecordKind,
      amount: Amount.create(draft.amount).value,
      date: draft.date,
      categoryId: draft.categoryId,
      title: RecordTitle.create(draft.title).value,
      paymentMethod: (expense && draft.paymentMethod) || null,
      reason: (expense && draft.reason) || null,
      feeling: (expense && draft.feeling) || null,
      memo: RecordMemo.create(draft.memo).value,
      imageKey: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 저장소에서 읽은 값 (DB CHECK 제약을 통과한 값이라 다시 검사하지 않는다) */
  static restore(data: RecordData): RecordEntry {
    return new RecordEntry({ ...data });
  }

  /** 새 값으로 고친 기록. id · 사진 · 처음 적은 시각은 그대로, 고친 시각은 지금 */
  update(draft: RecordDraft, clock: Clock): RecordEntry {
    const next = RecordEntry.create(this.data.id, draft, clock).data;
    return new RecordEntry({ ...next, imageKey: this.data.imageKey, createdAt: this.data.createdAt });
  }

  withImage(imageKey: string | null): RecordEntry {
    return new RecordEntry({ ...this.data, imageKey });
  }

  get id(): string {
    return this.data.id;
  }

  get imageKey(): string | null {
    return this.data.imageKey;
  }

  toData(): RecordData {
    return { ...this.data };
  }
}
