import { DRAFT_LIMITS, DraftValidator } from "@/domain/assistant/DraftValidator";
import { DomainError } from "@/domain/DomainError";
import type { Clock } from "@/domain/record/Clock";
import { RecordDate } from "@/domain/record/RecordDate";
import { type RecordDraft, RecordEntry } from "@/domain/record/RecordEntry";
import type { RecordRepository } from "@/domain/record/RecordRepository";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";

/** 저장할 초안 카드 한 장 — 화면에서 온 값이라 믿지 않는다. id는 브라우저가 카드마다 만든 UUID다(80 K16) */
export type DraftSaveItem = {
  id: string;
  kind: string;
  amount: number;
  /** 문장에 적은 날짜. null이면 화면 날짜 */
  date: string | null;
  categoryId: string | null;
  title: string | null;
  paymentMethod: string | null;
  cardName: string | null;
  reason: string | null;
  feeling: string | null;
  memo: string | null;
};
export type SaveDraftsCommand = { items: DraftSaveItem[]; screenDate: string };
export type SaveDraftsResult = {
  /** 저장한 건수(카드 수) */
  count: number;
  /** 날짜별 건수(날짜 순) */
  days: { date: string; count: number }[];
  /** 한 날짜에만 저장했으면 그 날의 지출 합계(이미 있던 기록 포함), 여러 날짜면 null */
  dayExpense: number | null;
};

/** 저장할 초안 묶음이 받을 수 없는 꼴이다(건수 · 번호 · 날짜 · 칸 값). 무엇이 틀렸는지는 싣지 않는다 */
export class InvalidDraftsError extends DomainError {
  readonly code = "INVALID_DRAFTS";
}

// 초안 카드 여러 장을 한 번에 저장한다 (80-record-assistant §7 — 저장 확인 한 번 = 요청 1회).
// 검증은 기록 폼과 같은 도메인 클래스(RecordEntry)로 한다. 한 장이라도 틀리면 아무것도 저장하지 않는다.
// 같은 번호가 이미 있으면 그 건은 건너뛴다 — 응답을 못 받아 다시 눌러도 중복되지 않는다
export class SaveDraftsService {
  private readonly validator: DraftValidator;

  constructor(
    private readonly repository: RecordRepository,
    private readonly stats: RecordStatsReader,
    private readonly clock: Clock,
  ) {
    this.validator = new DraftValidator(clock);
  }

  async execute({ items, screenDate }: SaveDraftsCommand): Promise<SaveDraftsResult> {
    const entries = this.toEntries(items, screenDate);
    await this.repository.insertMany(entries);
    const days = SaveDraftsService.countByDate(entries);
    const only = days.length === 1 ? days[0].date : null;
    return { count: entries.length, days, dayExpense: only ? ((await this.stats.dailyExpense(only, only))[only] ?? 0) : null };
  }

  private toEntries(items: DraftSaveItem[], screenDate: string): RecordEntry[] {
    const ids = new Set(items.map((i) => i.id));
    const shapeOk = items.length >= 1 && items.length <= DRAFT_LIMITS.maxDrafts && ids.size === items.length && items.every((i) => RecordEntry.isId(i.id));
    // 화면 날짜는 폼과 같은 규칙(미래 불가), 문장에 적은 날짜는 오늘 ~ 30일 전
    const datesOk = DomainError.codeOf(() => RecordDate.create(screenDate, this.clock)) === null && items.every((i) => this.validator.acceptsDate(i.date));
    if (!shapeOk || !datesOk) throw new InvalidDraftsError();
    try {
      return items.map((i) => RecordEntry.create(i.id, SaveDraftsService.toDraft(i, i.date ?? screenDate), this.clock));
    } catch (e) {
      if (e instanceof DomainError) throw new InvalidDraftsError();
      throw e;
    }
  }

  private static toDraft(i: DraftSaveItem, date: string): RecordDraft {
    return {
      kind: i.kind, amount: String(i.amount), date, categoryId: i.categoryId ?? "", title: i.title ?? "", paymentMethod: i.paymentMethod ?? "",
      cardName: i.cardName ?? "", reason: i.reason ?? "", feeling: i.feeling ?? "", memo: i.memo ?? "",
    };
  }

  private static countByDate(entries: RecordEntry[]): { date: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.toData().date, (counts.get(e.toData().date) ?? 0) + 1);
    return [...counts.keys()].sort().map((date) => ({ date, count: counts.get(date)! }));
  }
}
