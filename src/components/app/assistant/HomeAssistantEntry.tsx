"use client";

import { Info, Pencil, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { assistantContent } from "@/content/assistant.content";
import { useAssistantContext } from "./AssistantProvider";

const c = assistantContent;

// 홈 오른쪽 위의 주 버튼 「대화로 기록하기」(시안 57, 80 E1). 오늘 날짜로 패널을 연다.
// 직접 입력은 기록 탭의 「+ 기록하기」와 패널 머리줄 「직접 입력」으로 간다
export function AssistantOpenButton() {
  const { assistant, today } = useAssistantContext();
  return (
    <AppButton onClick={() => void assistant.open(today)}>
      <Sparkles aria-hidden className="size-4" />
      {c.launcher}
    </AppButton>
  );
}

// 홈 제목 아래의 한 줄 입력칸 · 예시 칩 · 전송 고지(시안 57, 80 E2 · E3).
// 보내면 패널을 열고, 그 문장을 패널에서 보낸 것과 똑같이 처리한다. 칩은 누르면 바로 보낸다 — 저장은 여전히 사용자가 누른다
export function HomeAssistantEntry() {
  const { assistant, today } = useAssistantContext();
  const [text, setText] = useState("");
  const busy = assistant.session?.busy ?? false;

  return (
    <div data-home-assistant className="mb-5 flex flex-col gap-3 rounded-sv-lg border border-sv-border-2 bg-sv-surface p-4">
      <form
        className="flex items-center gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (assistant.openWith(today, text)) setText("");
        }}
      >
        <label className="flex h-13 min-w-0 flex-1 items-center gap-2.5 rounded-sv-md border border-sv-accent bg-sv-surface px-4">
          <Sparkles aria-hidden className="size-5 shrink-0 text-sv-accent" />
          <input
            type="text"
            value={text}
            placeholder={c.inputHint}
            aria-label={c.title}
            autoComplete="off"
            enterKeyHint="send"
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent sv-text-body-15 text-sv-text outline-none placeholder:text-sv-text-3"
          />
        </label>
        <button
          type="submit"
          aria-label={c.send}
          disabled={busy || !text.trim()}
          className="flex size-13 shrink-0 items-center justify-center rounded-full bg-sv-accent text-sv-on-accent disabled:bg-sv-surface-3 disabled:text-sv-text-3"
        >
          <Send aria-hidden className="size-5" />
        </button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {c.homeChips.map((chip) => (
          <li key={chip}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void assistant.openWith(today, chip)}
              className="inline-flex h-9 items-center gap-1.5 rounded-sv-pill border border-sv-border-2 bg-sv-surface px-3.5 sv-text-support-13 text-sv-text hover:bg-sv-surface-2 disabled:opacity-60"
            >
              <Pencil aria-hidden className="size-3.5 text-sv-text-2" />
              {chip}
            </button>
          </li>
        ))}
      </ul>
      <p className="flex gap-1.5 sv-text-support-13 text-sv-text-3">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        {c.notice}
      </p>
    </div>
  );
}
