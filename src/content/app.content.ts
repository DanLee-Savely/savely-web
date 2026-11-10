// /app 기록 체험판 화면 문구. 원본: docs/spec/70-mvp-records.md §9(확정 M13) · §6-3(값 표시 이름)
// §9에 없는 것(항목 이름 · 안내 · 자리표시)은 시안 docs/design/app/ 의 문구다. {n} 등은 코드에서 채운다
export const appContent = {
  meta: { title: "세이블리 웹 체험판" },
  notice: "공개 체험판이에요. 누구나 볼 수 있으니 실제 소비 내역이나 개인정보는 적지 마세요.", // N1
  nav: { home: "홈", records: "기록", calendar: "달력", report: "리포트", footer: "세이블리 웹 체험판" }, // N2

  kinds: { expense: "지출", income: "수입" },
  categories: {
    food: "식비", cafe: "카페", grocery: "마트·생필품", transport: "교통", fuel: "주유", parking: "주차·통행료",
    car: "차량 정비", housing: "주거·관리비", telecom: "통신", shopping: "쇼핑", medical: "병원비", beauty: "미용",
    health: "건강·운동", culture: "문화·여가", subscription: "구독", education: "교육", travel: "여행", alcohol: "술·유흥",
    event: "경조사", pet: "반려동물", baby: "육아", insurance: "보험", etc_expense: "기타",
    salary: "급여", allowance: "용돈", side_income: "부수입", refund: "환급", interest: "이자수익", etc_income: "기타",
  } as Record<string, string>,
  paymentMethods: { cash: "현금", check_card: "체크카드", credit_card: "신용카드", bank_transfer: "계좌이체", other: "기타" } as Record<string, string>,
  reasons: { need: "필요해서", impulse: "충동적", value: "가치소비", fixed: "필수지출", other: "기타" } as Record<string, string>,
  feelings: { proud: "뿌듯", satisfied: "만족", meh: "그냥", unsatisfied: "아쉬움", regret: "후회" } as Record<string, string>,

  list: {
    title: "기록",
    total: "전체 {n}건",
    create: "기록하기",
    hasPhoto: "사진 있음",
    empty: { title: "아직 기록이 없어요", cta: "첫 기록 남기기" }, // X1
    error: { title: "기록을 불러오지 못했어요", retry: "다시 시도" }, // X2
    prev: "이전",
    next: "다음",
  },

  form: {
    createTitle: "기록하기",
    editTitle: "기록 수정",
    backToList: "목록으로",
    backToDetail: "상세로",
    required: "필수",
    labels: {
      kind: "구분", amount: "금액", date: "날짜", title: "내용", memo: "메모", categoryId: "카테고리",
      paymentMethod: "결제수단", reason: "왜 썼나요", feeling: "그때 기분",
    },
    won: "원",
    titlePlaceholder: "예: 점심 김치찌개",
    memoPlaceholder: "남기고 싶은 말이 있다면 적어 주세요",
    more: "더보기 +{n}",
    less: "접기",
    expenseInfo: "지출 정보",
    expenseInfoHint: "선택 · 수입이면 숨겨져요",
    hint: "금액 · 날짜 · 카테고리만 채우면 저장할 수 있어요",
    editHint: "고친 내용은 저장하면 바로 반영돼요",
    cancel: "취소",
    save: "저장하기",
    update: "수정하기",
    saving: "저장 중…",
  },

  photo: {
    title: "사진",
    titleHint: "선택 · 1장",
    drop: "사진을 끌어 놓거나 눌러서 고르세요",
    rule: "JPG · PNG · WEBP · 5MB 이하",
    pick: "사진 고르기",
    change: "바꾸기",
    remove: "삭제",
    privacy: "올리기 전에 사진 속 위치 정보를 지워요. 영수증보다 구매한 물건 사진을 권해요.",
    previewAlt: "고른 사진 미리보기",
    alt: "기록 사진",
    original: "원본 보기",
    none: { title: "첨부한 사진이 없어요", desc: "수정에서 사진을 추가할 수 있어요" }, // X4
    failed: "사진을 불러오지 못했어요", // X5
  },

  notFound: { title: "찾는 기록이 없어요", desc: "삭제됐거나 주소가 잘못됐어요", cta: "목록으로" }, // X3

  confirmDelete: {
    title: "이 기록을 삭제할까요?", // D1
    desc: "삭제하면 되돌릴 수 없어요. 첨부한 사진도 함께 지워져요.",
    cancel: "취소",
    confirm: "삭제",
    deleting: "삭제 중…",
  },

  detail: {
    backToList: "목록으로",
    edit: "수정",
    remove: "삭제",
    empty: "—",
    labels: { date: "날짜", categoryId: "카테고리", paymentMethod: "결제수단", reason: "왜 썼나요", feeling: "그때 기분", memo: "메모" },
    times: "처음 적은 시각 {created} · 마지막으로 고친 시각 {updated}",
  },

  // 홈 · 달력 · 리포트 (§9 H · C · R, 초안 2026-11-10). {M}월 · {n}건 등은 코드에서 채운다
  home: {
    titleZero: "오늘은 아직 적지 않았어요.", // H1
    titleCount: "오늘 {n} 적었어요.", // H2 — {n}: 한 번 · 두 번 … 다섯 번, 6건부터 「6번」
    countWords: ["한 번", "두 번", "세 번", "네 번", "다섯 번"],
    countN: "{n}번",
    emptyToday: "한 건만 적어도 오늘이 시작됩니다", // H3
    emptyCta: "첫 기록 남기기",
    today: "오늘", // H4
    todaySpent: "오늘 쓴 돈",
    allRecords: "기록 전체",
    monthRange: "{M}월 1일 – {D}일",
    monthSpent: "이번 달 쓴 돈",
    income: "수입",
    count: "기록",
    countValue: "{n}건",
    recordCount: "기록 {n}건",
    dailyAverage: "하루 평균 지출",
    last7: "최근 7일 지출",
    top: "{M}월 많이 쓴 곳",
    topEmpty: "기록이 쌓이면 많이 쓴 곳을 보여 드려요", // H5
    report: "리포트",
    calendar: "달력",
  },

  calendar: {
    title: "달력",
    monthLabel: "{Y}년 {M}월",
    prevMonth: "이전 달", // 화면 낭독기용
    nextMonth: "다음 달",
    monthExpense: "{M}월 지출 {amount}원",
    weekdays: ["월", "화", "수", "목", "금", "토", "일"],
    selected: "선택한 날", // C1
    spent: "이 날 쓴 돈",
    recordCount: "기록 {n}건",
    fixedCount: "필수지출 {n}건",
    feeling: "그때 기분",
    add: "이 날 기록 추가",
    empty: "이 날은 기록이 없어요", // C2
    today: "오늘", // C3
    average: "하루 평균",
  },

  report: {
    title: "리포트", // R1
    subtitle: "{M}월 1일 – {D}일 · 기록 {n}건",
    expense: "{M}월 지출",
    income: "수입",
    dailyAverage: "하루 평균 지출",
    weekly: "주별 지출",
    weekRange: "{from}–{to}일",
    maxWeek: "가장 많이 쓴 주 · {range}",
    progress: "진행 중",
    planned: "예정",
    where: "어디에 썼나요",
    total: "합계",
    why: "왜 썼고, 기분은 어땠나요",
    reason: "왜 썼나요",
    feeling: "그때 기분",
    insight: "“{M}월 가장 많이 쓴 곳은 {category}”", // R2 — {category}에 「예요 / 이에요」를 붙인다
    insightSub: "{category} {amount}원 · 전체 지출의 {n}%",
    compare: {
      more: "지난달 같은 기간보다 {amount}원 더 썼어요", // R3
      less: "지난달 같은 기간보다 {amount}원 덜 썼어요",
      same: "지난달 같은 기간과 같아요",
      none: "지난달 기록이 없어서 아직 비교할 수 없어요",
    },
    impulse: "충동적으로 쓴 {n}건 중 {m}건은 ‘아쉬움·후회’였어요", // R4
    empty: "이 달은 기록이 없어요", // R5
    emptyCta: "기록하기",
  },

  toast: {
    created: "기록했어요", // S1
    updated: "수정했어요", // S2
    deleted: "기록을 삭제했어요", // S3
    gone: "이미 삭제된 기록이에요", // S4
  },

  // 칸별 오류: 칸 → 도메인 오류 code → 문구. 목록에 없는 code는 errors.form.SERVER_ERROR(E10)
  errors: {
    amount: { AMOUNT_REQUIRED: "금액을 입력해 주세요", INVALID_AMOUNT: "1원 이상 1조 원 미만으로 입력해 주세요" }, // E1 · E2
    date: { DATE_REQUIRED: "날짜를 골라 주세요", INVALID_DATE: "날짜를 골라 주세요", FUTURE_DATE: "오늘 이후 날짜는 기록할 수 없어요" }, // E13 · E3
    categoryId: { INVALID_CATEGORY: "카테고리를 골라 주세요" }, // E4
    title: { TEXT_TOO_LONG: "내용은 60자까지 쓸 수 있어요" }, // E5
    memo: { TEXT_TOO_LONG: "메모는 200자까지 쓸 수 있어요" }, // E6
    image: { INVALID_IMAGE_TYPE: "JPG, PNG, WEBP 사진만 올릴 수 있어요", IMAGE_TOO_LARGE: "5MB 이하 사진만 올릴 수 있어요" }, // E7 · E8
    form: {
      IMAGE_UPLOAD_FAILED: "사진을 올리지 못했어요. 다시 시도하거나 사진 없이 저장해 주세요", // E9
      SERVER_ERROR: "저장하지 못했어요. 잠시 후 다시 시도해 주세요", // E10
      DELETE_FAILED: "삭제하지 못했어요. 잠시 후 다시 시도해 주세요", // E11
      RATE_LIMITED: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요", // E12
    },
  } as Record<string, Record<string, string>>,
};

/** 도메인 오류 code → 화면 문구 (브라우저 검사 · 서버 결과가 같이 쓴다) */
export const errorMessage = (field: string, code: string): string =>
  appContent.errors[field]?.[code] ?? appContent.errors.form[code] ?? appContent.errors.form.SERVER_ERROR;

/** 문구의 {이름} 자리를 채운다 */
export const fill = (text: string, values: Record<string, string | number>): string =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

/** H2 오늘 기록 건수 말: 1~5건은 「한 번 … 다섯 번」, 6건부터 「6번」 */
export const countWord = (n: number): string => appContent.home.countWords[n - 1] ?? fill(appContent.home.countN, { n });

/** 「식비예요」 · 「교통이에요」 — 마지막 글자에 받침이 있으면 「이에요」 */
export const withCopula = (word: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (code >= 0 && code < 11172 && code % 28 ? "이에요" : "예요");
};
