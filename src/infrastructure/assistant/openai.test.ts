import { describe, expect, it } from "vitest";
import { OrganizeFailedError, type OrganizeRequest } from "@/domain/assistant/DraftOrganizer";
import { OpenAiDraftOrganizer } from "./OpenAiDraftOrganizer";

// OpenAI 호출부 — 실제 네트워크 없이 요청 모양과 응답 · 오류 처리를 본다 (80-record-assistant §6 · §11)

const request: OrganizeRequest = { today: "2026-11-24", screenDate: "2026-11-24", pieces: ["커피 사천오백"], items: [{ kind: "expense", title: "키링" }], cardNames: ["삼성카드"] };
const completed = (text: string, extra: object[] = []) => ({ status: "completed", output: [{ type: "reasoning" }, { type: "message", content: [...extra, { type: "output_text", text }] }] });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const answer = JSON.stringify({
  drafts: [{ piece: 0, kind: "expense", amount: 4500, date: null, category_id: "cafe", title: "커피", payment_method: null, card_name: null }],
  unreadable: [],
  categories: [{ item: 0, category_id: "shopping" }],
});

const setup = (respond: () => Promise<Response> | Response) => {
  const sent: { url: string; init: RequestInit }[] = [];
  const organizer = new OpenAiDraftOrganizer("sk-test-key", "gpt-6-luna", "low", async (url, init) => {
    sent.push({ url, init });
    return respond();
  });
  return { sent, organizer };
};
const failure = async (respond: () => Promise<Response> | Response) => {
  try {
    await setup(respond).organizer.organize(request);
    return "none";
  } catch (e) {
    return e instanceof OrganizeFailedError ? e.failure : `other:${String(e)}`;
  }
};

describe("OpenAiDraftOrganizer", () => {
  it("요청: Responses API · 보관하지 않음 · 기본 처리 등급 · 구조화 출력(strict) · 조각만 보낸다", async () => {
    const { sent, organizer } = setup(() => json(completed(answer)));
    await organizer.organize(request);
    const body = JSON.parse(sent[0].init.body as string);
    expect(sent[0].url).toBe("https://api.openai.com/v1/responses");
    expect(sent[0].init.headers).toMatchObject({ authorization: "Bearer sk-test-key" });
    expect(body).toMatchObject({ model: "gpt-6-luna", store: false, service_tier: "default", reasoning: { effort: "low" } });
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(JSON.parse(body.input[1].content)).toEqual({
      today: "2026-11-24", screen_date: "2026-11-24", cards: ["삼성카드"], pieces: [{ piece: 0, text: "커피 사천오백" }], items: [{ item: 0, kind: "expense", title: "키링" }],
    });
    expect(sent[0].init.signal).toBeInstanceOf(AbortSignal);
  });

  it("출력 형식에 이유 · 기분 · 메모 칸이 없고, 모든 칸이 필수이며, 카드 이름은 등록된 이름으로 묶인다", async () => {
    const { sent, organizer } = setup(() => json(completed(answer)));
    await organizer.organize(request);
    const schema = JSON.parse(sent[0].init.body as string).text.format.schema;
    const draft = schema.properties.drafts.items;
    expect(Object.keys(draft.properties)).toEqual(["piece", "kind", "amount", "date", "category_id", "title", "payment_method", "card_name"]);
    expect(JSON.stringify(schema)).not.toMatch(/reason|feeling|memo/);
    expect([schema.additionalProperties, draft.additionalProperties, draft.required.length]).toEqual([false, false, 8]);
    expect(draft.properties.card_name).toEqual({ type: ["string", "null"], enum: ["삼성카드", null] });
    expect(draft.properties.category_id.enum).toHaveLength(42); // 41종 + null
    // 등록 카드가 없으면 카드 이름은 늘 null
    const none = setup(() => json(completed(answer)));
    await none.organizer.organize({ ...request, cardNames: [] });
    expect(JSON.parse(none.sent[0].init.body as string).text.format.schema.properties.drafts.items.properties.card_name).toEqual({ type: "null" });
  });

  it("응답: output[]의 message → output_text에서 꺼낸다(첫 항목이 아니어도)", async () => {
    const got = await setup(() => json(completed(answer))).organizer.organize(request);
    expect(got).toEqual({
      drafts: [{ piece: 0, draft: { kind: "expense", amount: 4500, categoryId: "cafe", title: "커피", paymentMethod: null, cardName: null, date: null } }],
      categories: [{ item: 0, categoryId: "shopping" }],
      usage: null,
    });
    const counted = await setup(() => json({ ...completed(answer), usage: { input_tokens: 1200, output_tokens: 80 } })).organizer.organize(request);
    expect(counted.usage).toEqual({ input: 1200, output: 80 });
  });

  it("형식이 어긋난 항목은 버린다(타입만 본다 — 값의 범위는 서비스의 검증기가 본다)", async () => {
    const odd = JSON.stringify({ drafts: [{ piece: "0", kind: "expense", amount: 1 }, { piece: 0, kind: "expense", amount: "많이" }, null, { piece: 0, kind: "expense", amount: -5, title: 3 }], unreadable: [], categories: [{ item: "a" }, { item: 0 }] });
    const got = await setup(() => json(completed(odd))).organizer.organize(request);
    expect(got.drafts).toEqual([{ piece: 0, draft: { kind: "expense", amount: -5, categoryId: null, title: null, paymentMethod: null, cardName: null, date: null } }]);
    expect(got.categories).toEqual([{ item: 0, categoryId: null }]);
  });

  it("오류: 키(401) · 요청 제한(429) · 잔액 소진(429 + code) · 서버(5xx)", async () => {
    expect(await failure(() => json({ error: { message: "Incorrect API key provided" } }, 401))).toBe("auth");
    expect(await failure(() => json({ error: { message: "Rate limit reached for requests" } }, 429))).toBe("rateLimited");
    expect(await failure(() => json({ error: { type: "rate_limit_error", code: "slow_down" } }, 429))).toBe("rateLimited");
    expect(await failure(() => json({ error: { type: "insufficient_quota", code: "credit_balance_exhausted" } }, 429))).toBe("quota");
    expect(await failure(() => json({ error: { code: "project_spend_limit_exceeded" } }, 429))).toBe("quota");
    expect(await failure(() => json({ error: { type: "insufficient_quota" } }, 429))).toBe("quota");
    expect(await failure(() => new Response("upstream", { status: 503 }))).toBe("server");
    expect(await failure(() => json({ error: { message: "bad" } }, 400))).toBe("server");
  });

  it("오류: 시간 초과 · 연결 실패 · 깨진 JSON · 잘린 응답 · 거부", async () => {
    expect(await failure(() => Promise.reject(Object.assign(new Error("커피 사천오백"), { name: "TimeoutError" })))).toBe("timeout");
    expect(await failure(() => Promise.reject(new TypeError("fetch failed")))).toBe("server");
    expect(await failure(() => new Response("<html>", { status: 200 }))).toBe("format");
    expect(await failure(() => json(completed("{ 깨진")))).toBe("format");
    expect(await failure(() => json(completed(JSON.stringify({ drafts: "x" }))))).toBe("format");
    expect(await failure(() => json({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] }))).toBe("format");
    expect(await failure(() => json({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] }))).toBe("refused");
    expect(await failure(() => json({ status: "completed", output: [] }))).toBe("format");
  });

  it("오류에 문장 · 키를 싣지 않는다", async () => {
    try {
      await setup(() => Promise.reject(new Error("커피 사천오백 sk-test-key"))).organizer.organize(request);
      expect.unreachable();
    } catch (e) {
      expect(String(e)).not.toMatch(/커피|sk-test/);
    }
  });
});
