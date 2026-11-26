import { DraftValidator } from "@/domain/assistant/DraftValidator";
import type { Clock } from "@/domain/record/Clock";
import { RECURRING_LIMITS, recurringNameKey } from "@/domain/recurring/RecurringRules";
import { type RecurringInput, RecurringItem, type RecurringItemData, type RecurringItemRepository } from "@/domain/recurring/RecurringItem";

// 고정지출 · 고정수입의 등록 · 수정 · 삭제 · 목록 (80 C). 대화 문장에서 왔든 등록 후보에서 왔든 수정 시트에서 왔든 여기를 거쳐야 저장된다.
// 금액 · 이름 · 카테고리의 한도는 기록 초안과 같은 검증기를 쓴다 — 고정 항목은 결국 기록 초안이 되므로 한도가 달라서는 안 된다

export type RecurringSaveResult =
  | { outcome: "saved"; item: RecurringItemData }
  /** 같은 구분 · 같은 이름의 항목이 이미 있다 — 새로 만들지 않았다 */
  | { outcome: "duplicate"; item: RecurringItemData }
  /** 등록 개수 상한(30개)에 닿았다 */
  | { outcome: "limit" }
  /** 금액 · 이름 · 나가는 날이 한도 밖이거나, 고치려는 항목이 그사이 지워졌다 */
  | { outcome: "invalid" };

const sameName = (all: readonly RecurringItemData[], kind: string, title: string): RecurringItemData | undefined =>
  all.find((i) => i.kind === kind && recurringNameKey(i.title) === recurringNameKey(title));

export class ListRecurringItemsService {
  constructor(private readonly repository: RecurringItemRepository) {}

  execute(): Promise<RecurringItemData[]> {
    return this.repository.list();
  }
}

export class RegisterRecurringItemService {
  private readonly validator: DraftValidator;

  constructor(
    private readonly repository: RecurringItemRepository,
    private readonly clock: Clock,
    private readonly newId: () => string = () => crypto.randomUUID(),
  ) {
    this.validator = new DraftValidator(clock);
  }

  async execute(input: RecurringInput): Promise<RecurringSaveResult> {
    const checked = RecurringItem.check(input, this.validator);
    if (!checked) return { outcome: "invalid" };
    const all = await this.repository.list();
    const same = sameName(all, checked.kind, checked.title);
    if (same) return { outcome: "duplicate", item: same };
    if (all.length >= RECURRING_LIMITS.maxItems) return { outcome: "limit" };
    const now = this.clock.now().toISOString();
    const item: RecurringItemData = { ...checked, id: this.newId(), createdAt: now, updatedAt: now };
    await this.repository.insert(item);
    return { outcome: "saved", item };
  }
}

export class UpdateRecurringItemService {
  private readonly validator: DraftValidator;

  constructor(
    private readonly repository: RecurringItemRepository,
    private readonly clock: Clock,
  ) {
    this.validator = new DraftValidator(clock);
  }

  async execute(id: string, input: RecurringInput): Promise<RecurringSaveResult> {
    const all = await this.repository.list();
    const current = all.find((i) => i.id === id);
    const checked = RecurringItem.check(input, this.validator);
    if (!current || !checked) return { outcome: "invalid" };
    const same = sameName(all.filter((i) => i.id !== id), checked.kind, checked.title);
    if (same) return { outcome: "duplicate", item: same };
    // 화면이 넘긴 값이 아니라 저장돼 있던 번호 · 등록 시각을 지킨다
    const item: RecurringItemData = { ...checked, id: current.id, createdAt: current.createdAt, updatedAt: this.clock.now().toISOString() };
    return (await this.repository.update(item)) ? { outcome: "saved", item } : { outcome: "invalid" };
  }
}

/** 한 항목을 지운다. 한 번에 하나만 지운다 */
export class RemoveRecurringItemService {
  constructor(private readonly repository: RecurringItemRepository) {}

  execute(id: string): Promise<boolean> {
    return this.repository.remove(id);
  }
}
