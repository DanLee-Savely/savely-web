"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { assistantContent } from "@/content/assistant.content";
import { DomainError } from "@/domain/DomainError";
import { RecordDate } from "@/domain/record/RecordDate";
import { useAssistant } from "@/hooks/useAssistant";
import { clock } from "@/infrastructure/container";
import { AssistantPanel } from "./AssistantPanel";

// 「대화로 기록하기」 — 모든 /app 화면 오른쪽 아래의 떠 있는 버튼(시안 21)과 대화 패널.
// 화면 날짜는 오늘이다. 달력에서 날짜를 고른 상태(?date=)로 열면 그 날짜다(80 U-W5)
export function AssistantRoot({ today }: { today: string }) {
  const assistant = useAssistant(today);
  const pathname = usePathname();
  const date = useSearchParams().get("date");
  const picked = pathname === "/app/calendar" && date !== null && DomainError.codeOf(() => RecordDate.create(date, clock)) === null;

  if (assistant.session) return <AssistantPanel assistant={assistant} session={assistant.session} />;
  return (
    <button
      type="button"
      onClick={() => void assistant.open(picked ? date : today)}
      className="fixed right-10 bottom-10 z-40 inline-flex h-13 items-center gap-2 rounded-sv-pill bg-sv-text px-5 sv-text-label-15 text-sv-surface shadow-sv-floating-cta hover:opacity-90"
    >
      <MessageCircle aria-hidden className="size-5" />
      {assistantContent.launcher}
    </button>
  );
}
