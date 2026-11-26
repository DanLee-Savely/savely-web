import type { DraftValidator } from "@/domain/assistant/DraftValidator";
import { DomainError } from "@/domain/DomainError";
import { Amount } from "@/domain/record/Amount";
import { CARD_METHODS } from "@/domain/record/RecordEntry";
import { RecordMemo } from "@/domain/record/RecordText";
import type { DraftCard } from "./AssistantSession";

/** 수정 시트의 칸 값(문자열). 빈 선택은 "" — 날짜가 비면 화면 날짜로 저장한다 */
export type DraftEditValues = {
  kind: string;
  amount: string;
  date: string;
  categoryId: string;
  title: string;
  paymentMethod: string;
  cardName: string;
  memo: string;
};

// 초안 카드 수정 시트의 상태 (앱 record_draft_edit_sheet에서 옮김). 불변 — 바꿀 때마다 새 객체.
// 「적용」은 공통 검증기를 거친다. 이유 · 기분은 시트에 없다(카드 위 칩으로 고른다, 80 K1)
export class DraftEditFlow {
  private constructor(readonly values: DraftEditValues) {}

  static of(card: DraftCard): DraftEditFlow {
    return new DraftEditFlow({
      kind: card.kind, amount: card.amount.toLocaleString("ko-KR"), date: card.date ?? "", categoryId: card.categoryId ?? "", title: card.title ?? "",
      paymentMethod: card.paymentMethod ?? "", cardName: card.cardName ?? "", memo: card.memo ?? "",
    });
  }

  get expense(): boolean {
    return this.values.kind === "expense";
  }

  /** 「카드 이름」 칸은 체크카드 · 신용카드일 때만 보인다(K12) */
  get byCard(): boolean {
    return this.expense && CARD_METHODS.includes(this.values.paymentMethod);
  }

  /** 금액이 1원 ~ 1조 원 미만이고 메모가 200자 안일 때만 적용할 수 있다 */
  get canApply(): boolean {
    return DomainError.codeOf(() => Amount.create(this.values.amount)) === null && DomainError.codeOf(() => RecordMemo.create(this.values.memo)) === null;
  }

  set(field: keyof DraftEditValues, value: string): DraftEditFlow {
    return new DraftEditFlow({ ...this.values, [field]: value });
  }

  /** 종류를 바꾸면 카테고리 선택이 풀리고, 지출이 아니면 결제수단 · 카드 이름을 비운다 */
  setKind(kind: string): DraftEditFlow {
    if (kind === this.values.kind) return this;
    const cleared = kind !== "expense" ? { paymentMethod: "", cardName: "" } : {};
    return new DraftEditFlow({ ...this.values, ...cleared, kind, categoryId: "" });
  }

  /** 검증기를 통과한 값으로 바꿀 칸들. 적용할 수 없으면 null. 지출이 아니게 되면 이유 · 기분도 지운다 */
  apply(validator: DraftValidator, card: DraftCard): Partial<DraftCard> | null {
    if (!this.canApply) return null;
    const v = this.values;
    const checked = validator.validateOne({
      kind: v.kind as DraftCard["kind"], amount: Amount.create(v.amount).value, categoryId: v.categoryId || null, title: v.title || null,
      paymentMethod: v.paymentMethod || null, cardName: v.cardName || null, date: v.date || null,
    });
    if (!checked) return null;
    const keep = checked.kind === "expense";
    return { ...checked, memo: RecordMemo.create(v.memo).value, reason: keep ? card.reason : null, feeling: keep ? card.feeling : null };
  }
}
