import { CircleAlert } from "lucide-react";
import { appContent } from "@/content/app.content";

// N1 공개 체험 안내 띠 — /app 모든 화면 위 (70-mvp-records §1-4)
export function NoticeBand() {
  return (
    <p role="note" className="flex items-center gap-2.5 rounded-sv-md bg-[var(--sv-warning-tint)] px-4 py-3 sv-text-support-13 text-sv-text">
      <CircleAlert aria-hidden className="size-4 shrink-0 text-[var(--sv-warning)]" />
      {appContent.notice}
    </p>
  );
}
