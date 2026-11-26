"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { RecordActionResult } from "@/app/app/records/actions";
import { AppButton } from "@/components/common/AppButton";
import { appContent } from "@/content/app.content";
import { assistantContent } from "@/content/assistant.content";
import { DomainError } from "@/domain/DomainError";
import { RecordDate } from "@/domain/record/RecordDate";
import type { RecordDraft } from "@/domain/record/RecordEntry";
import { clock } from "@/infrastructure/container";
import { AssistantConfirm } from "./assistant/AssistantConfirm";
import { useAssistantContext } from "./assistant/AssistantProvider";
import { PageHeader } from "./PageHeader";
import { RecordForm, type RecordFormHeaderState } from "./RecordForm";

const { form } = appContent;
const c = assistantContent;

// 등록 화면(§4-3): 머리말 + 폼. 머리말 오른쪽의 「대화로 적기」가 폼 상태를 봐야 해서 한 컴포넌트로 묶었다(시안 58, 80 E4)
export function NewRecordForm({ initial, today, action }: { initial: RecordDraft; today: string; action: (data: FormData) => Promise<RecordActionResult> }) {
  return (
    <RecordForm
      initial={initial}
      today={today}
      action={action}
      submitLabel={form.save}
      cancelHref="/app/records"
      header={(state) => <PageHeader back={{ href: "/app/records", label: form.backToList }} title={form.createTitle} actions={<ChatLink {...state} />} />}
    />
  );
}

// 「대화로 적기」(앱 직접 입력 화면의 같은 버튼): 폼의 날짜로 대화 패널을 연다.
// 적던 값이 있으면 버릴지 먼저 묻고, 「나가기」를 누르면 폼을 비운 뒤 연다 — 화면은 그대로 둔다
function ChatLink({ dirty, date, locked, discard }: RecordFormHeaderState) {
  const { assistant, today } = useAssistantContext();
  const [asking, setAsking] = useState(false);
  const go = () => {
    setAsking(false);
    discard();
    // 폼의 날짜가 비었거나 받을 수 없는 날짜면 오늘로 연다
    void assistant.open(DomainError.codeOf(() => RecordDate.create(date, clock)) === null ? date : today);
  };

  return (
    <>
      <AppButton variant="outline" disabled={locked} className="text-sv-accent" onClick={() => (dirty ? setAsking(true) : go())}>
        <Sparkles aria-hidden className="size-4" />
        {c.formLink}
      </AppButton>
      <AssistantConfirm open={asking} title={c.confirmDiscard.title} lines={[c.confirmDiscard.desc]} labels={c.confirmDiscard} danger onCancel={() => setAsking(false)} onConfirm={go} />
    </>
  );
}
