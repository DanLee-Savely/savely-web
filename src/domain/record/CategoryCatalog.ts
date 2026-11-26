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

// 표시 이름(앱 seed.dart와 같다). 화면 문구(content/app.content.ts) · OpenAI에 주는 목록 · 추가 기능 계산이 함께 쓴다
const NAMES: Record<CategoryId, string> = {
  food: "식비", cafe: "카페", grocery: "마트·생필품", convenience: "편의점", transport: "교통", fuel: "주유", parking: "주차·통행료",
  car: "차량 정비", housing: "주거·관리비", telecom: "통신", shopping: "쇼핑", medical: "병원비", beauty: "미용",
  health: "건강·운동", culture: "문화·여가", subscription: "구독", education: "교육", travel: "여행", alcohol: "술·유흥",
  event: "경조사", pet: "반려동물", baby: "육아", insurance: "보험", etc_expense: "기타",
  salary: "급여", allowance: "용돈", side_income: "부수입", refund: "환급", interest: "이자수익", etc_income: "기타",
  card_bill: "카드값 상환", loan_payment: "대출 상환", interest_payment: "이자 납입",
  savings_deposit: "예적금", emergency_fund: "비상금", house_savings: "청약", invest: "ETF·주식", fund: "펀드", pension: "연금",
  forex: "외화", etc_savings: "기타 저축",
};

const BY_KIND: Record<string, readonly CategoryId[]> = { expense: EXPENSE, income: INCOME, transfer: TRANSFER, savings: SAVINGS };

// 구분별 카테고리 목록. 구분과 카테고리가 맞는지는 DB가 아니라 여기서 검사한다
export class CategoryCatalog {
  static readonly expense: readonly CategoryId[] = EXPENSE;
  static readonly income: readonly CategoryId[] = INCOME;
  static readonly transfer: readonly CategoryId[] = TRANSFER;
  static readonly savings: readonly CategoryId[] = SAVINGS;
  static readonly all: readonly CategoryId[] = [...EXPENSE, ...INCOME, ...TRANSFER, ...SAVINGS];
  /** 카테고리 id → 표시 이름 */
  static readonly names: Readonly<Record<string, string>> = NAMES;
  /** 지출 등록 화면에서 먼저 보여 줄 12개(제안 — 일상 지출 위주, 순서는 앱과 같게). 나머지는 「더보기」 */
  static readonly featured: readonly CategoryId[] = [
    "food", "cafe", "grocery", "convenience", "transport", "fuel", "shopping", "telecom", "subscription", "culture", "medical", "beauty",
  ];
  /** 카테고리를 고르지 않은 지출이 통계에서 합쳐지는 곳(앱 홈 · 리포트와 같음, 80-record-assistant K5) */
  static readonly uncategorizedExpense: CategoryId = "etc_expense";

  static of(kind: string): readonly CategoryId[] {
    return BY_KIND[kind] ?? [];
  }

  /** 카테고리가 속한 구분. 없는 카테고리면 null */
  static kindOf(id: string): string | null {
    return Object.keys(BY_KIND).find((kind) => BY_KIND[kind].includes(id as CategoryId)) ?? null;
  }

  /** 카테고리는 선택 사항이다(빈칸 허용, 80-record-assistant K7). 골랐다면 구분과 맞아야 한다 */
  static assert(kind: string, id: string): void {
    if (id && !CategoryCatalog.of(kind).includes(id as CategoryId)) throw new InvalidCategoryError();
  }
}
