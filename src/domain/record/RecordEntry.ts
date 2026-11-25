import { DomainError } from "../DomainError";
import { Amount } from "./Amount";
import { CategoryCatalog } from "./CategoryCatalog";
import type { Clock } from "./Clock";
import { InvalidOptionError, InvalidRecordError } from "./errors";
import { ImageFile } from "./ImageFile";
import { RecordDate } from "./RecordDate";
import { RecordCardName, RecordMemo, RecordTitle } from "./RecordText";

// 값 목록 (70-mvp-records §6-3 · 80-record-assistant §4-1). 표시 이름은 content/app.content.ts
export const KINDS = ["expense", "income", "transfer", "savings"] as const;
export const PAYMENT_METHODS = ["cash", "check_card", "credit_card", "bank_transfer", "other"] as const;
/** 카드 이름을 붙일 수 있는 결제수단 */
export const CARD_METHODS: readonly string[] = ["credit_card", "check_card"];
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
  cardName: string;
  reason: string;
  feeling: string;
  memo: string;
};

export type RecordField = keyof RecordDraft | "image";
/** 칸 → 도메인 오류 code */
export type RecordFieldErrors = Partial<Record<RecordField, string>>;

/** 저장 · 표시용 평범한 값 (테이블 records 한 행, 열 이름만 camelCase). 카테고리는 비어 있을 수 있다(K7) */
export type RecordData = {
  id: string;
  kind: RecordKind;
  amount: number;
  date: string;
  categoryId: string | null;
  title: string | null;
  paymentMethod: string | null;
  cardName: string | null;
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

const isExpense = (draft: RecordDraft): boolean => draft.kind === "expense";
/** 카드 이름은 지출이고 카드 결제일 때만 남긴다(앱 저장 규칙과 같음) */
const paysByCard = (draft: RecordDraft): boolean => isExpense(draft) && CARD_METHODS.includes(draft.paymentMethod);

// 엔티티: 지출 · 수입 · 상환 · 저축 기록 한 건. 구분 ↔ 카테고리 일치,
// 지출이 아니면 지출 전용 항목(결제수단 · 카드 이름 · 왜 썼나요 · 기분)을 비운다
export class RecordEntry {
  private constructor(private readonly data: RecordData) {}

  static isId(raw: string): boolean {
    return UUID.test(raw);
  }

  /** 칸별 검사. 브라우저(폼)와 서버(서비스)가 같이 쓴다. 사진 바이트를 주면 사진도 검사한다 */
  static check(draft: RecordDraft, clock: Clock, image?: Uint8Array | null): RecordFieldErrors {
    const expense = isExpense(draft);
    const checks: [RecordField, () => unknown][] = [
      ["kind", () => pick(KINDS, draft.kind, false)],
      ["amount", () => Amount.create(draft.amount)],
      ["date", () => RecordDate.create(draft.date, clock)],
      ["categoryId", () => CategoryCatalog.assert(draft.kind, draft.categoryId)],
      ["title", () => RecordTitle.create(draft.title)],
      ["memo", () => RecordMemo.create(draft.memo)],
      ["paymentMethod", () => expense && pick(PAYMENT_METHODS, draft.paymentMethod, true)],
      ["cardName", () => paysByCard(draft) && RecordCardName.create(draft.cardName)],
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
    return new RecordEntry({
      id,
      kind: draft.kind as RecordKind,
      amount: Amount.create(draft.amount).value,
      date: draft.date,
      categoryId: draft.categoryId || null,
      title: RecordTitle.create(draft.title).value,
      ...RecordEntry.expenseOnly(draft),
      memo: RecordMemo.create(draft.memo).value,
      imageKey: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** 지출 전용 항목. 지출이 아니면 모두 비우고, 카드 이름은 카드 결제일 때만 남긴다 */
  private static expenseOnly(draft: RecordDraft): Pick<RecordData, "paymentMethod" | "cardName" | "reason" | "feeling"> {
    const expense = isExpense(draft);
    return {
      paymentMethod: (expense && draft.paymentMethod) || null,
      cardName: paysByCard(draft) ? RecordCardName.create(draft.cardName).value : null,
      reason: (expense && draft.reason) || null,
      feeling: (expense && draft.feeling) || null,
    };
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
