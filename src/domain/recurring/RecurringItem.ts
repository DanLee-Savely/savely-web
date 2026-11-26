import type { DraftValidator } from "../assistant/DraftValidator";
import { normalizeTitle } from "../assistant/AssistantInsights";
import type { ParsedDraft } from "../assistant/ParsedDraft";
import { RecordDateReader } from "../assistant/RecordDateReader";
import type { RecordData, RecordKind } from "../record/RecordEntry";
import type { RecurringDraft } from "./RecurringCommandParser";
import { RECURRING_LIMITS, recurringNameKey } from "./RecurringRules";

// 매달 같은 날 나가거나 들어오는 돈 — 사용자가 직접 등록한 것 (앱 recurring_item · recurring_candidates · recurring_due에서 옮김, 80 C)
// 등록해 두어도 기록이 저절로 생기지 않는다. 그날이 되면 묻고, 사용자가 초안 카드를 저장해야 기록이 된다.
// 소비 이유 · 기분 칸이 없다. 「이번 달은 아니에요」(건너뛴 달)는 방문자별로 브라우저에 둔다 — 여기 없다(K14)

/** 등록할 값(화면에서 온 값이라 믿지 않는다) */
export type RecurringInput = {
  kind: string;
  amount: number;
  dayOfMonth: number;
  title: string;
  categoryId: string | null;
  paymentMethod: string | null;
  cardName: string | null;
};
export type RecurringItemData = Omit<RecurringInput, "kind"> & { id: string; kind: RecordKind; createdAt: string; updatedAt: string };
/** 나가는 날이 된 고정지출 한 건. isToday가 아니면 지난 항목이다 — 초안 카드를 dueDate 날짜로 만든다 */
export type RecurringDue = { item: RecurringItemData; dueDate: string; isToday: boolean };

export interface RecurringItemRepository {
  /** 등록한 순서대로 */
  list(): Promise<RecurringItemData[]>;
  insert(item: RecurringItemData): Promise<void>;
  /** 바뀐 행이 없으면(그사이 삭제됨) false */
  update(item: RecurringItemData): Promise<boolean>;
  remove(id: string): Promise<boolean>;
}

/** 고정지출 등록 후보의 기준: 지난달 · 지지난달의 날짜 차이 3일 이내, 5개까지 */
export const CANDIDATE_RULES = { maxDayGap: 3, maxItems: 5 } as const;

const day = (date: string): number => Number(date.slice(8));
const pad = (n: number): string => String(n).padStart(2, "0");

export class RecurringItem {
  /** 한도에 맞춘 값. 살릴 수 없으면 null — 금액이 한도 밖 · 이름이 비었음 · 나가는 날이 1~31 밖. 기록 초안과 같은 검증기를 쓴다 */
  static check(input: RecurringInput, validator: DraftValidator): (Omit<RecurringInput, "kind"> & { kind: RecordKind }) | null {
    if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < RECURRING_LIMITS.minDay || input.dayOfMonth > RECURRING_LIMITS.maxDay) return null;
    const draft = validator.validateOne({ kind: input.kind as RecordKind, amount: input.amount, categoryId: input.categoryId, title: input.title, paymentMethod: input.paymentMethod, cardName: input.cardName, date: null });
    if (!draft || draft.title === null) return null;
    return { kind: draft.kind, amount: draft.amount, dayOfMonth: input.dayOfMonth, title: draft.title, categoryId: draft.categoryId, paymentMethod: draft.paymentMethod, cardName: draft.cardName };
  }

  /** 그 달에 나가는 날짜. 31일처럼 그 달에 없는 날은 말일이다 */
  static dueDate(dayOfMonth: number, year: number, month: number): string {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `${year}-${pad(month)}-${pad(Math.min(dayOfMonth, last))}`;
  }

  /** 고정 항목으로 만드는 기록 초안(이유 · 기분 없음). 날짜는 부르는 쪽이 정한다 */
  static draftOf(item: RecurringItemData, date: string | null): ParsedDraft {
    return { kind: item.kind, amount: item.amount, categoryId: item.categoryId, title: item.title, paymentMethod: item.paymentMethod, cardName: item.cardName, date };
  }

  /**
   * [date](화면 날짜)가 속한 달에서, 나가는 날이 됐는데 아직 기록하지 않은 항목. 나가는 날이 빠른 순.
   * 그 달에 **구분과 내용이 같은 기록**이 있으면 이미 기록한 것이다(내용이 빈 기록은 카테고리 이름으로 견준다 — 앱은 그 이름을 내용에 넣어 둔다).
   * 여기서 기록을 만들지 않는다. 묻기만 한다
   */
  static due(items: readonly RecurringItemData[], monthRecords: readonly RecordData[], date: string, names: Readonly<Record<string, string>>): RecurringDue[] {
    const month = date.slice(0, 7);
    const titleOf = (r: RecordData) => r.title ?? (r.categoryId ? names[r.categoryId] : undefined) ?? "";
    const recorded = new Set(monthRecords.filter((r) => r.date.startsWith(month)).map((r) => `${r.kind}\u0000${recurringNameKey(titleOf(r))}`));
    return items
      .map((item) => ({ item, dueDate: RecurringItem.dueDate(item.dayOfMonth, Number(month.slice(0, 4)), Number(month.slice(5))) }))
      .filter(({ item, dueDate }) => dueDate <= date && !recorded.has(`${item.kind}\u0000${recurringNameKey(item.title)}`))
      .map((d) => ({ ...d, isToday: d.dueDate === date }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  /**
   * 고정지출로 등록할 만한 항목 — 최초 질문에 함께 보여 준다. 권하기만 한다.
   * 후보 = 지난달과 지지난달에 **각각 한 번씩** 적었고 두 날짜의 차이가 3일 이내인 항목(구분 + 카테고리 + 내용이 같은 기록).
   * 내용이 없으면 카테고리 이름을 이름으로 쓴다. 이미 등록한 이름은 뺀다. 금액 큰 순, 같으면 이름 순
   */
  static candidates(records: readonly RecordData[], today: string, registered: readonly RecurringItemData[], validator: DraftValidator, names: Readonly<Record<string, string>>): RecurringDraft[] {
    const [last, prev] = [1, 2].map((back) => RecordDateReader.valid(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - back, 1, false)!.slice(0, 7));
    const titleOf = (r: RecordData): string | null => {
      if (r.categoryId !== null && !names[r.categoryId]) return null;
      return normalizeTitle(r.title) || (r.categoryId ? names[r.categoryId] : null);
    };
    const bucket = (month: string) => {
      const map = new Map<string, RecordData[]>();
      for (const r of records) {
        const title = titleOf(r);
        if (!r.date.startsWith(month) || title === null) continue;
        const key = `${r.kind}\u0000${r.categoryId ?? ""}\u0000${title}`;
        map.set(key, [...(map.get(key) ?? []), r]);
      }
      return map;
    };
    const before = bucket(prev);
    const taken = new Set(registered.map((i) => `${i.kind}\u0000${recurringNameKey(i.title)}`));
    const found: RecurringDraft[] = [];
    for (const [key, rows] of bucket(last)) {
      const earlier = before.get(key);
      if (rows.length !== 1 || earlier?.length !== 1 || Math.abs(day(rows[0].date) - day(earlier[0].date)) > CANDIDATE_RULES.maxDayGap) continue;
      const r = rows[0];
      const draft = validator.validateOne({ kind: r.kind, amount: r.amount, categoryId: r.categoryId, title: titleOf(r), paymentMethod: r.paymentMethod, cardName: r.cardName, date: null });
      // 검증기가 카테고리를 지웠으면(구분과 맞지 않음) 권하지 않는다
      if (!draft || draft.title === null || draft.categoryId !== r.categoryId || taken.has(`${draft.kind}\u0000${recurringNameKey(draft.title)}`)) continue;
      found.push({ draft, dayOfMonth: day(r.date) });
    }
    return found.sort((a, b) => b.draft.amount - a.draft.amount || (a.draft.title! < b.draft.title! ? -1 : 1)).slice(0, CANDIDATE_RULES.maxItems);
  }
}
