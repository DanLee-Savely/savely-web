"use client";

import { CalendarDays, CircleAlert, Info, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { errorMessage } from "@/content/app.content";
import { assistantContent, confirmLines, dateHeader, frequentChip, recurringDay, saveButton } from "@/content/assistant.content";
import type { RecurringItemData } from "@/domain/recurring/RecurringItem";
import type { Assistant } from "@/hooks/useAssistant";
import type { AssistantMessage, AssistantSession, DraftCard } from "@/interaction/AssistantSession";
import { cn } from "@/lib/utils";
import { bubble, CardDraftView, HelpView, RecurringAskView, RecurringCardsView, RecurringDueView, RecurringListView, RecurringRemoveView, UnfilledView } from "./AssistantBlocks";
import { AssistantConfirm } from "./AssistantConfirm";
import { DraftCardView } from "./DraftCardView";
import { DraftEditSheet } from "./DraftEditSheet";
import { RecurringEditSheet } from "./RecurringEditSheet";

const c = assistantContent;
type Leaving = "close" | "manual";
/** 열려 있는 수정 시트: 기록 초안 카드 · 등록 전의 고정지출 카드 · 등록한 고정지출 */
type Sheet = { type: "draft"; id: string } | { type: "recurringCard"; id: string } | { type: "recurringItem"; item: RecurringItemData };

// 대화 패널(시안 30~42): 머리줄(제목 · 직접 입력 · 닫기) · 날짜 머리말 · 대화 · 저장 버튼 · 칩 줄 · 입력칸 · 전송 고지.
// 오른쪽 440, 뒤 화면을 흐리게 하지 않는다. 저장 확인 · 나가기 확인 · 삭제 확인 창만 화면 전체를 흐린다.
// 화면은 표시와 입력 전달만 한다 — 상태는 AssistantSession, 해석 · 저장 · 등록은 Server Action(useAssistant)
export function AssistantPanel({ assistant, session }: { assistant: Assistant; session: AssistantSession }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const [removing, setRemoving] = useState<RecurringItemData | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pending = session.pending;
  const draftCard = sheet?.type === "draft" ? (pending.find((card) => card.id === sheet.id) ?? null) : null;
  const recurringCard = sheet?.type === "recurringCard" ? (session.messages.flatMap((m) => (m.type === "recurringDrafts" ? m.cards : [])).find((x) => x.id === sheet.id && !x.registered) ?? null) : null;

  // 새 말풍선이 보이게 맨 아래로 내린다. 중괄호로 감싼다 — 요즘 브라우저의 scrollIntoView는 Promise를 돌려주는데, 효과가 그것을 돌려주면 정리 함수로 오해한다
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [session.messages.length, session.phase]);

  const leave = (how: Leaving) => {
    assistant.close();
    if (how === "manual") router.push(`/app/records/new?date=${session.screenDate}`);
  };
  /** 저장하지 않은 카드가 있으면 먼저 묻는다(등록하지 않은 고정지출 · 카드 등록 카드는 묻지 않는다 — 기록 초안이 아니다) */
  const tryLeave = (how: Leaving) => (pending.length ? setLeaving(how) : leave(how));
  /** 예시 문장을 입력칸에 채운다. 보내지는 않는다 — 고쳐서 보낼 수 있게 */
  const fillInput = (example: string) => {
    assistant.setInput(example);
    inputRef.current?.focus();
  };
  const lastSaved = session.messages.findLastIndex((m) => m.type === "saved");

  return (
    <aside aria-label={c.title} className="fixed inset-y-0 right-0 z-40 flex w-full max-w-110 flex-col border-l border-sv-border-2 bg-sv-surface shadow-sv-float-lg">
      <header className="flex h-18 shrink-0 items-center gap-3 border-b border-sv-border-2 px-6">
        <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-sv-accent-tint text-sv-accent">
          <Sparkles className="size-4.5" />
        </span>
        <h2 className="flex-1 sv-text-label-15 text-sv-text">{c.title}</h2>
        <button type="button" onClick={() => tryLeave("manual")} className="sv-text-label-13 text-sv-accent hover:text-sv-accent-deep">
          {c.manualInput}
        </button>
        <button type="button" aria-label={c.close} onClick={() => tryLeave("close")} className="text-sv-text hover:text-sv-text-2">
          <X aria-hidden className="size-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-5" aria-live="polite">
        <p className="flex items-baseline gap-2 sv-text-label-15 text-sv-text">
          {dateHeader(session.screenDate)}
          {session.screenDate !== session.today && <span className="rounded-sv-pill bg-sv-accent-tint px-2 py-0.5 sv-text-caption-11 text-sv-accent">{c.pastDay}</span>}
        </p>
        {session.messages.map((m, i) => (
          <Message
            key={i}
            index={i}
            message={m}
            session={session}
            assistant={assistant}
            showActions={i === lastSaved}
            onSheet={setSheet}
            onManual={() => tryLeave("manual")}
            onMore={() => inputRef.current?.focus()}
            onExample={fillInput}
          />
        ))}
        {session.phase === "parsing" && <p className={cn(bubble, "self-start bg-sv-surface-2 text-sv-text-2")}>{c.parsing}</p>}
        <div ref={endRef} />
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-sv-border-2 px-5 pt-3 pb-5">
        {assistant.error && (
          <p role="alert" className="flex items-center gap-1.5 sv-text-support-13 text-sv-danger">
            <CircleAlert aria-hidden className="size-4 shrink-0" />
            {assistant.error === "RATE_LIMITED" ? errorMessage("form", "RATE_LIMITED") : assistant.error === "SAVE_FAILED" ? c.saveFailed : c.recurring.failed}
          </p>
        )}
        {pending.length > 0 && (
          <AppButton className="w-full" disabled={session.busy} onClick={() => setConfirmSave(true)}>
            {saveButton(pending.length)}
          </AppButton>
        )}
        {/* 칩 줄: 「할 수 있는 일」은 늘 보이고, 자주 적는 항목은 있을 때만 그 뒤에 이어진다. 한 줄이고 넘치면 옆으로 민다 */}
        <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5">
          <button type="button" disabled={session.busy} onClick={() => assistant.change((s) => s.showHelp())} className="inline-flex h-8.5 shrink-0 items-center gap-1 rounded-sv-pill border border-sv-accent px-3 sv-text-label-13 text-sv-accent hover:bg-sv-accent-tint disabled:opacity-60">
            <Sparkles aria-hidden className="size-3.5" />
            {c.help.chip}
          </button>
          {assistant.frequent.length > 0 && <span className="shrink-0 sv-text-support-13 text-sv-text-3">{c.frequentLabel}</span>}
          {assistant.frequent.map((item) => (
            <button key={`${item.draft.kind}-${item.draft.categoryId}-${item.draft.title}`} type="button" disabled={session.busy} onClick={() => assistant.addFrequent(item)} className="h-8.5 shrink-0 rounded-sv-pill border border-sv-border-2 bg-sv-surface px-3 sv-text-support-13 text-sv-text-2 hover:bg-sv-surface-2 disabled:opacity-60">
              {frequentChip(item.draft.title ?? "", item.draft.amount)}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void assistant.send();
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={assistant.input}
            placeholder={c.inputHint}
            aria-label={c.title}
            onChange={(e) => assistant.setInput(e.target.value)}
            onKeyDown={(e) => {
              // Enter는 보내기, Shift+Enter는 줄바꿈. 한글 조합 중의 Enter는 보내지 않는다
              if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
              e.preventDefault();
              void assistant.send();
            }}
            className="max-h-32 min-h-12 flex-1 resize-none rounded-sv-md border border-sv-border-2 bg-sv-surface px-4 py-3 sv-text-body-15 text-sv-text outline-none placeholder:text-sv-text-3 focus:border-sv-accent"
          />
          <button
            type="submit"
            aria-label={c.send}
            disabled={session.busy || !assistant.input.trim()}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sv-accent text-sv-on-accent disabled:bg-sv-surface-3 disabled:text-sv-text-3"
          >
            <Send aria-hidden className="size-5" />
          </button>
        </form>
        <p className="flex gap-1.5 sv-text-support-13 text-sv-text-3">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {c.notice}
        </p>
      </footer>

      {draftCard && (
        <DraftEditSheet
          key={draftCard.id}
          card={draftCard}
          today={session.today}
          onClose={() => setSheet(null)}
          onApply={(patch) => {
            assistant.change((s) => s.update(draftCard.id, patch));
            setSheet(null);
          }}
          onRemove={() => {
            assistant.change((s) => s.remove(draftCard.id));
            setSheet(null);
          }}
        />
      )}
      {recurringCard && (
        <RecurringEditSheet
          key={recurringCard.id}
          source={recurringCard}
          onClose={() => setSheet(null)}
          onApply={(input) => {
            assistant.change((s) => s.updateRecurringCard(recurringCard.id, { ...input, kind: input.kind as DraftCard["kind"] }));
            setSheet(null);
          }}
          onRemove={() => {
            assistant.change((s) => s.removeRecurringCard(recurringCard.id));
            setSheet(null);
          }}
        />
      )}
      {sheet?.type === "recurringItem" && (
        <RecurringEditSheet
          key={sheet.item.id}
          source={sheet.item}
          onClose={() => setSheet(null)}
          onApply={(input) => {
            void assistant.editRecurring(sheet.item.id, input);
            setSheet(null);
          }}
          onRemove={() => {
            // 등록한 항목은 한 번 더 확인한다
            setRemoving(sheet.item);
            setSheet(null);
          }}
        />
      )}
      <AssistantConfirm
        open={confirmSave}
        title={c.confirmSave.title}
        lines={confirmLines(session.saveGroups)}
        labels={c.confirmSave}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => {
          setConfirmSave(false);
          void assistant.save();
        }}
      />
      <AssistantConfirm
        open={leaving !== null}
        title={c.confirmExit.title}
        lines={[c.confirmExit.desc]}
        labels={c.confirmExit}
        danger
        onCancel={() => setLeaving(null)}
        onConfirm={() => leaving && leave(leaving)}
      />
      <AssistantConfirm
        open={removing !== null}
        title={c.recurring.removeAsk}
        lines={removing ? [`${removing.title} · ${recurringDay(removing.dayOfMonth)}`] : []}
        labels={{ cancel: c.recurring.keep, confirm: c.recurring.remove }}
        danger
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void assistant.deleteRecurring(removing.id);
          setRemoving(null);
        }}
      />
    </aside>
  );
}

type MessageProps = {
  index: number;
  message: AssistantMessage;
  session: AssistantSession;
  assistant: Assistant;
  /** 마지막 저장 요약에만 「더 적기」 · 「달력에서 확인」을 둔다 */
  showActions: boolean;
  onSheet: (sheet: Sheet) => void;
  onManual: () => void;
  onMore: () => void;
  onExample: (example: string) => void;
};

function Message({ index, message: m, session, assistant, showActions, onSheet, onManual, onMore, onExample }: MessageProps) {
  const { change } = assistant;
  switch (m.type) {
    case "user":
      return <p className={cn(bubble, "self-end bg-sv-accent text-sv-on-accent")}>{m.text}</p>;
    case "notice":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className={cn(bubble, "bg-sv-surface-2 text-sv-text")}>{m.text}</p>
          {m.offerManual && (
            <AppButton variant="outline" onClick={onManual}>
              {c.switchToManual}
            </AppButton>
          )}
        </div>
      );
    case "saved":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className={cn(bubble, "bg-sv-surface-2 text-sv-text")}>{m.text}</p>
          {showActions && (
            <div className="flex gap-2">
              <AppButton variant="outline" onClick={onMore}>
                {c.writeMore}
              </AppButton>
              <AppButton asChild variant="outline">
                <Link href={`/app/calendar?month=${m.date.slice(0, 7)}&date=${m.date}`} onClick={assistant.close}>
                  <CalendarDays aria-hidden className="size-4" />
                  {c.openCalendar}
                </Link>
              </AppButton>
            </div>
          )}
        </div>
      );
    case "drafts":
      return <Drafts cards={m.cards} notes={m.notes} session={session} onEdit={(id) => onSheet({ type: "draft", id })} change={change} />;
    case "help":
      return <HelpView today={session.today} onExample={onExample} />;
    case "unfilled":
      return <UnfilledView unfilled={m.unfilled} onOpen={assistant.close} onLater={assistant.dismissUnfilled} />;
    case "recurringAsk":
      return <RecurringAskView candidates={m.candidates} onPick={assistant.pickCandidate} onLater={assistant.closeRecurringAsk} />;
    case "recurringDue": {
      const due = m.queue[0];
      const edit = () => {
        // 「금액이 달라요」 — 카드를 만들고 바로 수정 시트를 연다. 등록해 둔 금액은 바꾸지 않는다
        const id = assistant.recordDue(due);
        if (id) onSheet({ type: "draft", id });
      };
      return <RecurringDueView due={due} onYes={() => void assistant.recordDue(due)} onEdit={edit} onSkip={() => assistant.skipDue(due)} />;
    }
    case "recurringDrafts":
      return <RecurringCardsView cards={m.cards} notes={m.notes} onEdit={(id) => onSheet({ type: "recurringCard", id })} onRegister={(card) => void assistant.submitRecurring(card)} />;
    case "recurringList":
      return <RecurringListView items={m.items} onEdit={(item) => onSheet({ type: "recurringItem", item })} />;
    case "recurringRemove":
      return <RecurringRemoveView candidates={m.candidates} removedIds={m.removedIds} kept={m.kept} onRemove={(id) => void assistant.deleteRecurring(id)} onKeep={() => change((s) => s.keepRecurring(index))} />;
    case "cardDraft":
      return <CardDraftView name={m.name} method={m.method} registered={m.registered} onMethod={(method) => change((s) => s.setCardMethod(m.id, method))} onRegister={() => void assistant.submitCard(m.id, m.name, m.method)} />;
  }
}

function Drafts({ cards, notes, session, onEdit, change }: { cards: DraftCard[]; notes: string[]; session: AssistantSession; onEdit: (id: string) => void; change: Assistant["change"] }) {
  return (
    <div className="flex flex-col gap-2">
      {cards.length ? (
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <DraftCardView
              key={card.id}
              card={card}
              screenDate={session.screenDate}
              today={session.today}
              locked={session.busy}
              onEdit={() => onEdit(card.id)}
              onRemove={() => change((s) => s.remove(card.id))}
              onReason={(reason) => change((s) => s.pickReason(card.id, reason))}
              onFeeling={(feeling) => change((s) => s.pickFeeling(card.id, feeling))}
            />
          ))}
        </ul>
      ) : (
        <p className="sv-text-support-13 text-sv-text-3">{c.card.allRemoved}</p>
      )}
      {notes.map((note) => (
        <p key={note} className="sv-text-support-13 text-sv-text-2">{note}</p>
      ))}
    </div>
  );
}
