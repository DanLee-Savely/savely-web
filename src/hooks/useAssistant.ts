"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { interpretSentence, type InterpretResponse, saveDrafts, type SaveResponse } from "@/app/app/assistant/actions";
import type { DraftSaveItem } from "@/application/assistant/SaveDraftsService";
import { DRAFT_LIMITS } from "@/domain/assistant/DraftValidator";
import { AssistantSession, type DraftCard } from "@/interaction/AssistantSession";

const toItem = (c: DraftCard): DraftSaveItem => ({
  id: c.id, kind: c.kind, amount: c.amount, date: c.date, categoryId: c.categoryId, title: c.title, paymentMethod: c.paymentMethod,
  cardName: c.cardName, reason: c.reason, feeling: c.feeling, memo: c.memo,
});

// AssistantSession을 대화 패널에 연결하는 얇은 어댑터. 문장 해석 · 저장은 Server Action이 한다.
// session이 null이면 패널이 닫힌 것이다. 닫으면 대화 내역은 사라진다(어디에도 저장하지 않는다)
export function useAssistant(today: string) {
  const router = useRouter();
  const [session, setSession] = useState<AssistantSession | null>(null);
  const [input, setInput] = useState("");
  /** 저장 실패 안내(code). 다음 동작에서 지운다 */
  const [saveError, setSaveError] = useState<"RATE_LIMITED" | "SAVE_FAILED" | null>(null);
  const change = (fn: (s: AssistantSession) => AssistantSession) => setSession((s) => s && fn(s));

  const send = async () => {
    if (!session) return;
    const sent = session.send(input);
    if (sent === session) return;
    const text = input.trim();
    setSession(sent);
    setInput("");
    setSaveError(null);
    // 서버에 닿지 못한 경우(오프라인 등)도 「지금은 정리하지 못했어요」로 알린다
    const res = await interpretSentence(text).catch((): InterpretResponse => ({ ok: false, failure: "failed" }));
    change((s) => (res.ok ? s.receive(res.result, () => crypto.randomUUID()) : s.failed(res.failure)));
    // 카드가 안 나왔으면 고쳐 쓰기 쉽게 문장을 입력칸에 되돌린다
    const made = res.ok && res.result.drafts.length > 0 && sent.pending.length < DRAFT_LIMITS.maxDrafts;
    if (!made) setInput((now) => now || text);
  };

  const save = async () => {
    if (!session) return;
    const saving = session.beginSaving();
    if (saving === session) return;
    setSession(saving);
    setSaveError(null);
    const res = await saveDrafts(saving.pending.map(toItem), saving.screenDate).catch((): SaveResponse => ({ ok: false, error: "SERVER_ERROR" }));
    if (res.ok) {
      change((s) => s.markSaved({ count: res.count, days: res.days, dayExpense: res.dayExpense }));
      router.refresh(); // 뒤 화면(홈 · 목록 · 달력 · 리포트)에 방금 저장한 기록을 반영한다
    } else {
      change((s) => s.saveFailed());
      setSaveError(res.error === "RATE_LIMITED" ? "RATE_LIMITED" : "SAVE_FAILED");
    }
  };

  return {
    session,
    input,
    setInput,
    saveError,
    open: (screenDate: string) => setSession(AssistantSession.start(screenDate, today)),
    close: () => {
      setSession(null);
      setInput("");
      setSaveError(null);
    },
    send,
    save,
    change,
  };
}

export type Assistant = ReturnType<typeof useAssistant>;
