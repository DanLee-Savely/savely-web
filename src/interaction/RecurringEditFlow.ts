import { DomainError } from "@/domain/DomainError";
import { Amount } from "@/domain/record/Amount";
import { RECURRING_LIMITS } from "@/domain/recurring/RecurringRules";
import type { RecurringInput } from "@/domain/recurring/RecurringItem";

/** 고정지출 수정 시트의 칸 값(문자열). 나가는 날은 1~31, 비면 "" */
export type RecurringEditValues = { kind: string; title: string; amount: string; day: string; categoryId: string; paymentMethod: string };
type Source = { kind: string; title: string | null; amount: number; dayOfMonth: number | null; categoryId: string | null; paymentMethod: string | null; cardName: string | null };

// 고정지출 수정 시트의 상태 (앱 recurring_item_edit_sheet에서 옮김). 불변 — 바꿀 때마다 새 객체.
// 등록 전의 카드와 등록한 항목이 같은 시트를 쓴다. 한도 검사는 서버의 검증기가 다시 한다
export class RecurringEditFlow {
  private constructor(
    readonly values: RecurringEditValues,
    private readonly cardName: string | null,
  ) {}

  static of(source: Source): RecurringEditFlow {
    return new RecurringEditFlow(
      { kind: source.kind, title: source.title ?? "", amount: source.amount.toLocaleString("ko-KR"), day: source.dayOfMonth === null ? "" : String(source.dayOfMonth), categoryId: source.categoryId ?? "", paymentMethod: source.paymentMethod ?? "" },
      source.cardName,
    );
  }

  get expense(): boolean {
    return this.values.kind === "expense";
  }

  get day(): number | null {
    const day = Number(this.values.day);
    return this.values.day !== "" && Number.isInteger(day) && day >= RECURRING_LIMITS.minDay && day <= RECURRING_LIMITS.maxDay ? day : null;
  }

  /** 이름 · 금액 · 나가는 날이 모두 있어야 적용할 수 있다 */
  get canApply(): boolean {
    return this.values.title.trim() !== "" && this.day !== null && DomainError.codeOf(() => Amount.create(this.values.amount)) === null;
  }

  set(field: keyof RecurringEditValues, value: string): RecurringEditFlow {
    return new RecurringEditFlow({ ...this.values, [field]: value }, this.cardName);
  }

  /** 나가는 날: 숫자 두 자리까지만 */
  setDay(raw: string): RecurringEditFlow {
    return this.set("day", raw.replace(/\D/g, "").slice(0, 2));
  }

  /** 종류를 바꾸면 카테고리 선택이 풀리고, 지출이 아니면 결제수단을 비운다 */
  setKind(kind: string): RecurringEditFlow {
    if (kind === this.values.kind) return this;
    return new RecurringEditFlow({ ...this.values, kind, categoryId: "", paymentMethod: kind === "expense" ? this.values.paymentMethod : "" }, this.cardName);
  }

  /** 저장할 값. 적용할 수 없으면 null */
  toInput(): RecurringInput | null {
    if (!this.canApply) return null;
    const v = this.values;
    return {
      kind: v.kind, amount: Amount.create(v.amount).value, dayOfMonth: this.day!, title: v.title.trim(), categoryId: v.categoryId || null,
      paymentMethod: (this.expense && v.paymentMethod) || null, cardName: this.expense ? this.cardName : null,
    };
  }
}
