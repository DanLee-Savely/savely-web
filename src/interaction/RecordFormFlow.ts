import type { Clock } from "@/domain/record/Clock";
import { type RecordDraft, RecordEntry, type RecordField, type RecordFieldErrors } from "@/domain/record/RecordEntry";

export type RecordFormStatus = "idle" | "editing" | "submitting" | "done" | "error";

// 첫 오류 칸을 찾는 순서 = 화면 순서(왼쪽 열 → 오른쪽 열 → 사진)
const FIELD_ORDER: RecordField[] = [
  "kind", "amount", "date", "title", "memo", "categoryId", "paymentMethod", "reason", "feeling", "image",
];
const EXPENSE_ONLY = ["paymentMethod", "reason", "feeling"] as const;

export const emptyDraft = (date: string): RecordDraft => ({
  kind: "expense", amount: "", date, categoryId: "", title: "", paymentMethod: "", reason: "", feeling: "", memo: "",
});

// 기록 폼(등록 · 수정) 상태: idle → editing → submitting → done / error. 칸별 오류(도메인 code)와 폼 위 오류를 보관한다
// 불변 — 바꿀 때마다 새 객체
export class RecordFormFlow {
  constructor(
    readonly draft: RecordDraft,
    readonly status: RecordFormStatus = "idle",
    readonly errors: RecordFieldErrors = {},
    readonly formError: string | null = null,
  ) {}

  get locked(): boolean {
    return this.status === "submitting" || this.status === "done";
  }

  get firstErrorField(): RecordField | null {
    return FIELD_ORDER.find((f) => this.errors[f]) ?? null;
  }

  /** 한 칸 수정: 그 칸의 오류만 지운다 */
  set(field: keyof RecordDraft, value: string): RecordFormFlow {
    if (this.locked) return this;
    return this.next({ ...this.draft, [field]: value }, this.without(field));
  }

  /** 구분 바꾸기: 카테고리 선택을 풀고, 수입이면 지출 전용 칸 값을 비운다 (§4-3) */
  setKind(kind: string): RecordFormFlow {
    if (this.locked || kind === this.draft.kind) return this;
    const cleared = kind === "income" ? Object.fromEntries(EXPENSE_ONLY.map((f) => [f, ""])) : {};
    return this.next({ ...this.draft, ...cleared, kind, categoryId: "" }, this.without("kind", "categoryId", ...EXPENSE_ONLY));
  }

  /** 사진을 고를 때: 오류 code가 있으면 표시, 없으면 사진 오류를 지운다 */
  pickImage(errorCode: string | null): RecordFormFlow {
    if (this.locked) return this;
    return this.next(this.draft, { ...this.without("image"), ...(errorCode && { image: errorCode }) });
  }

  /** 브라우저 검사 → 통과하면 저장 중(잠금), 아니면 칸별 오류. 고른 사진의 오류는 사진이 빠진 채라 저장을 막지 않는다 */
  submit(clock: Clock): RecordFormFlow {
    if (this.locked) return this;
    const errors = RecordEntry.check(this.draft, clock);
    return Object.keys(errors).length
      ? new RecordFormFlow(this.draft, "error", errors)
      : new RecordFormFlow(this.draft, "submitting");
  }

  succeed(): RecordFormFlow {
    return this.status === "submitting" ? new RecordFormFlow(this.draft, "done") : this;
  }

  /** 서버 오류: 칸별 오류 또는 폼 위 오류(code). 입력값은 그대로 둔다 */
  fail(errors: RecordFieldErrors, formError: string | null = null): RecordFormFlow {
    return this.status === "submitting" ? new RecordFormFlow(this.draft, "error", errors, formError) : this;
  }

  private next(draft: RecordDraft, errors: RecordFieldErrors): RecordFormFlow {
    return new RecordFormFlow(draft, "editing", errors, this.formError);
  }

  private without(...fields: RecordField[]): RecordFieldErrors {
    return Object.fromEntries(Object.entries(this.errors).filter(([f]) => !fields.includes(f as RecordField)));
  }
}
