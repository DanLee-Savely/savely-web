import type { RecordKind } from "../record/RecordEntry";

// 문장에서 뽑아낸 기록 초안 한 건 — 「대화로 기록하기」의 중간 결과 (앱 record_parser.dart에서 옮김)
//
// 초안은 저장된 기록이 아니다. 사용자가 카드에서 확인하고 저장을 눌러야 기록이 된다.
// 소비 이유 · 기분 · 메모 칸이 **일부러 없다.** 이 셋은 사용자가 스스로 고르는 값이라 어떤 파서도(OpenAI 포함) 대신 채우면 안 된다.
// 칸이 없으면 채울 수도 없다(80-record-assistant §1-2 원칙 2).
export type ParsedDraft = {
  kind: RecordKind;
  /** 원 단위 정수 금액 */
  amount: number;
  /** 못 찾았으면 null — 「기타」로 채우지 않는다 */
  categoryId: string | null;
  /** 무엇에 썼는지(기록의 「내용」) */
  title: string | null;
  /** 지출에만 */
  paymentMethod: string | null;
  /** 카드 결제일 때만 */
  cardName: string | null;
  /** 문장에 적힌 날짜 'YYYY-MM-DD'. null이면 화면 날짜로 저장한다. 미래 · 너무 오래된 날짜는 검증기가 버린다 */
  date: string | null;
};

/** 파서가 돌려주는 값. 아직 검증 전이다 — 화면은 CheckedRecordParser를 거친 결과만 쓴다 */
export type ParseResult = {
  drafts: ParsedDraft[];
  /** 해석하지 못한 원문 조각. 사용자에게 그대로 보여 준다 */
  unparsed: string[];
};

/** 문장 해석이 실패한 이유. 화면은 이 값으로 문구를 고른다. 오류에 입력 문장을 싣지 않는다 */
export type ParseFailure = "inputTooLong" | "failed";

/** 파서가 아는 등록 카드. 이름이 문장에 그대로 있을 때만 카드 이름을 채운다 */
export type KnownCard = { name: string; method: string };
