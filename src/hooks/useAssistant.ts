"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { interpretSentence, type InterpretResponse, loadAssistantEntry, registerCard, registerRecurring, removeRecurring, saveDrafts, type SaveResponse, updateRecurring, type WriteError } from "@/app/app/assistant/actions";
import type { AssistantEntry } from "@/application/assistant/GetAssistantEntryService";
import type { DraftSaveItem } from "@/application/assistant/SaveDraftsService";
import { assistantContent } from "@/content/assistant.content";
import type { FrequentItem } from "@/domain/assistant/AssistantInsights";
import { DRAFT_LIMITS, DraftValidator } from "@/domain/assistant/DraftValidator";
import { type RecurringDue, type RecurringInput, RecurringItem } from "@/domain/recurring/RecurringItem";
import { clock } from "@/infrastructure/container";
import { AssistantSession, type DraftCard, type EntryBlock, type RecurringCard } from "@/interaction/AssistantSession";
import { assistantPrefs } from "@/lib/assistantPrefs";

const c = assistantContent;
const validator = new DraftValidator(clock);
const newId = () => crypto.randomUUID();
const failed = (): WriteError => ({ ok: false, error: "SERVER_ERROR" });
const toItem = (card: DraftCard): DraftSaveItem => ({
  id: card.id, kind: card.kind, amount: card.amount, date: card.date, categoryId: card.categoryId, title: card.title, paymentMethod: card.paymentMethod,
  cardName: card.cardName, reason: card.reason, feeling: card.feeling, memo: card.memo,
});

/**
 * 들어왔을 때 먼저 말을 거는 블록 — 하나만 보여 준다(80 §9, 앱 §2-4).
 * ① 채우지 않은 기록 → ② 나가는 날이 된 고정지출 → ③ 고정지출 최초 질문(방문자당 한 번) → 없으면 첫 안내.
 * 「한 번만 묻기」 · 「이번 달은 아니에요」 · 「나중에 할게요」는 방문자별로 브라우저에 둔다(K13 · K14)
 */
const pickEntry = (entry: AssistantEntry): EntryBlock | null => {
  if (entry.unfilled.total > 0 && !assistantPrefs.unfilledDismissed()) return { type: "unfilled", unfilled: entry.unfilled };
  const due = entry.due.filter((d) => !assistantPrefs.isSkipped(d.item.id, d.dueDate.slice(0, 7)));
  if (due.length) return { type: "recurringDue", queue: due };
  if (assistantPrefs.recurringAsked()) return null;
  // 한 번 보였으면 물은 것이다 — 답하지 않고 나가도 다시 묻지 않는다
  assistantPrefs.markRecurringAsked();
  return { type: "recurringAsk", candidates: entry.candidates };
};

// AssistantSession을 대화 패널에 연결하는 얇은 어댑터. 문장 해석 · 저장 · 등록은 Server Action이 한다.
// session이 null이면 패널이 닫힌 것이다. 닫으면 대화 내역은 사라진다(어디에도 저장하지 않는다)
export function useAssistant(today: string) {
  const router = useRouter();
  const [session, setSession] = useState<AssistantSession | null>(null);
  const [input, setInput] = useState("");
  /** 자주 적는 항목 칩 — 들어올 때 한 번만 계산한다(머무는 동안 칩이 바뀌면 누르려던 자리에 다른 칩이 와 있게 된다) */
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);
  /** 저장 · 등록 실패 안내(code). 다음 동작에서 지운다 */
  const [error, setError] = useState<"RATE_LIMITED" | "SAVE_FAILED" | "WRITE_FAILED" | null>(null);
  const change = (fn: (s: AssistantSession) => AssistantSession) => setSession((s) => s && fn(s));
  const writeFailed = (res: WriteError) => setError(res.error === "RATE_LIMITED" ? "RATE_LIMITED" : "WRITE_FAILED");

  const open = async (screenDate: string) => {
    setSession(AssistantSession.start(screenDate, today));
    setFrequent([]);
    setError(null);
    // 칩과 진입 블록은 권유일 뿐이다 — 못 읽으면 첫 안내 그대로 연다
    const entry = await loadAssistantEntry(screenDate).catch(() => null);
    if (!entry) return;
    setFrequent(entry.frequent);
    const block = pickEntry(entry);
    if (block) change((s) => s.showEntry(block));
  };

  const send = async () => {
    if (!session) return;
    const sent = session.send(input);
    if (sent === session) return;
    const text = input.trim();
    setSession(sent);
    setInput("");
    setError(null);
    // 서버에 닿지 못한 경우(오프라인 등)도 「지금은 정리하지 못했어요」로 알린다
    const res = await interpretSentence(text, sent.screenDate, sent.askingRecurring).catch((): InterpretResponse => ({ ok: false, failure: "failed" }));
    change((s) => (res.ok ? s.receiveOutcome(res.outcome, newId) : s.failed(res.failure)));
    // 기록 문장인데 카드가 안 나왔으면 고쳐 쓰기 쉽게 문장을 입력칸에 되돌린다
    // 답하지 않은 질문(알아듣지 못한 낱말 · 미래)도 같다
    const made = res.ok && (res.outcome.type === "query" ? res.outcome.reply.status === "answered" : res.outcome.type !== "drafts" || (res.outcome.result.drafts.length > 0 && sent.pending.length < DRAFT_LIMITS.maxDrafts));
    if (!made) setInput((now) => now || text);
  };

  const save = async () => {
    if (!session) return;
    const saving = session.beginSaving();
    if (saving === session) return;
    setSession(saving);
    setError(null);
    const res = await saveDrafts(saving.pending.map(toItem), saving.screenDate).catch((): SaveResponse => ({ ok: false, error: "SERVER_ERROR" }));
    if (res.ok) {
      change((s) => s.markSaved({ count: res.count, days: res.days, dayExpense: res.dayExpense }));
      router.refresh(); // 뒤 화면(홈 · 목록 · 달력 · 리포트)에 방금 저장한 기록을 반영한다
    } else {
      change((s) => s.saveFailed());
      setError(res.error === "RATE_LIMITED" ? "RATE_LIMITED" : "SAVE_FAILED");
    }
  };

  /** 고정지출의 「기록할게요」 · 「금액이 달라요」 — 초안 카드를 만든다(저장은 사용자가 따로 누른다). 만든 카드 번호, 못 만들었으면 null */
  const recordDue = (due: RecurringDue): string | null => {
    // 나가는 날이 지난 항목은 그 날짜의 카드로 만든다 — 화면 날짜에 잡히지 않게
    const draft = validator.validateOne(RecurringItem.draftOf(due.item, due.isToday ? null : due.dueDate));
    if (!session || !draft) return null;
    // 20건이 차서 카드를 못 만들면 질문을 그대로 둔다
    if (session.pending.length >= DRAFT_LIMITS.maxDrafts) {
      change((s) => s.addDraft(draft, newId));
      return null;
    }
    const id = newId();
    change((s) => s.addDraft(draft, () => id).answerDue());
    return id;
  };

  const submitCard = async (id: string, name: string, method: string) => {
    setError(null);
    const res = await registerCard(name, method).catch(failed);
    if (!res.ok) return writeFailed(res);
    const text = { duplicate: c.cardDraft.duplicate, limit: c.cardDraft.limit, invalid: c.cardDraft.nameTooLong };
    change((s) => (res.outcome === "saved" ? s.cardRegistered(id) : s.note(text[res.outcome])));
  };

  const submitRecurring = async (card: RecurringCard) => {
    if (card.registered || card.dayOfMonth === null || !card.title?.trim()) return;
    setError(null);
    const { id, dayOfMonth } = card;
    const res = await registerRecurring({ ...card, title: card.title }).catch(failed);
    if (!res.ok) return writeFailed(res);
    const text = { duplicate: c.recurring.duplicate, limit: c.recurring.limit, invalid: c.invalidAmount };
    const { outcome } = res.result;
    change((s) => (outcome === "saved" ? s.recurringRegistered(id, dayOfMonth).refreshRecurring(res.items) : s.note(text[outcome])));
  };

  const editRecurring = async (id: string, input: RecurringInput) => {
    setError(null);
    const res = await updateRecurring(id, input).catch(failed);
    if (!res.ok) return writeFailed(res);
    const { outcome } = res.result;
    change((s) => (outcome === "duplicate" ? s.note(c.recurring.duplicate) : s).refreshRecurring(res.items));
  };

  const deleteRecurring = async (id: string) => {
    setError(null);
    const res = await removeRecurring(id).catch(failed);
    if (!res.ok) return writeFailed(res);
    change((s) => s.recurringRemoved(id).refreshRecurring(res.items));
  };

  return {
    session,
    input,
    setInput,
    frequent,
    error,
    open,
    close: () => {
      setSession(null);
      setInput("");
      setError(null);
    },
    send,
    save,
    change,
    /** 「자주 적는 항목」 칩 — 초안 카드가 한 장 생긴다 */
    addFrequent: (item: FrequentItem) => change((s) => s.addDraft(item.draft, newId)),
    /** 채우지 않은 기록의 「나중에 할게요」 — 이 탭에서는 다시 알리지 않는다 */
    dismissUnfilled: () => {
      assistantPrefs.dismissUnfilled();
      change((s) => s.closeEntry());
    },
    pickCandidate: (index: number) => change((s) => s.pickCandidate(index, newId)),
    closeRecurringAsk: () => change((s) => s.closeEntry(c.recurring.askLater)),
    recordDue,
    /** 「이번 달은 아니에요」 — 이 달에는 이 방문자에게 다시 묻지 않는다 */
    skipDue: (due: RecurringDue) => {
      assistantPrefs.skip(due.item.id, due.dueDate.slice(0, 7));
      change((s) => s.answerDue());
    },
    submitCard,
    submitRecurring,
    editRecurring,
    deleteRecurring,
  };
}

export type Assistant = ReturnType<typeof useAssistant>;
