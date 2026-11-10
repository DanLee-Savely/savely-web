import { DomainError } from "../DomainError";
import type { RecordFieldErrors } from "./RecordEntry";

// 기록 도메인 오류 (70-mvp-records §7). 화면 문구 변환은 app/app/records/actions.ts 한 곳에서만 한다

export class AmountRequiredError extends DomainError {
  readonly code = "AMOUNT_REQUIRED";
}

export class InvalidAmountError extends DomainError {
  readonly code = "INVALID_AMOUNT";
}

export class DateRequiredError extends DomainError {
  readonly code = "DATE_REQUIRED";
}

export class InvalidDateError extends DomainError {
  readonly code = "INVALID_DATE";
}

export class FutureDateError extends DomainError {
  readonly code = "FUTURE_DATE";
}

export class InvalidCategoryError extends DomainError {
  readonly code = "INVALID_CATEGORY";
}

/** 구분 · 결제수단 · 왜 썼나요 · 기분이 목록 밖 값 (정상 화면에서는 생기지 않음) */
export class InvalidOptionError extends DomainError {
  readonly code = "INVALID_OPTION";
}

export class TextTooLongError extends DomainError {
  readonly code = "TEXT_TOO_LONG";
}

export class InvalidImageTypeError extends DomainError {
  readonly code = "INVALID_IMAGE_TYPE";
}

export class ImageTooLargeError extends DomainError {
  readonly code = "IMAGE_TOO_LARGE";
}

export class ImageUploadError extends DomainError {
  readonly code = "IMAGE_UPLOAD_FAILED";
}

export class RecordNotFoundError extends DomainError {
  readonly code = "RECORD_NOT_FOUND";
}

/** 칸별 오류 모음. 값은 위 오류들의 code */
export class InvalidRecordError extends DomainError {
  readonly code = "INVALID_RECORD";

  constructor(readonly errors: RecordFieldErrors) {
    super();
  }
}
