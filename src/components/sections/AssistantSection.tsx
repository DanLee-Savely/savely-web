import { MessageCircleQuestion, ShoppingCart, Smile, Sparkles, Utensils } from "lucide-react";
import Link from "next/link";
import { AppButton } from "@/components/common/AppButton";
import { BreakText } from "@/components/common/BreakText";
import { Section } from "@/components/common/Section";
import { homeContent } from "@/content/home.content";
import { cn } from "@/lib/utils";

const { assistant } = homeContent;
const { chat } = assistant;
const CARD_ICONS = { sparkles: Sparkles, smile: Smile, question: MessageCircleQuestion };
const DRAFT_ICONS = { food: Utensils, grocery: ShoppingCart };

// 05b 대화로 기록하기 — 「직접 적어야 습관이 된다 → 그런데 귀찮다 → 그래서 대화로 적는다」 (10-sections 05b).
// 흰 바탕 위 accent-tint 6%의 강조 구역. PC: 왼쪽 글 + 버튼 · 오른쪽 대화 그림 → 카드 3열 / 모바일: 세로로 쌓고 버튼은 숨긴다(/app은 PC 전용, M16)
export function AssistantSection() {
  return (
    <Section name="05b-assistant" id={assistant.id} background="tint">
      <div className="flex flex-col gap-10 lg:gap-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="flex flex-col items-start lg:max-w-[520px]">
            <p className="sv-text-eyebrow-12_5 text-sv-accent">{assistant.eyebrow}</p>
            <h2 className="mt-3 sv-text-hero-34 text-sv-text">
              <BreakText text={assistant.title} />
            </h2>
            <p className="mt-3 sv-text-body-15 text-sv-text-2 lg:mt-4">
              <BreakText text={assistant.desc} />
            </p>
            <AppButton asChild size="l" className="mt-10 hidden h-13 lg:inline-flex">
              <Link href={assistant.cta.href}>
                <Sparkles aria-hidden className="size-4.5" />
                {assistant.cta.label}
              </Link>
            </AppButton>
          </div>
          <ChatPreview />
        </div>
        <ul className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          {assistant.cards.map((card) => {
            const Icon = CARD_ICONS[card.icon];
            return (
              <li key={card.title} className="flex flex-col rounded-sv-lg border border-sv-border bg-sv-surface p-6 lg:p-7">
                <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-sv-accent-tint text-sv-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 sv-text-label-15 text-sv-text">{card.title}</h3>
                <p className="mt-2.5 sv-text-support-14_5 text-sv-text-2">{card.desc}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

const Avatar = () => (
  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sv-accent-tint text-sv-accent">
    <Sparkles className="size-3.5" />
  </span>
);

// 대화 그림 — 실제 「대화로 기록하기」 패널을 본뜬 정적 그림이다(움직이지 않고, 누를 수 없다). 글자는 읽을 수 있게 마크업으로 둔다
function ChatPreview() {
  return (
    <div className="w-full shrink-0 overflow-hidden rounded-[20px] border border-sv-border bg-sv-bg shadow-sv-float lg:w-[460px]">
      <p className="flex h-15.5 items-center gap-3 border-b border-sv-border bg-sv-surface px-5 sv-text-label-15 text-sv-text">
        <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-sv-accent-tint text-sv-accent">
          <Sparkles className="size-4" />
        </span>
        {chat.title}
      </p>
      <div className="flex flex-col gap-3 px-4.5 pt-4.5 pb-5">
        {chat.messages.map((m) =>
          m.from === "me" ? (
            <p key={m.text} className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-sv-accent px-3.5 py-2.5 sv-text-support-14_5 text-sv-on-accent">
              {m.text}
            </p>
          ) : (
            <div key={m.text} className="flex items-start gap-2">
              <Avatar />
              <p className="max-w-[85%] rounded-2xl bg-sv-surface-2 px-3.5 py-2.5 sv-text-support-14_5 text-sv-text">{m.text}</p>
            </div>
          ),
        )}
        <ul className="flex flex-col gap-2.5 pl-9">
          {chat.drafts.map((draft) => {
            const Icon = DRAFT_ICONS[draft.icon];
            return (
              <li key={draft.title} className="flex flex-col gap-2.5 rounded-sv-md border border-sv-border bg-sv-surface p-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-sv-sm bg-sv-surface-2 text-sv-text">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block sv-text-label-13 text-sv-text">{draft.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 sv-text-support-13 text-sv-text-3">
                      {draft.ai && (
                        <span className="inline-flex items-center gap-0.5 rounded-sv-pill bg-sv-accent-tint px-1.5 text-sv-accent">
                          <Sparkles aria-hidden className="size-3" />
                          {chat.aiBadge}
                        </span>
                      )}
                      {draft.sub}
                    </span>
                  </span>
                  <span className="sv-text-mono-13 text-sv-text">{draft.amount}</span>
                </div>
                {draft.reasons && (
                  <ul className="flex flex-wrap gap-1.5">
                    {chat.reasons.map((reason) => (
                      <li
                        key={reason}
                        className={cn(
                          "flex h-8 items-center rounded-sv-pill border px-3 sv-text-support-13",
                          reason === chat.pickedReason ? "border-sv-accent bg-sv-accent text-sv-on-accent" : "border-sv-border-2 bg-sv-surface text-sv-text-2",
                        )}
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
