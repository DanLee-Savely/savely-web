import { InvalidEmailError } from "./errors";

// 로컬@도메인.최상위 — 지나치게 엄격하게 막지 않는다 (30-waitlist §3)
const PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 값 객체: 앞뒤 공백 제거 · 소문자로 정규화, 3~254자
export class EmailAddress {
  private constructor(private readonly value: string) {}

  static create(raw: string): EmailAddress {
    const value = raw.trim().toLowerCase();
    if (value.length < 3 || value.length > 254 || !PATTERN.test(value)) throw new InvalidEmailError();
    return new EmailAddress(value);
  }

  static isValid(raw: string): boolean {
    try {
      EmailAddress.create(raw);
      return true;
    } catch {
      return false;
    }
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
