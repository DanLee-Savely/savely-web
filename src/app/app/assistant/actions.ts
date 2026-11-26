"use server";

import { headers } from "next/headers";
import type { AssistantEntry } from "@/application/assistant/GetAssistantEntryService";
import type { InterpretOutcome } from "@/application/assistant/InterpretSentenceService";
import type { RecurringSaveResult } from "@/application/assistant/RecurringItemServices";
import type { RegisterCardOutcome } from "@/application/assistant/RegisterCardService";
import type { DraftSaveItem, SaveDraftsResult } from "@/application/assistant/SaveDraftsService";
import { ParseFailedError } from "@/domain/assistant/DraftValidator";
import type { ParseFailure } from "@/domain/assistant/ParsedDraft";
import { DomainError } from "@/domain/DomainError";
import type { RecurringInput, RecurringItemData } from "@/domain/recurring/RecurringItem";
import { type AssistantServer, createAssistantServer } from "@/infrastructure/container";

// 대화로 기록하기 Server Actions (80-record-assistant §2 · §7). 문장 → 초안, 초안 카드 묶음 → 저장.
// 문장 · 초안 값은 로그에 남기지 않는다(오류 종류만, §5-4). 저장하지 않으면 서버에 아무것도 남지 않는다

export type InterpretResponse = { ok: true; outcome: InterpretOutcome } | { ok: false; failure: ParseFailure };
/** 쓰기 요청의 실패: 요청 제한 · 받을 수 없는 값 · 서버 오류 */
export type WriteError = { ok: false; error: "RATE_LIMITED" | "INVALID" | "SERVER_ERROR" };
export type RecurringResponse = { ok: true; result: RecurringSaveResult; items: RecurringItemData[] } | WriteError;
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
export async function interpretSentence(sentence: string, screenDate: string, assumeRegister = false): Promise<InterpretResponse> {
  try {
    if (typeof sentence !== "string" || typeof screenDate !== "string") return { ok: false, failure: "failed" };
    const server = await createAssistantServer();
    const ip = await clientIp();
    if (!(await server.sendLimiter.allow(ip))) return { ok: false, failure: "rateLimited" };
    return { ok: true, outcome: await server.interpret.execute({ text: sentence, screenDate, ip, assumeRegister: assumeRegister === true }) };
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

/** 패널을 열 때 한 번 읽는다: 자주 적는 항목 · 채우지 않은 기록 · 고정지출 질문의 재료. 못 읽으면 null — 칩과 진입 블록 없이 연다 */
export async function loadAssistantEntry(screenDate: string): Promise<AssistantEntry | null> {
  try {
    return await (await createAssistantServer()).entry.execute(typeof screenDate === "string" ? screenDate : "");
  } catch (e) {
    console.error("[assistant] ENTRY_FAILED", e instanceof Error ? e.name : typeof e);
    return null;
  }
}

/** 쓰기 한 번(요청 제한 1회). 값 · 문장은 로그에 남기지 않는다 */
const write = async <T>(what: string, run: (server: AssistantServer) => Promise<T>): Promise<T | WriteError> => {
  try {
    const server = await createAssistantServer();
    if (!(await server.limiter.allow(await clientIp()))) return { ok: false, error: "RATE_LIMITED" };
    return await run(server);
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, error: "INVALID" };
    console.error(`[assistant] ${what}_FAILED`, e instanceof Error ? e.name : typeof e);
    return { ok: false, error: "SERVER_ERROR" };
  }
};

const num = (v: unknown): number => (typeof v === "number" ? v : Number.NaN);
/** 브라우저에서 온 값은 믿지 않는다 — 꼴만 맞추고, 한도는 서비스가 검증기로 본다 */
const readRecurring = (raw: unknown): RecurringInput => {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return { kind: text(o.kind) ?? "", amount: num(o.amount), dayOfMonth: num(o.dayOfMonth), title: text(o.title) ?? "", categoryId: text(o.categoryId), paymentMethod: text(o.paymentMethod), cardName: text(o.cardName) };
};

/** 카드 등록 — 「등록하기」를 눌렀을 때만 */
export async function registerCard(name: string, method: string): Promise<{ ok: true; outcome: RegisterCardOutcome } | WriteError> {
  return write("CARD", async (server) => ({ ok: true as const, outcome: await server.registerCard.execute({ name: text(name) ?? "", method: text(method) ?? "" }) }));
}

/** 고정지출 등록 — 「등록하기」를 눌렀을 때만 */
export async function registerRecurring(input: unknown): Promise<RecurringResponse> {
  return write("RECURRING", async (server) => {
    const result = await server.recurring.register.execute(readRecurring(input));
    return { ok: true as const, result, items: await server.recurring.list.execute() };
  });
}

/** 등록한 고정지출 고치기(목록의 줄 → 수정 시트 「적용」) */
export async function updateRecurring(id: string, input: unknown): Promise<RecurringResponse> {
  return write("RECURRING", async (server) => {
    const result = await server.recurring.update.execute(text(id) ?? "", readRecurring(input));
    return { ok: true as const, result, items: await server.recurring.list.execute() };
  });
}

/** 등록한 고정지출 하나 지우기 — 「삭제하기」를 눌렀을 때만. 한 번에 하나 */
export async function removeRecurring(id: string): Promise<{ ok: true; items: RecurringItemData[] } | WriteError> {
  return write("RECURRING", async (server) => {
    await server.recurring.remove.execute(text(id) ?? "");
    return { ok: true as const, items: await server.recurring.list.execute() };
  });
}
