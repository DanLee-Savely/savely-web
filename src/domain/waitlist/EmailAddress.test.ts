import { describe, expect, it } from "vitest";
import { EmailAddress } from "./EmailAddress";
import { InvalidEmailError } from "./errors";

describe("EmailAddress", () => {
  it("앞뒤 공백을 지우고 소문자로 바꾼다", () => {
    expect(EmailAddress.create("  Savely@Example.COM ").toString()).toBe("savely@example.com");
  });

  it("같은 주소는 equals가 true", () => {
    expect(EmailAddress.create("a@b.co").equals(EmailAddress.create("A@B.CO"))).toBe(true);
  });

  it.each(["", "ab", "savely", "savely@", "@example.com", "savely@example", "sav ely@example.com", "a@b@c.com"])(
    "잘못된 형식 %j 은 InvalidEmailError",
    (raw) => {
      expect(() => EmailAddress.create(raw)).toThrow(InvalidEmailError);
      expect(EmailAddress.isValid(raw)).toBe(false);
    },
  );

  it("254자까지 받고 255자는 거부한다", () => {
    const at = (n: number) => `${"a".repeat(n - "@example.com".length)}@example.com`;
    expect(EmailAddress.isValid(at(254))).toBe(true);
    expect(EmailAddress.isValid(at(255))).toBe(false);
  });

  it("오류 메시지에 입력한 이메일이 들어가지 않는다", () => {
    try {
      EmailAddress.create("secret@nowhere");
    } catch (e) {
      expect(String(e)).not.toContain("secret");
    }
  });
});
