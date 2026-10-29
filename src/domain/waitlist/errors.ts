import { DomainError } from "../DomainError";

export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
}

export class ConsentRequiredError extends DomainError {
  readonly code = "CONSENT_REQUIRED";
}
