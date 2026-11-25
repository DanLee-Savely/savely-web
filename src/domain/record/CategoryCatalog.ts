import { InvalidCategoryError } from "./errors";

// 값 · 순서는 앱 seed.dart, 서버 seed.ts와 같다 (80-record-assistant §4-2, 41종). 표시 이름은 content/app.content.ts
const EXPENSE = [
  "food", "cafe", "grocery", "convenience", "transport", "fuel", "parking", "car", "housing", "telecom", "shopping", "medical",
  "beauty", "health", "culture", "subscription", "education", "travel", "alcohol", "event", "pet", "baby", "insurance", "etc_expense",
] as const;
const INCOME = ["salary", "allowance", "side_income", "refund", "interest", "etc_income"] as const;
const TRANSFER = ["card_bill", "loan_payment", "interest_payment"] as const;
const SAVINGS = ["savings_deposit", "emergency_fund", "house_savings", "invest", "fund", "pension", "forex", "etc_savings"] as const;

export type CategoryId = (typeof EXPENSE)[number] | (typeof INCOME)[number] | (typeof TRANSFER)[number] | (typeof SAVINGS)[number];

const BY_KIND: Record<string, readonly CategoryId[]> = { expense: EXPENSE, income: INCOME, transfer: TRANSFER, savings: SAVINGS };

// 구분별 카테고리 목록. 구분과 카테고리가 맞는지는 DB가 아니라 여기서 검사한다
export class CategoryCatalog {
  static readonly expense: readonly CategoryId[] = EXPENSE;
  static readonly income: readonly CategoryId[] = INCOME;
  static readonly transfer: readonly CategoryId[] = TRANSFER;
  static readonly savings: readonly CategoryId[] = SAVINGS;
  static readonly all: readonly CategoryId[] = [...EXPENSE, ...INCOME, ...TRANSFER, ...SAVINGS];
  /** 지출 등록 화면에서 먼저 보여 줄 12개(제안 — 일상 지출 위주, 순서는 앱과 같게). 나머지는 「더보기」 */
  static readonly featured: readonly CategoryId[] = [
    "food", "cafe", "grocery", "convenience", "transport", "fuel", "shopping", "telecom", "subscription", "culture", "medical", "beauty",
  ];
  /** 카테고리를 고르지 않은 지출이 통계에서 합쳐지는 곳(앱 홈 · 리포트와 같음, 80-record-assistant K5) */
  static readonly uncategorizedExpense: CategoryId = "etc_expense";

  static of(kind: string): readonly CategoryId[] {
    return BY_KIND[kind] ?? [];
  }

  /** 카테고리는 선택 사항이다(빈칸 허용, 80-record-assistant K7). 골랐다면 구분과 맞아야 한다 */
  static assert(kind: string, id: string): void {
    if (id && !CategoryCatalog.of(kind).includes(id as CategoryId)) throw new InvalidCategoryError();
  }
}
