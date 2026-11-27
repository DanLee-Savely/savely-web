"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { assistantContent } from "@/content/assistant.content";
import { DomainError } from "@/domain/DomainError";
import { RecordDate } from "@/domain/record/RecordDate";
import { clock } from "@/infrastructure/container";
import { ASSISTANT_CHAT_PARAM } from "@/lib/assistantLink";
import { useAssistantContext } from "./AssistantProvider";
import { AssistantPanel } from "./AssistantPanel";

// 「대화로 기록하기」 — /app 화면 오른쪽 아래의 떠 있는 버튼(시안 21)과 대화 패널.
// 화면 날짜는 오늘이다. 달력에서 날짜를 고른 상태(?date=)로 열면 그 날짜다(80 U-W5)
// 홈에는 떠 있는 버튼을 두지 않는다 — 오른쪽 위에 같은 이름의 버튼이 있다(80 E1)
export function AssistantRoot() {
  const { assistant, today } = useAssistantContext();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const date = params.get("date");
  const picked = pathname === "/app/calendar" && date !== null && DomainError.codeOf(() => RecordDate.create(date, clock)) === null;
  const home = pathname === "/app";
  const asked = home && params.get(ASSISTANT_CHAT_PARAM) === "1";
  const { open } = assistant;
  const opened = useRef(false);

  // `/app?chat=1`로 들어오면 패널을 연다(80 E5). 연 뒤에는 주소에서 chat을 지운다 — 새로고침으로 다시 열리지 않게
  useEffect(() => {
    if (!asked) {
      opened.current = false;
      return;
    }
    if (opened.current) return;
    opened.current = true;
    void open(today, "deeplink");
    router.replace("/app", { scroll: false });
  }, [asked, open, today, router]);

  if (assistant.session) return <AssistantPanel assistant={assistant} session={assistant.session} />;
  if (home) return null;
  return (
    <button
      type="button"
      onClick={() => void assistant.open(picked ? date : today, "floating_button")}
      className="fixed right-10 bottom-10 z-40 inline-flex h-13 items-center gap-2 rounded-sv-pill bg-sv-text px-5 sv-text-label-15 text-sv-surface shadow-sv-floating-cta hover:opacity-90"
    >
      <MessageCircle aria-hidden className="size-5" />
      {assistantContent.launcher}
    </button>
  );
}
