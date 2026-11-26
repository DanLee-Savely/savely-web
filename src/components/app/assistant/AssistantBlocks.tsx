import { Check, ChevronRight, CreditCard, Pencil } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryIcon } from "@/components/app/CategoryIcon";
import { AppButton } from "@/components/common/AppButton";
import { amountSign, amountTone, appContent } from "@/content/app.content";
import { assistantContent, helpItems, recurringDay, recurringDueAsk, recurringOverdue, unfilledMore, unfilledNotice } from "@/content/assistant.content";
import type { UnfilledRecords } from "@/domain/assistant/AssistantInsights";
import type { RecurringDraft } from "@/domain/recurring/RecurringCommandParser";
import type { RecurringDue, RecurringItemData } from "@/domain/recurring/RecurringItem";
import type { RecurringCard } from "@/interaction/AssistantSession";
import { formatAmount } from "@/lib/recordFormat";
import { cn } from "@/lib/utils";

// 대화 패널의 블록들(시안 38~42): 「할 수 있는 일」 · 채우지 않은 기록 · 고정지출 질문 · 등록 카드 · 목록 · 삭제 확인 · 카드 등록.
// 표시와 입력 전달만 한다. 등록 · 삭제는 버튼을 눌렀을 때만 일어난다(문장만으로는 아무것도 바뀌지 않는다)

const { kinds, categories, paymentMethods, form } = appContent;
const c = assistantContent;
const TONE = { income: "text-sv-accent", muted: "text-sv-text-2", plain: "text-sv-text" };
const month = (date: string) => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;

export const bubble = "max-w-[85%] rounded-sv-md px-3.5 py-2.5 sv-text-support-14_5 whitespace-pre-line";
const box = "rounded-sv-md border border-sv-border-2 px-3 py-3";
const Bubble = ({ children }: { children: ReactNode }) => <p className={cn(bubble, "self-start bg-sv-surface-2 text-sv-text")}>{children}</p>;
const Amount = ({ kind, amount }: { kind: string; amount: number }) => (
  <span className={cn("shrink-0 sv-text-mono-13", TONE[amountTone(kind)])}>
    {amountSign(kind)}
    {formatAmount(amount)}
    {form.won}
  </span>
);

/** 「할 수 있는 일」 목록(F). 예시를 누르면 입력칸에 채워진다 — 보내지는 않는다(고쳐서 보낼 수 있다) */
export function HelpView({ today, onExample }: { today: string; onExample: (example: string) => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-sv-md bg-sv-surface-2 px-3.5 py-3">
      <p className="sv-text-support-14_5 text-sv-text">{c.help.title}</p>
      {helpItems(today).map((item) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <p className="sv-text-label-13 text-sv-text">{item.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {item.examples.map((example) => (
              <button key={example} type="button" onClick={() => onExample(example)} className="inline-flex h-8 items-center gap-1.5 rounded-sv-pill border border-sv-border-2 bg-sv-surface px-3 sv-text-support-13 text-sv-text-2 hover:bg-sv-surface-3">
                <Pencil aria-hidden className="size-3.5" />
                {example}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 채우지 않은 기록 알림(B). 줄을 누르면 그 기록의 수정 화면으로 간다(K15). 권유일 뿐이다 */
export function UnfilledView({ unfilled, onOpen, onLater }: { unfilled: UnfilledRecords; onOpen: () => void; onLater: () => void }) {
  const more = unfilled.total - unfilled.shown.length;
  return (
    <div className="flex flex-col items-start gap-2">
      <Bubble>{unfilledNotice(unfilled.total)}</Bubble>
      <ul className="flex w-full flex-col gap-2">
        {unfilled.shown.map((r) => (
          <li key={r.id}>
            <Link href={`/app/records/${r.id}/edit`} onClick={onOpen} className={cn(box, "flex items-start gap-2 hover:bg-sv-surface-2")}>
              <CategoryIcon categoryId={null} className="size-8 bg-transparent" />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate sv-text-label-13", r.title ? "text-sv-text" : "text-sv-text-3")}>{r.title ?? c.card.noTitle}</span>
                <span className="mt-0.5 block sv-text-support-13 text-sv-text-3">
                  {month(r.date)} · {kinds[r.kind]} · <span className="text-sv-accent">{c.card.pickCategory}</span>
                </span>
              </span>
              <Amount kind={r.kind} amount={r.amount} />
              <ChevronRight aria-hidden className="size-4 shrink-0 text-sv-text-3" />
            </Link>
          </li>
        ))}
      </ul>
      {more > 0 && <p className="sv-text-support-13 text-sv-text-3">{unfilledMore(more)}</p>}
      <AppButton variant="outline" onClick={onLater}>
        {c.unfilledLater}
      </AppButton>
    </div>
  );
}

type RowItem = { kind: string; amount: number; title: string | null; categoryId: string | null; dayOfMonth: number | null; paymentMethod: string | null; cardName: string | null };

/** 고정지출 한 줄: 이름 · 「매달 15일 · 지출 · 구독」 · 금액. 수입 항목만 「고정수입」으로 적는다 */
function RecurringLine({ item, missing }: { item: RowItem; missing?: boolean }) {
  const category = item.categoryId ? categories[item.categoryId] : null;
  const payment = item.paymentMethod && [paymentMethods[item.paymentMethod], item.cardName].filter(Boolean).join(" ");
  return (
    <>
      <CategoryIcon categoryId={item.categoryId} income={item.kind === "income"} className="size-8 bg-transparent" />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate sv-text-label-13", item.title ? "text-sv-text" : "text-sv-danger")}>{item.title || c.recurring.needName}</span>
        <span className="mt-0.5 flex flex-wrap gap-x-1.5 sv-text-support-13 text-sv-text-3">
          <span className={item.dayOfMonth === null && missing ? "text-sv-danger" : undefined}>{item.dayOfMonth === null ? c.recurring.needDay : recurringDay(item.dayOfMonth)} ·</span>
          <span className={item.kind === "income" ? "text-sv-accent" : undefined}>{item.kind === "income" ? c.recurring.income : kinds[item.kind as keyof typeof kinds]}</span>
          {category && <span>· {category}</span>}
          {payment && <span>· {payment}</span>}
        </span>
      </span>
      <Amount kind={item.kind} amount={item.amount} />
    </>
  );
}

const Registered = ({ label }: { label: string }) => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-sv-pill bg-sv-accent-tint-2 px-2 py-0.5 sv-text-support-13 text-sv-accent">
    <Check aria-hidden className="size-3.5" />
    {label}
  </span>
);

/** 고정지출 최초 질문(C): 안내 · 등록 후보(지난 두 달 모두 적은 항목) · 「나중에 할게요」 */
export function RecurringAskView({ candidates, onPick, onLater }: { candidates: RecurringDraft[]; onPick: (index: number) => void; onLater: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Bubble>{c.recurring.firstAsk}</Bubble>
      {candidates.length > 0 && (
        <>
          <p className="sv-text-support-13 text-sv-text-2">{c.recurring.candidates}</p>
          <ul className="flex w-full flex-col gap-2">
            {candidates.map((x, i) => (
              <li key={`${x.draft.kind}-${x.draft.title}`}>
                <button type="button" onClick={() => onPick(i)} className={cn(box, "flex w-full items-start gap-2 text-left hover:bg-sv-surface-2")}>
                  <RecurringLine item={{ ...x.draft, dayOfMonth: x.dayOfMonth }} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <AppButton variant="outline" onClick={onLater}>
        {c.recurring.later}
      </AppButton>
    </div>
  );
}

/** 나가는 날이 된 고정지출을 묻는다(C). 자동으로 기록하지 않는다 — 「기록할게요」를 눌러야 초안 카드가 생긴다 */
export function RecurringDueView({ due, onYes, onEdit, onSkip }: { due: RecurringDue; onYes: () => void; onEdit: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Bubble>{due.isToday ? recurringDueAsk(due.item) : recurringOverdue(due.item, due.dueDate)}</Bubble>
      <div className="flex flex-wrap gap-2">
        <AppButton onClick={onYes}>{c.recurring.dueYes}</AppButton>
        <AppButton variant="outline" onClick={onEdit}>
          {c.recurring.dueEdit}
        </AppButton>
        <AppButton variant="outline" onClick={onSkip}>
          {c.recurring.dueSkip}
        </AppButton>
      </div>
    </div>
  );
}

/** 고정지출 등록 카드 묶음(C). 카드를 누르면 수정 시트. 이름과 나가는 날이 모두 있어야 「등록하기」가 눌린다 */
export function RecurringCardsView({ cards, notes, onEdit, onRegister }: { cards: RecurringCard[]; notes: string[]; onEdit: (id: string) => void; onRegister: (card: RecurringCard) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {cards.map((card) => (
          <li key={card.id} className={cn(box, "flex flex-col gap-2.5")}>
            <button type="button" disabled={card.registered} onClick={() => onEdit(card.id)} className="flex items-start gap-2 text-left">
              <RecurringLine item={card} missing />
            </button>
            <div className="flex justify-end">
              {card.registered ? (
                <Registered label={c.recurring.registered} />
              ) : (
                <AppButton disabled={!card.title?.trim() || card.dayOfMonth === null} onClick={() => onRegister(card)}>
                  {c.recurring.register}
                </AppButton>
              )}
            </div>
          </li>
        ))}
      </ul>
      {notes.map((note) => (
        <p key={note} className="sv-text-support-13 text-sv-text-2">{note}</p>
      ))}
    </div>
  );
}

/** 등록한 고정지출 목록(C). 줄을 누르면 수정 시트 — 거기서 고치거나 지운다 */
export function RecurringListView({ items, onEdit }: { items: RecurringItemData[]; onEdit: (item: RecurringItemData) => void }) {
  if (!items.length) return <p className="sv-text-support-13 text-sv-text-3">{c.recurring.empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => onEdit(item)} className={cn(box, "flex w-full items-start gap-2 text-left hover:bg-sv-surface-2")}>
            <RecurringLine item={item} />
            <ChevronRight aria-hidden className="size-4 shrink-0 text-sv-text-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}

type RemoveProps = { candidates: RecurringItemData[]; removedIds: string[]; kept: boolean; onRemove: (id: string) => void; onKeep: () => void };

/** 지울 고정지출 확인(C). 줄마다 「삭제하기」가 따로다 — 한꺼번에 지우지 않는다 */
export function RecurringRemoveView({ candidates, removedIds, kept, onRemove, onKeep }: RemoveProps) {
  const left = candidates.filter((x) => !removedIds.includes(x.id));
  return (
    <div className="flex flex-col items-start gap-2">
      <ul className="flex w-full flex-col gap-2">
        {candidates.map((item) => (
          <li key={item.id} className={cn(box, "flex flex-col gap-2.5", removedIds.includes(item.id) && "opacity-50")}>
            <div className="flex items-start gap-2">
              <RecurringLine item={item} />
            </div>
            {!kept && !removedIds.includes(item.id) && (
              <div className="flex justify-end">
                <AppButton variant="outline-danger" onClick={() => onRemove(item.id)}>
                  {c.recurring.remove}
                </AppButton>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!kept && left.length > 0 && (
        <AppButton variant="outline" onClick={onKeep}>
          {c.recurring.keep}
        </AppButton>
      )}
    </div>
  );
}

type CardDraftProps = { name: string; method: string; registered: boolean; onMethod: (method: string) => void; onRegister: () => void };

/** 카드 등록 카드(E): 이름 · 종류(신용 · 체크, 등록 전에 바꿀 수 있다) · 「등록하기」 */
export function CardDraftView({ name, method, registered, onMethod, onRegister }: CardDraftProps) {
  return (
    <div className={cn(box, "flex flex-col gap-2.5")}>
      <div className="flex items-start gap-2">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center text-sv-text-2">
          <CreditCard className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate sv-text-label-13 text-sv-text">{name}</span>
          {registered && <span className="mt-0.5 block sv-text-support-13 text-sv-text-3">{paymentMethods[method]}</span>}
        </span>
        {registered && <Registered label={c.cardDraft.registered} />}
      </div>
      {!registered && (
        <>
          <div role="group" aria-label={name} className="grid grid-cols-2 gap-1 rounded-sv-md bg-sv-surface-2 p-1">
            {["credit_card", "check_card"].map((m) => (
              <button key={m} type="button" aria-pressed={m === method} onClick={() => onMethod(m)} className={cn("h-9 rounded-sv-sm sv-text-label-13", m === method ? "bg-sv-surface text-sv-text" : "text-sv-text-3 hover:text-sv-text-2")}>
                {paymentMethods[m]}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <AppButton onClick={onRegister}>{c.cardDraft.register}</AppButton>
          </div>
        </>
      )}
    </div>
  );
}
