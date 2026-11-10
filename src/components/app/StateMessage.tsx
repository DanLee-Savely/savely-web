import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StateMessageProps = { icon: LucideIcon; title: string; desc?: string; tone?: "default" | "danger"; action?: ReactNode; className?: string };

// 빈 상태 · 오류 상태 · 없는 기록 안내 공통: 동그라미 아이콘 · 제목 · 설명 · 버튼
export function StateMessage({ icon: Icon, title, desc, tone = "default", action, className }: StateMessageProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-24 text-center", className)}>
      <span className="mb-2 flex size-18 items-center justify-center rounded-full bg-sv-surface-2">
        <Icon aria-hidden className={cn("size-7", tone === "danger" ? "text-sv-danger" : "text-sv-text-2")} />
      </span>
      <p className="sv-text-title-section-20 text-sv-text">{title}</p>
      {desc && <p className="sv-text-body-15 text-sv-text-2">{desc}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
