import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type RecordQuery, RecordQueryParser, type RecordQueryResult } from "./RecordQueryParser";

// 대화로 물어보기 — 질문 인식 (80-record-assistant H). 모바일 앱과 같은 문장 세트(fixtures/query-sentences.json)를 같은 기준으로 통과해야 한다.
// 이 세트의 「오늘」은 2026-11-25(수요일)다.

type Expect = { intent: "query" | "rejected" | "none"; kind?: string; period?: string; from?: string; to?: string; categoryId?: string; assumed?: boolean; reason?: string };
type Case = { id: string; text: string; expect: Expect };

const TODAY = "2026-11-25";
const cases = (JSON.parse(readFileSync(join(process.cwd(), "src/domain/assistant/fixtures/query-sentences.json"), "utf8")) as { cases: Case[] }).cases;
const parse = (text: string, at = TODAY): RecordQueryResult | null => RecordQueryParser.parse(text, at);
const query = (text: string, at = TODAY): RecordQuery => {
  const got = parse(text, at);
  if (got?.type !== "query") throw new Error(`질문으로 읽지 못했어요: ${text}`);
  return got.query;
};
const rejection = (text: string): string | null => {
  const got = parse(text);
  return got?.type === "rejected" ? got.reason : null;
};

describe("질문 문장 세트 점검", () => {
  it("번호가 겹치지 않고 세 가지 경우가 모두 있다", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(new Set(cases.map((c) => c.expect.intent))).toEqual(new Set(["query", "rejected", "none"]));
    expect(cases.length).toBeGreaterThanOrEqual(40);
  });

  it("네 가지 질문과 다섯 가지 기간이 모두 들어 있다", () => {
    const queries = cases.map((c) => c.expect).filter((e) => e.intent === "query");
    expect(new Set(queries.map((e) => e.kind))).toEqual(new Set(["periodTotal", "categoryTotal", "dayList", "incomeTotal"]));
    expect(new Set(queries.map((e) => e.period))).toEqual(new Set(["day", "thisWeek", "lastWeek", "thisMonth", "lastMonth"]));
  });
});

describe(`질문 문장 세트 ${cases.length}건 (오늘 = ${TODAY})`, () => {
  it.each(cases)("$id  $text", ({ text, expect: e }) => {
    const got = parse(text);
    if (e.intent === "none") return expect(got).toBeNull();
    if (e.intent === "rejected") return expect(got).toEqual({ type: "rejected", reason: e.reason });
    expect(got?.type).toBe("query");
    const q = query(text);
    expect({ kind: q.kind, period: q.period, from: q.from, to: q.to, categoryId: q.categoryId, assumed: q.periodAssumed }).toEqual({
      kind: e.kind, period: e.period, from: e.from, to: e.to, categoryId: e.categoryId ?? null, assumed: e.assumed ?? false,
    });
  });
});

describe("질문 인식 — 지켜야 할 것", () => {
  it("금액이 있는 문장은 질문으로 판정되지 않는다", () => {
    for (const text of ["이번 달 식비 30만원", "지출 5만원", "이번 주 얼마 썼지 4500", "어제 뭐 썼지 커피 만원", "합계 12,000원", "수입 300만원"]) {
      expect(parse(text), text).toBeNull();
    }
  });

  it("읽기만 한다 — 결과에 숫자(답)가 없고 기간과 카테고리뿐이다", () => {
    expect(query("이번 달 카페 얼마")).toEqual({
      kind: "categoryTotal", period: "thisMonth", from: "2026-11-01", to: "2026-11-30", categoryId: "cafe", categoryKind: "expense", periodAssumed: false,
    });
  });

  it("지출이 아닌 카테고리는 그 구분과 함께 읽는다", () => {
    expect(query("이번 달 카드값 얼마")).toMatchObject({ categoryId: "card_bill", categoryKind: "transfer" });
    expect(query("이번 달 월급 얼마 들어왔지")).toMatchObject({ categoryId: "salary", categoryKind: "income" });
    expect(query("이번 주 적금 얼마")).toMatchObject({ categoryId: "savings_deposit", categoryKind: "savings" });
  });

  it("알아듣지 못한 낱말이 있으면 전체 합계로 바꿔 답하지 않는다", () => {
    for (const text of ["이번 달 삼성카드 얼마", "이번 달 얼마 남았지", "지난주 그거 얼마"]) expect(rejection(text), text).toBe("unknownWord");
  });

  it("미래는 답하지 않는다 — 낱말로 적든 날짜로 적든", () => {
    for (const text of ["내일 뭐 썼지", "모레 지출", "다음 주 지출", "다음 달 얼마", "이번 달 30일 지출"]) expect(rejection(text), text).toBe("futurePeriod");
  });
});

describe("질문 인식 — 기간", () => {
  it("주는 월요일부터 일요일까지다", () => {
    // 일요일에 물어도 그 주의 월요일부터다
    expect(query("이번 주 지출", "2026-11-29")).toMatchObject({ from: "2026-11-23", to: "2026-11-29" });
    expect(query("지난주 지출", "2026-11-23")).toMatchObject({ from: "2026-11-16", to: "2026-11-22" });
  });

  it("달과 해가 바뀌는 때에도 맞게 센다", () => {
    expect(query("지난달 지출", "2027-01-03")).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
    // 2027-01-03은 일요일 — 이번 주는 12/28(월) ~ 1/3(일)
    expect(query("이번 주 지출", "2027-01-03")).toMatchObject({ from: "2026-12-28", to: "2027-01-03" });
    expect(query("이번 달 지출", "2026-12-10")).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
    expect(query("이번 달 지출", "2028-02-10").to).toBe("2028-02-29"); // 윤년
  });

  it("기간을 적었으면 「이번 달로 읽었다」는 표시가 붙지 않는다", () => {
    expect(query("이번 달 지출").periodAssumed).toBe(false);
    expect(query("지출").periodAssumed).toBe(true);
    expect(query("어제 지출").periodAssumed).toBe(false);
  });
});
