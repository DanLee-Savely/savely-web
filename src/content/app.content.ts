// /app 기록 체험판 화면 문구. 원본: docs/spec/70-mvp-records.md §9(확정 M13) · §6-3(값 표시 이름)
// §9에 없는 것(항목 이름 · 안내 · 자리표시)은 시안 docs/design/app/ 의 문구다. {n} 등은 코드에서 채운다
export const appContent = {
  meta: { title: "세이블리 웹 체험판" },
  notice: "공개 체험판이에요. 누구나 볼 수 있으니 실제 소비 내역이나 개인정보는 적지 마세요.", // N1
  nav: { records: "기록", footer: "세이블리 웹 체험판" },

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
