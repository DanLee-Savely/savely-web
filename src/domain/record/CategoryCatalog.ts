import { InvalidCategoryError } from "./errors";

// 값은 앱 record.dart · seed.dart, 서버 schema.prisma와 같다 (70-mvp-records §6-3). 표시 이름은 content/app.content.ts
const EXPENSE = [
  "food", "cafe", "grocery", "transport", "fuel", "parking", "car", "housing", "telecom", "shopping", "medical", "beauty",
  "health", "culture", "subscription", "education", "travel", "alcohol", "event", "pet", "baby", "insurance", "etc_expense",
] as const;
const INCOME = ["salary", "allowance", "side_income", "refund", "interest", "etc_income"] as const;

export type CategoryId = (typeof EXPENSE)[number] | (typeof INCOME)[number];

// 구분별 카테고리 목록. 구분과 카테고리가 맞는지는 DB가 아니라 여기서 검사한다
export class CategoryCatalog {
  static readonly expense: readonly CategoryId[] = EXPENSE;
  static readonly income: readonly CategoryId[] = INCOME;
  /** 지출 등록 화면에서 먼저 보여 줄 11개(제안 — 일상 지출 위주). 나머지는 「더보기」 */
  static readonly featured: readonly CategoryId[] = [
    "food", "cafe", "grocery", "transport", "fuel", "shopping", "telecom", "subscription", "culture", "medical", "beauty",
  ];

  static of(kind: string): readonly CategoryId[] {
    return kind === "income" ? INCOME : kind === "expense" ? EXPENSE : [];
  }

  static assert(kind: string, id: string): void {
    if (!CategoryCatalog.of(kind).includes(id as CategoryId)) throw new InvalidCategoryError();
  }
}
