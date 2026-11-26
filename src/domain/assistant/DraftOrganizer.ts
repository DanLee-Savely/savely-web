import type { ParsedDraft } from "./ParsedDraft";

// 규칙 파서가 읽지 못한 부분을 정리해 주는 바깥 도우미(OpenAI) — 80-record-assistant §2 ⑤ · §6
// 여기 오가는 값에는 이유 · 기분 · 메모가 없다(원칙 2). 돌려받은 값은 **믿지 않는다** — 서비스가 공통 검증기로 다시 거른다

export type OrganizeRequest = {
  /** 실제 오늘 · 화면 날짜 ('YYYY-MM-DD', Asia/Seoul) */
  today: string;
  screenDate: string;
  /** 규칙 파서가 읽지 못한 조각. 규칙이 읽은 부분은 보내지 않는다 */
  pieces: string[];
  /** 내용은 있는데 카테고리를 찾지 못한 초안 — 카테고리만 추천받는다(U-W1). 금액만 적은 초안은 넣지 않는다 */
  items: { kind: string; title: string }[];
  /** 등록된 카드 이름. 카드 이름은 이 가운데 하나로만 돌려받는다(K21) */
  cardNames: string[];
};

export type OrganizeResult = {
  /** 조각에서 만든 초안. piece는 pieces의 순번. 검증 전이다 */
  drafts: { piece: number; draft: ParsedDraft }[];
  /** items의 순번별 카테고리 추천. 검증 전이다 */
  categories: { item: number; categoryId: string | null }[];
  /** 이번 호출이 쓴 토큰 수(비용 확인용 숫자). 알 수 없으면 null */
  usage: { input: number; output: number } | null;
};

export interface DraftOrganizer {
  /** 실패는 OrganizeFailedError로만 알린다. 입력 문장을 오류 · 로그에 넣지 않는다 */
  organize(request: OrganizeRequest): Promise<OrganizeResult>;
}

/** 실패한 이유. 로그에는 이 값만 남긴다 */
export type OrganizeFailure = "auth" | "rateLimited" | "quota" | "server" | "timeout" | "format" | "refused";

/** 바깥 도우미가 정리하지 못했다. 사용자에게는 따로 알리지 않는다 — 결과는 규칙만 쓴 것과 같다(W4) */
export class OrganizeFailedError extends Error {
  constructor(readonly failure: OrganizeFailure) {
    super(failure);
    this.name = "OrganizeFailedError";
  }
}

/** 같은 열쇠(IP 등)의 요청을 세어 한도 안인지 알려 준다 */
export interface RequestLimiter {
  allow(key: string): Promise<boolean>;
}

/** 날짜(Asia/Seoul)별 바깥 도우미 호출 수 — 하루 전체 상한(§7) */
export interface AssistantUsage {
  /** 그 날짜의 호출 수가 [limit]보다 작으면 하나 올리고 true. 이미 찼으면 올리지 않고 false */
  tryUse(date: string, limit: number): Promise<boolean>;
}
