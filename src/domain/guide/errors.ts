import { DomainError } from "../DomainError";

export type GuideFormatCode =
  | "MISSING_FRONT_MATTER"
  | "MISSING_FIELD"
  | "INVALID_SLUG"
  | "INVALID_STATUS"
  | "INVALID_DATE"
  | "EMPTY_BODY"
  | "UNSUPPORTED_SYNTAX"
  | "INVALID_LINK"
  | "UTM_ON_INTERNAL_LINK"
  | "DUPLICATE_SLUG";

// 가이드 원고의 형식 오류. 빌드 · 테스트에서 드러나게 하려는 것이라 화면 문구는 없다
export class GuideFormatError extends DomainError {
  constructor(readonly code: GuideFormatCode) {
    super(code);
    this.name = "GuideFormatError";
  }
}
