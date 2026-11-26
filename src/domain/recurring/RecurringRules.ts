// 고정지출 · 고정수입의 한도와 이름 견주기. 브라우저 코드(문구 · 수정 시트)도 쓰므로 문장 파서와 떼어 둔다 —
// 파서를 함께 가져오면 키워드 사전이 브라우저 묶음에 딸려 들어간다

/** 등록할 수 있는 개수 · 나가는 날의 범위 */
export const RECURRING_LIMITS = { maxItems: 30, minDay: 1, maxDay: 31 } as const;

/** 같은 이름인지 견줄 때 쓰는 꼴 — 빈칸을 하나로 줄이고 영문 대소문자를 무시한다 */
export const recurringNameKey = (title: string): string => title.replace(/\s+/g, " ").trim().toLowerCase();
