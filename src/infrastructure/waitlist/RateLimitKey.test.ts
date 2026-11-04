import { describe, expect, it } from "vitest";
import { RateLimitKey } from "./RateLimitKey";

describe("RateLimitKey", () => {
  it("IPv4 · IPv4 매핑 주소는 그대로", () => {
    expect(RateLimitKey.of("203.0.113.7")).toBe("203.0.113.7");
    expect(RateLimitKey.of("::ffff:203.0.113.7")).toBe("::ffff:203.0.113.7");
  });

  it("같은 /64의 주소는 같은 키 (축약 · 앞자리 0 · 대소문자 무관)", () => {
    const key = "2001:db8:1:2::/64";
    expect(RateLimitKey.of("2001:db8:1:2::1")).toBe(key);
    expect(RateLimitKey.of("2001:0DB8:0001:0002:aaaa:bbbb:cccc:dddd")).toBe(
      key,
    );
    expect(RateLimitKey.of("2001:db8:1:2:ffff::")).toBe(key);
  });

  it("다른 /64는 다른 키", () => {
    expect(RateLimitKey.of("2001:db8:1:3::1")).not.toBe(
      RateLimitKey.of("2001:db8:1:2::1"),
    );
    expect(RateLimitKey.of("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });
});
