import { AmountRequiredError, InvalidAmountError } from "./errors";

const MAX = 999_999_999_999;

// 값 객체: 1원 이상 1조 원 미만 정수 (앱 서버 MAX_AMOUNT와 같음, M6). 입력의 쉼표 · 공백은 무시한다
export class Amount {
  private constructor(readonly value: number) {}

  static create(raw: string | number): Amount {
    const digits = String(raw).replace(/[,\s]/g, "");
    if (!digits) throw new AmountRequiredError();
    const value = Number(digits);
    if (!/^\d+$/.test(digits) || value < 1 || value > MAX) throw new InvalidAmountError();
    return new Amount(value);
  }

  equals(other: Amount): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
