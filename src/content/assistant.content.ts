import { DRAFT_LIMITS } from "@/domain/assistant/DraftValidator";
import { RecordDateReader } from "@/domain/assistant/RecordDateReader";
import { formatAmount } from "@/lib/recordFormat";

// 「대화로 기록하기」 패널 문구 (docs/spec/80-record-assistant.md §10).
// 모바일 앱의 문구를 그대로 쓴다(정본). 정형 문구다 — 자유 대화처럼 꾸미지 않고, 소비에 대한 평가 · 조언을 넣지 않는다.
// 정산 · 보상이 들어간 앱 문구와 금융지식 팁은 넣지 않았다(K9). 웹에서 새로 필요한 문구는 W1~W3와 「웹」 표시가 붙은 것뿐이다.

const md = (date: string): { M: number; D: number } => ({ M: Number(date.slice(5, 7)), D: Number(date.slice(8)) });
const monthDay = (date: string): string => `${md(date).M}월 ${md(date).D}일`;

export const assistantContent = {
  launcher: "대화로 기록하기", // W1
  title: "대화로 기록하기",
  manualInput: "직접 입력",
  close: "닫기", // 웹 — 닫기(×) 버튼의 화면 낭독기용 이름(초안)
  pastDay: "지난 날 기록",
  example: "예) 점심 9천원, 커피 4500원, 월급 300만원",
  inputHint: "예) 점심 9천원, 월급 300만원",
  send: "보내기",
  parsing: "정리하고 있어요…",
  /** 입력칸 아래 전송 고지 (W2, 확정 2026-11-25) */
  notice: "알아듣지 못한 부분은 정리를 위해 OpenAI로 보내요. 이름 · 연락처 같은 개인정보는 적지 마세요.",
  aiBadge: "AI가 정리", // W3

  greetingDate: "다른 날의 기록은 「어제 커피 만원」처럼 날짜와 함께 적어 주세요",
  greetingMore: "고정지출과 카드도 여기서 등록할 수 있어요",

  amountNotFound: "금액을 찾지 못했어요. 「커피 4500원」처럼 금액을 함께 적어 주세요",
  invalidAmount: "금액이 0원이거나 너무 큰 항목은 뺐어요",
  invalidDate: `오늘보다 뒤이거나 ${DRAFT_LIMITS.maxDaysBack}일보다 오래된 날짜의 항목은 뺐어요`,
  tooMany: `한 번에 ${DRAFT_LIMITS.maxDrafts}건까지 정리할 수 있어요. 나머지는 저장한 뒤 다시 적어 주세요`,
  tooLong: `한 번에 ${DRAFT_LIMITS.maxInputLength}자까지 적을 수 있어요. 나눠서 적어 주세요`,
  parserFailed: "지금은 정리하지 못했어요. 다시 보내 주세요",
  switchToManual: "직접 입력으로 전환",
  saveFailed: "저장하지 못했어요. 정리한 내용은 그대로 있으니 다시 눌러주세요",
  writeMore: "더 적기",
  openCalendar: "달력에서 확인",

  card: {
    noTitle: "내용 없음",
    pickCategory: "카테고리 선택",
    remove: "카드 지우기",
    allRemoved: "카드를 모두 지웠어요",
    saved: "저장됨", // 웹 — 저장을 마친 카드의 체크 표시 이름(초안)
  },

  sheet: {
    title: "항목 수정",
    labels: { kind: "종류", date: "날짜", title: "내용", amount: "금액", categoryId: "카테고리", paymentMethod: "결제수단", cardName: "카드 이름", memo: "메모" },
    titlePlaceholder: "예: 점심 김치찌개",
    cardNamePlaceholder: "예: 삼성카드",
    memoPlaceholder: "선택",
    pickCategory: "카테고리 선택",
    noPayment: "선택 안 함",
    clear: "지우기",
    remove: "삭제",
    apply: "적용",
    needAmount: "금액을 입력해 주세요",
  },

  confirmSave: { title: "이 내용으로 저장할까요?", cancel: "취소", confirm: "확인" },
  confirmExit: {
    title: "작성 중인 기록을 지울까요?",
    desc: "저장하지 않고 나가면 정리한 내용이 사라져요.",
    confirm: "나가기",
    cancel: "계속 작성",
  },
};

const c = assistantContent;

/** 첫 안내 — 지출만이 아니라 수입도 함께 적게 한다. 화면 날짜가 오늘이 아니면 「M월 D일에」 */
export const greeting = (screenDate: string, today: string): string =>
  [`${screenDate === today ? "오늘" : `${monthDay(screenDate)}에`} 쓴 돈과 들어온 돈을 편하게 적어 주세요.`, c.example, c.greetingDate, c.greetingMore].join("\n");

export const draftsReady = (count: number): string => `${count}건으로 정리했어요. 맞는지 확인하고 저장해 주세요`;
export const unparsedNote = (pieces: readonly string[]): string => `이 부분은 알아듣지 못했어요: ${pieces.map((p) => `「${p}」`).join(", ")}`;
export const saveButton = (count: number): string => `${count}건 저장하기`;

/** 날짜 머리말 「10월 26일」 */
export const dateHeader = (date: string): string => monthDay(date);

/** 카드에 적는 날짜 — `어제 · 11월 24일`. [today]는 실제 오늘 */
export const dayLabel = (date: string, today: string): string => {
  const word = { [today]: "오늘", [RecordDateReader.addDays(today, -1)]: "어제", [RecordDateReader.addDays(today, -2)]: "그저께" }[date];
  return word ? `${word} · ${monthDay(date)}` : monthDay(date);
};

/** 저장 확인 창의 줄: 지출 · 수입 합계(0보다 클 때만), 날짜마다 건수 — 날짜를 잘못 읽었으면 여기서 보인다 */
export const confirmLines = (groups: readonly { date: string; cards: readonly { kind: string; amount: number }[] }[]): string[] => {
  const sum = (kind: string) => groups.flatMap((g) => g.cards).filter((x) => x.kind === kind).reduce((s, x) => s + x.amount, 0);
  return [
    ...(sum("expense") > 0 ? [`지출 ${formatAmount(sum("expense"))}원`] : []),
    ...(sum("income") > 0 ? [`수입 ${formatAmount(sum("income"))}원`] : []),
    ...groups.map((g) => `${monthDay(g.date)} · ${g.cards.length}건`),
  ];
};

/** 저장 요약. 한 날짜면 그 날의 지출 합계(이미 있던 기록 포함), 여러 날짜면 날짜별 건수 */
export const savedSummary = (count: number, days: readonly { date: string; count: number }[], dayExpense: number | null, today: string): string => {
  if (days.length === 1 && dayExpense !== null) {
    return `${count}건을 저장했어요. ${days[0].date === today ? "오늘" : monthDay(days[0].date)} 지출 합계 ${formatAmount(dayExpense)}원`;
  }
  return `${count}건을 저장했어요.\n${days.map((d) => `${monthDay(d.date)} ${d.count}건`).join(" · ")}`;
};
