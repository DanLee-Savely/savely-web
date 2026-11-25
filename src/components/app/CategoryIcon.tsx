import {
  ArrowRightLeft, Baby, Banknote, Briefcase, Building, Bus, Car, ChartColumn, ChartLine, Coffee, CreditCard, Dumbbell, Ellipsis, Film,
  Fuel, Gift, GraduationCap, Hourglass, House, Landmark, type LucideIcon, PawPrint, Percent, PiggyBank, Plane, Receipt, Repeat,
  Scissors, Shield, ShoppingBag, ShoppingCart, Smartphone, SquareParking, Stethoscope, Store, Umbrella, Undo2, Utensils, Vault,
  Wallet, Wine,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 「기타」 3종(etc_expense · etc_income · etc_savings)은 목록에 두지 않는다 — 「…」로 나온다
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: Utensils, cafe: Coffee, grocery: ShoppingCart, convenience: Store, transport: Bus, fuel: Fuel, parking: SquareParking, car: Car,
  housing: House, telecom: Smartphone, shopping: ShoppingBag, medical: Stethoscope, beauty: Scissors, health: Dumbbell,
  culture: Film, subscription: Repeat, education: GraduationCap, travel: Plane, alcohol: Wine, event: Gift, pet: PawPrint,
  baby: Baby, insurance: Shield, salary: Banknote, allowance: Wallet, side_income: Briefcase, refund: Undo2, interest: PiggyBank,
  card_bill: CreditCard, loan_payment: Landmark, interest_payment: Percent,
  savings_deposit: Vault, emergency_fund: Umbrella, house_savings: Building, invest: ChartLine, fund: ChartColumn, pension: Hourglass,
  forex: ArrowRightLeft,
};

// 카테고리 동그라미 아이콘. 수입만 초록 바탕, 지출 · 상환 · 저축은 회색. 카테고리를 고르지 않은 기록은 영수증
export function CategoryIcon({ categoryId, income, className }: { categoryId: string | null; income?: boolean; className?: string }) {
  const Icon = categoryId ? (CATEGORY_ICONS[categoryId] ?? Ellipsis) : Receipt;
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        income ? "bg-sv-accent-tint-2 text-sv-accent" : "bg-sv-surface-2 text-sv-text-2",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
