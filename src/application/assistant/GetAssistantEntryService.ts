import { AssistantInsights, type FrequentItem, monthStart, type UnfilledRecords } from "@/domain/assistant/AssistantInsights";
import { DraftValidator } from "@/domain/assistant/DraftValidator";
import { CategoryCatalog } from "@/domain/record/CategoryCatalog";
import type { Clock } from "@/domain/record/Clock";
import { RecordDate } from "@/domain/record/RecordDate";
import type { RecordStatsReader } from "@/domain/record/RecordStatsReader";
import type { RecurringDraft } from "@/domain/recurring/RecurringCommandParser";
import { type RecurringDue, RecurringItem, type RecurringItemData, type RecurringItemRepository } from "@/domain/recurring/RecurringItem";

/** 패널을 열 때 한 번 읽는 것 — 칩과, 먼저 말을 거는 블록의 재료 */
export type AssistantEntry = {
  /** 자주 적는 항목(A) — 입력칸 위 칩 */
  frequent: FrequentItem[];
  /** 채우지 않은 기록(B) */
  unfilled: UnfilledRecords;
  /** 나가는 날이 된 고정지출(C). 「이번 달은 아니에요」로 건너뛴 것은 브라우저가 거른다(방문자별, K14) */
  due: RecurringDue[];
  /** 고정지출 최초 질문의 등록 후보(C) */
  candidates: RecurringDraft[];
  /** 등록한 고정지출 전체 */
  recurring: RecurringItemData[];
};

/** 한 번에 읽는 기록 수 상한 — 공용 체험판이라 석 달 기록이 많을 수 있다 */
const MAX_ROWS = 2000;

// 대화 패널의 진입 재료 (80 A · B · C). 공용 체험판의 기록 · 고정지출 기준이다(U-W4). 계산은 서버 안에서만 하고 바깥으로 보내지 않는다.
// 기준 날짜: 자주 적는 항목 · 채우지 않은 기록 · 등록 후보는 실제 오늘, 그날 질문은 화면 날짜
export class GetAssistantEntryService {
  private readonly validator: DraftValidator;

  constructor(
    private readonly stats: RecordStatsReader,
    private readonly recurring: RecurringItemRepository,
    private readonly clock: Clock,
  ) {
    this.validator = new DraftValidator(clock);
  }

  async execute(rawScreenDate: string): Promise<AssistantEntry> {
    const today = RecordDate.today(this.clock);
    const screenDate = /^\d{4}-\d{2}-\d{2}$/.test(rawScreenDate) && rawScreenDate <= today ? rawScreenDate : today;
    const from = monthStart(today, 2);
    const [entries, items] = await Promise.all([this.stats.recordsBetween(from, today, MAX_ROWS), this.recurring.list()]);
    const rows = entries.map((e) => e.toData());
    const names = CategoryCatalog.names;
    // 화면 날짜가 석 달보다 앞이면(달력에서 고른 옛 날짜) 그 달 기록을 따로 읽는다
    const monthRows = screenDate >= from ? rows : (await this.stats.recordsBetween(`${screenDate.slice(0, 7)}-01`, screenDate, MAX_ROWS)).map((e) => e.toData());
    return {
      frequent: AssistantInsights.frequent(rows, today, this.validator, names),
      unfilled: AssistantInsights.unfilled(rows, today),
      // 지난 항목은 그 날짜의 카드가 된다 — 받을 수 없는 날짜(30일보다 오래됨)면 묻지 않는다
      due: RecurringItem.due(items, monthRows, screenDate, names).filter((d) => d.isToday || this.validator.acceptsDate(d.dueDate)),
      candidates: RecurringItem.candidates(rows, today, items, this.validator, names),
      recurring: items,
    };
  }
}
