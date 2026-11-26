import type { RecordData } from "../record/RecordEntry";
import type { DraftValidator } from "./DraftValidator";
import type { ParsedDraft } from "./ParsedDraft";
import { RecordDateReader } from "./RecordDateReader";

// 「자주 적는 항목」(A)과 「채우지 않은 기록」(B) — 기록 목록에서 계산만 한다 (앱 record_frequent_items · record_unfilled에서 옮김)
// 웹은 공용 체험판이라 모든 방문자의 기록이 대상이다(80 U-W4). 기록 이력을 바깥(OpenAI 포함)으로 보내지 않는다

/** 「자주 적는 항목」의 기준: 이번 달과 그 앞 두 달 · 3회 이상 · 최대 5개 */
export const FREQUENT_RULES = { months: 3, minCount: 3, maxItems: 5 } as const;
/** 「채우지 않은 기록」의 기준: 오늘을 포함한 최근 7일 · 5줄까지 보여 주고 나머지는 「외 n건」 */
export const UNFILLED_RULES = { days: 7, maxShown: 5 } as const;

/** 자주 적는 항목 하나 — 칩 한 개가 된다. 초안에는 이유 · 기분이 없다(사용자가 그때마다 새로 고른다) */
export type FrequentItem = { draft: ParsedDraft; count: number; lastDate: string };
export type UnfilledRecords = { shown: RecordData[]; total: number };

/** 내용을 견줄 때 쓰는 꼴 — 줄바꿈 · 겹친 빈칸을 하나로 줄인다 */
export const normalizeTitle = (title: string | null): string => (title ?? "").replace(/\s+/g, " ").trim();

/** [today]가 든 달에서 [back]달 앞의 1일 */
export const monthStart = (today: string, back: number): string => RecordDateReader.valid(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - back, 1, false)!;

/** a가 b보다 나중에 적은 기록인가. 같은 날이면 만든 시각, 그것도 같으면 번호 순 */
const newer = (a: RecordData, b: RecordData): number => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);

export class AssistantInsights {
  /**
   * 자주 적는 항목. 같은 항목 = 구분 + 카테고리 + 내용이 같은 기록(금액이 달라도 같은 항목).
   * 내용이 빈 기록 · 내용이 카테고리 이름 그대로인 기록(칩으로 띄워도 무엇인지 알 수 없다) · 구분과 안 맞는 카테고리 · 한도 밖 금액은 뺀다.
   * 칩의 금액 · 결제수단 · 카드 이름은 가장 최근 기록에서 가져온다. [today]는 실제 오늘이다
   */
  static frequent(records: readonly RecordData[], today: string, validator: DraftValidator, names: Readonly<Record<string, string>>): FrequentItem[] {
    const from = monthStart(today, FREQUENT_RULES.months - 1);
    const groups = new Map<string, RecordData[]>();
    for (const r of records) {
      const title = normalizeTitle(r.title);
      if (r.date < from || r.date > today || !title) continue;
      if (r.categoryId !== null && (!names[r.categoryId] || title === names[r.categoryId])) continue;
      const key = `${r.kind}\u0000${r.categoryId ?? ""}\u0000${title}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    const items: FrequentItem[] = [];
    for (const group of groups.values()) {
      if (group.length < FREQUENT_RULES.minCount) continue;
      const latest = [...group].sort(newer)[0];
      const draft = validator.validateOne({ kind: latest.kind, amount: latest.amount, categoryId: latest.categoryId, title: normalizeTitle(latest.title), paymentMethod: latest.paymentMethod, cardName: latest.cardName, date: null });
      // 검증기가 버렸거나 카테고리를 지웠으면(구분 불일치) 칩으로 만들지 않는다
      if (draft && draft.categoryId === latest.categoryId) items.push({ draft, count: group.length, lastDate: latest.date });
    }
    // 횟수 많은 순, 같으면 최근에 적은 것이 앞
    return items.sort((a, b) => b.count - a.count || b.lastDate.localeCompare(a.lastDate)).slice(0, FREQUENT_RULES.maxItems);
  }

  /** 채우지 않은 기록 = 카테고리가 비어 있는 기록(이유 · 기분은 선택 사항이라 세지 않는다). 권유일 뿐이다 */
  static unfilled(records: readonly RecordData[], today: string): UnfilledRecords {
    const from = RecordDateReader.addDays(today, -(UNFILLED_RULES.days - 1));
    const found = records.filter((r) => r.categoryId === null && r.date >= from && r.date <= today).sort(newer);
    return { shown: found.slice(0, UNFILLED_RULES.maxShown), total: found.length };
  }
}
