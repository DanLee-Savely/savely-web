import Image from "next/image";
import { logoLockup } from "@/assets";
import { cn } from "@/lib/utils";

// Logo{Type=Lockup} — 높이는 쓰는 곳에서 정한다 (GNB PC 36 · 모바일 28 · 메뉴 24)
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return <Image src={logoLockup} alt="세이블리" className={cn("w-auto", className)} priority={priority} />;
}
