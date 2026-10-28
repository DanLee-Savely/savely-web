import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Figma Button{Type, Size} — M: 45h · pad 12/20 · Label/13, L: 56h · pad 16/24 · Label/15
const variants = {
  primary: "bg-sv-accent text-sv-on-accent hover:bg-sv-accent-strong active:bg-sv-accent-deep",
  secondary: "bg-sv-surface-2 text-sv-text hover:bg-sv-surface-3",
};
const sizes = {
  m: "h-[45px] px-5 sv-text-label-13",
  l: "h-14 px-6 sv-text-label-15",
};

type AppButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function AppButton({ variant = "primary", size = "m", className, ...props }: AppButtonProps) {
  return (
    <Button
      className={cn("gap-2 rounded-sv-pill disabled:opacity-40", variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
