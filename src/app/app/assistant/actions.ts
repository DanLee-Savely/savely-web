"use server";

import { headers } from "next/headers";
import type { InterpretResult } from "@/application/assistant/InterpretSentenceService";
import type { DraftSaveItem, SaveDraftsResult } from "@/application/assistant/SaveDraftsService";
import { ParseFailedError } from "@/domain/assistant/DraftValidator";
import type { ParseFailure } from "@/domain/assistant/ParsedDraft";
import { DomainError } from "@/domain/DomainError";
import { createAssistantServer } from "@/infrastructure/container";

// 대화로 기록하기 Server Actions (80-record-assistant §2 · §7). 문장 → 초안, 초안 카드 묶음 → 저장.
// 문장 · 초안 값은 로그에 남기지 않는다(오류 종류만, §5-4). 저장하지 않으면 서버에 아무것도 남지 않는다

export type InterpretResponse = { ok: true; result: InterpretResult } | { ok: false; failure: ParseFailure };
export type SaveResponse = ({ ok: true } & SaveDraftsResult) | { ok: false; error: "RATE_LIMITED" | "INVALID" | "SERVER_ERROR" };

const text = (v: unknown): string | null => (typeof v === "string" ? v : null);

/** 브라우저에서 온 값은 믿지 않는다 — 꼴이 다르면 null(서비스가 다시 도메인 클래스로 검증한다) */
const readItems = (raw: unknown): DraftSaveItem[] | null => {
  if (!Array.isArray(raw) || raw.length > 50) return null;
  const items = raw.map((v): DraftSaveItem | null => {
    if (typeof v !== "object" || v === null) return null;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.kind !== "string" || typeof o.amount !== "number") return null;
    return {
      id: o.id, kind: o.kind, amount: o.amount, date: text(o.date), categoryId: text(o.categoryId), title: text(o.title),
      paymentMethod: text(o.paymentMethod), cardName: text(o.cardName), reason: text(o.reason), feeling: text(o.feeling), memo: text(o.memo),
    };
  });
  return items.every((i) => i !== null) ? (items as DraftSaveItem[]) : null;
};

const clientIp = async (): Promise<string> => (await headers()).get("cf-connecting-ip") ?? "local";

/** 문장 한 번을 초안으로 정리한다. 서버에 저장하는 것은 없다(문장 · OpenAI 응답 모두) */
export async function interpretSentence(sentence: string, screenDate: string): Promise<InterpretResponse> {
  try {
    if (typeof sentence !== "string" || typeof screenDate !== "string") return { ok: false, failure: "failed" };
    const server = await createAssistantServer();
    const ip = await clientIp();
    if (!(await server.sendLimiter.allow(ip))) return { ok: false, failure: "rateLimited" };
    return { ok: true, result: await server.interpret.execute({ text: sentence, screenDate, ip }) };
  } catch (e) {
    if (e instanceof ParseFailedError) return { ok: false, failure: e.failure };
    console.error("[assistant] INTERPRET_FAILED", e instanceof Error ? e.name : typeof e);
    return { ok: false, failure: "failed" };
  }
}

/** 초안 카드 묶음을 저장한다(저장 확인 한 번 = 쓰기 요청 1회) */
export async function saveDrafts(rawItems: unknown, screenDate: string): Promise<SaveResponse> {
  try {
    const server = await createAssistantServer();
    if (!(await server.limiter.allow(await clientIp()))) return { ok: false, error: "RATE_LIMITED" };
    const items = readItems(rawItems);
    if (!items || typeof screenDate !== "string") return { ok: false, error: "INVALID" };
    return { ok: true, ...(await server.save.execute({ items, screenDate })) };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: "INVALID" };
    console.error("[assistant] SAVE_FAILED", e instanceof Error ? e.name : typeof e);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
