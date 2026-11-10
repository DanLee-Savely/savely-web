import {
  Baby, Banknote, Briefcase, Bus, Car, Coffee, Dumbbell, Ellipsis, Film, Fuel, Gift, GraduationCap, House, type LucideIcon,
  PawPrint, PiggyBank, Plane, Repeat, Scissors, Shield, ShoppingBag, ShoppingCart, Smartphone, SquareParking, Stethoscope,
  Undo2, Utensils, Wallet, Wine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  food: Utensils, cafe: Coffee, grocery: ShoppingCart, transport: Bus, fuel: Fuel, parking: SquareParking, car: Car,
  housing: House, telecom: Smartphone, shopping: ShoppingBag, medical: Stethoscope, beauty: Scissors, health: Dumbbell,
  culture: Film, subscription: Repeat, education: GraduationCap, travel: Plane, alcohol: Wine, event: Gift, pet: PawPrint,
  baby: Baby, insurance: Shield, salary: Banknote, allowance: Wallet, side_income: Briefcase, refund: Undo2, interest: PiggyBank,
};

// 카테고리 동그라미 아이콘. 수입은 초록 바탕
export function CategoryIcon({ categoryId, income, className }: { categoryId: string; income?: boolean; className?: string }) {
  const Icon = ICONS[categoryId] ?? Ellipsis;
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
