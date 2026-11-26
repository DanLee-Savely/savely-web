// 대화로 기록하기의 방문자별 표시 — 브라우저 저장소에만 둔다 (80-record-assistant §3, K13 · K14).
// 공용 DB에 두면 한 사람이 답할 때 모든 방문자에게 묻지 않게 되므로 방문자별로 둔다.
// 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 조용히 넘어간다 — 표시가 남지 않을 뿐이다

/** 고정지출 최초 질문을 한 번 보였는가(localStorage) */
const RECURRING_ASKED = "savely.assistant.recurringAsked";
/** 「이번 달은 아니에요」를 누른 달 — { 고정지출 번호: 'YYYY-MM' } (localStorage) */
const RECURRING_SKIPPED = "savely.assistant.recurringSkipped";
/** 채우지 않은 기록 알림에서 「나중에 할게요」를 눌렀는가 — 탭을 닫을 때까지(sessionStorage) */
const UNFILLED_DISMISSED = "savely.assistant.unfilledDismissed";

const read = (store: () => Storage, key: string): string | null => {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
};
const write = (store: () => Storage, key: string, value: string): void => {
  try {
    store().setItem(key, value);
  } catch {
    // 저장소를 쓸 수 없으면 표시를 남기지 않는다
  }
};
const local = () => window.localStorage;
const session = () => window.sessionStorage;

const skipped = (): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(read(local, RECURRING_SKIPPED) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

export const assistantPrefs = {
  recurringAsked: (): boolean => read(local, RECURRING_ASKED) === "1",
  markRecurringAsked: (): void => write(local, RECURRING_ASKED, "1"),
  /** 그 달에 이 항목을 건너뛰기로 했는가 */
  isSkipped: (itemId: string, month: string): boolean => skipped()[itemId] === month,
  skip: (itemId: string, month: string): void => write(local, RECURRING_SKIPPED, JSON.stringify({ ...skipped(), [itemId]: month })),
  unfilledDismissed: (): boolean => read(session, UNFILLED_DISMISSED) === "1",
  dismissUnfilled: (): void => write(session, UNFILLED_DISMISSED, "1"),
};
