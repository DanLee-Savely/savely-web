import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CardCommandParser } from "../card/CardCommandParser";
import { RecurringCommandParser } from "../recurring/RecurringCommandParser";
import { CheckedRecordParser, DraftValidator } from "./DraftValidator";
import type { KnownCard, ParsedDraft } from "./ParsedDraft";
import { RuleRecordParser } from "./RuleRecordParser";

// 모바일 앱과 같은 문장 세트(fixtures/*.json)를 같은 기준으로 통과해야 한다 (80-record-assistant §11).
// 앱 테스트와 같은 날짜로 시계를 고정한다. 앱은 구분 · 금액 · 카테고리 · 결제수단 · 카드 이름으로 통과를 판정하고 내용은 따로 세는데,
// 여기서는 내용 · 날짜 · 못 읽은 조각까지 모두 같아야 통과다.

type DraftExpect = Partial<Omit<ParsedDraft, "kind" | "amount">> & Pick<ParsedDraft, "kind" | "amount">;
type RecordCase = { id: string; text: string; expect: DraftExpect[]; cards?: KnownCard[]; unparsed?: string[] };
type RecurringItemExpect = { kind: string; amount: number; day?: number; title?: string; categoryId?: string; paymentMethod?: string };
type RecurringCase = { id: string; text: string; assume?: boolean; expect: { intent: string; query?: string; items?: RecurringItemExpect[] } };
type CardCase = { id: string; text: string; expect: { intent: string; name?: string; method?: string } };

const load = <T>(name: string): T[] => (JSON.parse(readFileSync(join(process.cwd(), "src/domain/assistant/fixtures", name), "utf8")) as { cases: T[] }).cases;
const clockAt = (date: string) => ({ now: () => new Date(`${date}T03:00:00Z`) }); // 한국 시간 정오
const full = (d: DraftExpect): ParsedDraft => ({ categoryId: null, title: null, paymentMethod: null, cardName: null, date: null, ...d });

const runRecord = (c: RecordCase, today: string) => {
  const clock = clockAt(today);
  return new CheckedRecordParser(new RuleRecordParser(c.cards ?? []), new DraftValidator(clock), clock).parse(c.text);
};

describe("기록 문장 세트 100건 (오늘 = 2026-11-24)", () => {
  const cases = load<RecordCase>("record-sentences.json");
  it("100건이고 번호 · 문장이 겹치지 않는다", () => {
    expect(cases).toHaveLength(100);
    expect(new Set(cases.map((c) => c.id)).size).toBe(100);
    expect(new Set(cases.map((c) => c.text)).size).toBe(100);
  });
  // 이 세트의 기대값에는 날짜가 없다(앱도 이 세트에서는 날짜를 보지 않는다 — 날짜는 아래 날짜 세트가 본다).
  // `out-01 어제 점심 9천원`처럼 날짜 낱말이 든 문장이 있어 날짜 칸만 빼고 비교한다
  it.each(cases.map((c) => [c.id, c.text.replaceAll("\n", " ⏎ "), c] as const))("%s  %s", (_id, _text, c) => {
    const got = runRecord(c, "2026-11-24");
    expect(got.drafts.map((d) => ({ ...d, date: null }))).toEqual(c.expect.map(full));
    if (c.unparsed) expect(got.unparsed).toEqual(c.unparsed);
  });
});

describe("날짜 문장 세트 29건 (오늘 = 2026-11-24)", () => {
  const cases = load<RecordCase>("date-sentences.json");
  it("29건", () => expect(cases).toHaveLength(29));
  it.each(cases.map((c) => [c.id, c.text.replaceAll("\n", " ⏎ "), c] as const))("%s  %s", (_id, _text, c) => {
    const got = runRecord(c, "2026-11-24");
    expect(got.drafts).toEqual(c.expect.map(full));
    if (c.unparsed) expect(got.unparsed).toEqual(c.unparsed);
  });
});

describe("고정지출 문장 세트 52건 (오늘 = 2026-11-25)", () => {
  const cases = load<RecurringCase>("recurring-sentences.json");
  const parser = new RecurringCommandParser(new RuleRecordParser());
  it("52건이고 네 가지 경우가 모두 들어 있다", () => {
    expect(cases).toHaveLength(52);
    expect(new Set(cases.map((c) => c.expect.intent))).toEqual(new Set(["register", "remove", "list", "none"]));
  });
  it.each(cases.map((c) => [c.id, c.text, c] as const))("%s  %s", (_id, _text, c) => {
    const cmd = parser.parse(c.text, "2026-11-25", c.assume === true);
    if (c.expect.intent === "none") return expect(cmd).toBeNull();
    expect(cmd?.intent).toBe(c.expect.intent);
    if (cmd?.intent === "remove") expect(cmd.query).toBe(c.expect.query);
    if (cmd?.intent === "register") {
      const got = cmd.items.map((i) => ({ kind: i.draft.kind, amount: i.draft.amount, day: i.dayOfMonth, title: i.draft.title, categoryId: i.draft.categoryId, paymentMethod: i.draft.paymentMethod }));
      const want = (c.expect.items ?? []).map((w) => ({ day: null, title: null, categoryId: null, paymentMethod: null, ...w }));
      expect(got).toEqual(want);
    }
  });
});

describe("카드 등록 문장 세트 17건", () => {
  const cases = load<CardCase>("card-sentences.json");
  it("17건", () => expect(cases).toHaveLength(17));
  it.each(cases.map((c) => [c.id, c.text, c] as const))("%s  %s", (_id, _text, c) => {
    const cmd = CardCommandParser.parse(c.text);
    if (c.expect.intent === "none") return expect(cmd).toBeNull();
    expect(cmd).toEqual({ name: c.expect.name, method: c.expect.method });
  });
});
