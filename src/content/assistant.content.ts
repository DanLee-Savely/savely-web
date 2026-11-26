import { DRAFT_LIMITS } from "@/domain/assistant/DraftValidator";
import { RecordDateReader } from "@/domain/assistant/RecordDateReader";
import { CARD_LIMITS } from "@/domain/card/OwnedCard";
import { RECURRING_LIMITS } from "@/domain/recurring/RecurringRules";
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
  rateLimited: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요", // 웹 — 기록 폼의 E12와 같은 문구(문장 보내기 제한, K17)
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

  // ── 「할 수 있는 일」(F) · 자주 적는 항목(A) · 채우지 않은 기록(B) ──
  help: { chip: "할 수 있는 일", title: "이런 것들을 적을 수 있어요. 예시를 누르면 입력칸에 채워져요" },
  frequentLabel: "자주 적는 항목",
  unfilledLater: "나중에 할게요",

  // ── 카드 등록(E) ──
  cardDraft: {
    ask: "이 카드를 등록할까요?",
    register: "등록하기",
    registered: "등록됨",
    duplicate: "이미 등록된 카드예요",
    limit: `카드는 ${CARD_LIMITS.maxCards}장까지 등록할 수 있어요`,
    needName: "「삼성카드 등록」처럼 카드 이름을 함께 적어 주세요",
    nameTooLong: `카드 이름은 ${CARD_LIMITS.maxNameLength}자까지 등록할 수 있어요`,
  },

  // ── 고정지출 · 고정수입(C). 통틀어 「고정지출」로 부르고, 수입 항목의 줄에만 「고정수입」으로 적는다 ──
  recurring: {
    ask: "고정지출로 등록할까요?",
    register: "등록하기",
    registered: "등록됨",
    duplicate: "이미 등록돼 있어요",
    limit: `고정지출은 ${RECURRING_LIMITS.maxItems}개까지 등록할 수 있어요`,
    needAmount: "「넷플릭스 17000원 매달 15일 고정지출」처럼 이름과 금액을 함께 적어 주세요",
    needName: "이름을 적어 주세요",
    needDay: "나가는 날을 골라 주세요",
    list: "등록한 고정지출이에요. 눌러서 고치거나 지울 수 있어요",
    empty: "등록한 고정지출이 없어요",
    notFound: "그런 이름의 고정지출을 찾지 못했어요",
    removeAsk: "이 고정지출을 지울까요?",
    removeWhich: "어느 것을 지울까요?",
    remove: "삭제하기",
    keep: "그대로 둘게요",
    removed: "지웠어요. 이제 묻지 않을게요",
    income: "고정수입",
    firstAsk: "매달 나가거나 들어오는 돈이 있나요? 「월세 50만원 25일」처럼 적어 주시면 그날 잊지 않게 물어볼게요",
    candidates: "지난 두 달 모두 적은 항목이에요. 눌러서 등록할 수 있어요",
    askLater: "필요할 때 「고정지출 보여줘」라고 적어 주세요",
    later: "나중에 할게요",
    dueYes: "기록할게요",
    dueEdit: "금액이 달라요",
    dueSkip: "이번 달은 아니에요",
    failed: "저장하지 못했어요. 잠시 후 다시 시도해 주세요", // 웹 — 등록 · 수정 · 삭제가 서버에서 실패했을 때(기록 폼의 E10과 같은 문구)
    sheet: {
      title: "고정지출 수정",
      labels: { kind: "종류", title: "이름", amount: "금액", day: "매달 나가는 날 (1~31)", categoryId: "카테고리", paymentMethod: "결제수단" },
      titlePlaceholder: "예: 통신비",
      dayUnit: "일",
      lastDay: "말일",
      lastDayHint: "31일은 달마다 말일로 계산해요",
      incomplete: "이름·금액·날을 채워 주세요",
    },
  },

  // ── 대화로 물어보기(H). 앱이 답 문구를 정하기 전에 웹이 먼저 정했다(2026-11-26 사용자 확정) — 앱이 정하면 다시 대조한다 ──
  query: {
    periods: { thisWeek: "이번 주", lastWeek: "지난주", thisMonth: "이번 달", lastMonth: "지난달" },
    expense: "지출",
    income: "수입",
    records: "기록",
    empty: "그 기간에는 기록이 없어요",
    unknownWord: "무엇을 묻는지 알아듣지 못했어요. 「이번 달 카페 얼마」처럼 적어 주세요",
    futurePeriod: "아직 오지 않은 날은 답할 수 없어요",
    detail: "자세히 보기",
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

/** 날짜 예시에 쓰는 날 — 오늘에서 이만큼 전. 글자를 고정해 두면 한 달 뒤에는 30일보다 오래된 날짜가 되어 예시가 동작하지 않는다 */
export const HELP_PAST_DAYS = 5;

/** 할 수 있는 일과 예시 문장(F). 예시는 **실제로 그대로 동작하는 문장**이어야 한다 — 테스트가 예시마다 의도한 결과가 나오는지 본다 */
export const helpItems = (today: string): { label: string; examples: string[] }[] => [
  { label: "쓴 돈·들어온 돈 기록하기", examples: ["점심 9천원, 커피 4500원"] },
  // 낱말로도, 날짜로도 적을 수 있다는 것을 둘 다 보여 준다
  { label: "지난 날의 기록 적기", examples: ["어제 커피 만원", `${monthDay(RecordDateReader.addDays(today, -HELP_PAST_DAYS))} 커피 만원`] },
  { label: "금액만 먼저 적고 나중에 채우기", examples: ["4500"] },
  { label: "매달 나가는 돈 등록하기", examples: ["넷플릭스 17000원 매달 15일 고정지출"] },
  { label: "등록한 고정지출 보기·지우기", examples: ["고정지출 보여줘"] },
  { label: "카드 등록하기", examples: ["삼성카드 등록해줘"] },
  // 웹 — 앱 목록에는 아직 없다(2026-11-26 사용자). 합계 · 카테고리 · 그날 목록을 하나씩 보여 준다
  { label: "적은 기록 물어보기", examples: ["이번 달 얼마 썼지", "이번 달 카페 얼마", "어제 뭐 썼지"] },
];

/** 자주 적는 항목 칩 — 금액을 늘 함께 적는다. 긴 내용은 12자로 줄인다(카드에는 전체가 들어간다) */
export const frequentChip = (title: string, amount: number): string => {
  const chars = [...title];
  return `${chars.length > 12 ? `${chars.slice(0, 11).join("")}…` : title} ${formatAmount(amount)}원`;
};

type Asked = { kind: string; period: string; from: string; categoryId: string | null };
/** 질문이 가리킨 기간의 이름 — 「이번 달」 · 「지난주」 · 「어제」 · 「11월 20일」(올해가 아니면 해를 붙인다) */
const queryPeriod = ({ period, from }: Asked, today: string): string => {
  if (period !== "day") return c.query.periods[period as keyof typeof c.query.periods];
  const word = { [today]: "오늘", [RecordDateReader.addDays(today, -1)]: "어제", [RecordDateReader.addDays(today, -2)]: "그저께" }[from];
  return word ?? `${from.slice(0, 4) === today.slice(0, 4) ? "" : `${Number(from.slice(0, 4))}년 `}${monthDay(from)}`;
};
/**
 * 질문의 답 한 줄(H, 초안). 숫자만 답한다 — 평가 · 조언 · 지난 기간과의 비교를 넣지 않는다.
 * `이번 달 지출: 12건, 345,000원` · `이번 달 카페: 3건, 13,500원` · `이번 달 수입: 1건, 3,000,000원` · `어제 기록: 4건, 지출 합계 21,000원`.
 * 기간을 적지 않은 질문도 기간 이름으로 시작하므로 어느 기간의 숫자인지 드러난다
 */
export const queryAnswer = (query: Asked, count: number, sum: number, categoryName: string | null, today: string): string => {
  const period = queryPeriod(query, today);
  if (query.kind === "dayList") return `${period} ${c.query.records}: ${count}건, ${c.query.expense} 합계 ${formatAmount(sum)}원`;
  const subject = query.kind === "categoryTotal" ? categoryName : query.kind === "incomeTotal" ? c.query.income : c.query.expense;
  return `${period} ${subject}: ${count}건, ${formatAmount(sum)}원`;
};

/** 채우지 않은 기록 알림. 권유일 뿐이다 — 재촉하는 말을 넣지 않는다 */
export const unfilledNotice = (count: number): string => `아직 채우지 않은 기록이 ${count}건 있어요. 눌러서 채워 주세요`;
export const unfilledMore = (count: number): string => `외 ${count}건`;
export const cardRegistered = (name: string): string => `등록했어요. 이제 「${name}」라고 적으면 알아볼게요`;

/** `매달 15일` — 31일은 달마다 말일이므로 「말일」이라고 적는다 */
export const recurringDay = (day: number): string => (day >= RECURRING_LIMITS.maxDay ? "매달 말일" : `매달 ${day}일`);
export const recurringRegistered = (day: number): string => `등록했어요. ${recurringDay(day)}에 물어볼게요`;
type Due = { title: string; amount: number; dayOfMonth: number; kind: string };
/** 그날 확인 질문. 자동으로 기록하지 않는다 — 묻기만 한다 */
export const recurringDueAsk = (item: Due): string =>
  `${item.title} ${formatAmount(item.amount)}원 — ${recurringDay(item.dayOfMonth)}에 ${item.kind === "income" ? "들어오는" : "나가는"} 돈이에요. 기록할까요?`;
/** 나가는 날이 지난 항목 — 「기록할게요」를 누르면 그 날짜의 카드가 된다 */
export const recurringOverdue = (item: Due, dueDate: string): string => `지난 ${md(dueDate).D}일의 ${item.title} ${formatAmount(item.amount)}원을 아직 기록하지 않았어요. 기록할까요?`;
