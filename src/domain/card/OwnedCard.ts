// 등록 카드 — 대화로 등록한 카드 이름(공용 체험판, 80 E). 등록해 두면 「점심 9천원 삼성카드」의 카드 이름을 알아본다
// 웹에서는 등록만 한다(보기 · 삭제는 없다, U-W3)

/** 등록할 수 있는 카드 수 · 이름 길이(앱의 기록 문장에서 카드 이름을 알아보는 한도와 같다) */
export const CARD_LIMITS = { maxCards: 30, maxNameLength: 20 } as const;

export type OwnedCard = { id: string; name: string; method: string; createdAt: string };

export interface CardRepository {
  /** 등록한 순서대로 */
  list(): Promise<OwnedCard[]>;
  /** 같은 이름이 이미 있으면 넣지 않고 false */
  insert(card: OwnedCard): Promise<boolean>;
}
