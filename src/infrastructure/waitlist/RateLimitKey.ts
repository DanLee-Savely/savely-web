// 요청 제한 키. IPv6는 한 회선이 /64 블록을 통째로 받으므로 앞 64비트로 묶는다 (보안 점검 2026-10-31)
export class RateLimitKey {
  static of(ip: string): string {
    if (!ip.includes(":") || ip.includes(".")) return ip;
    const [head, tail] = ip.toLowerCase().split("::");
    const h = head ? head.split(":") : [];
    const t = tail ? tail.split(":") : [];
    const full =
      tail === undefined
        ? h
        : [...h, ...Array(8 - h.length - t.length).fill("0"), ...t];
    return `${full
      .slice(0, 4)
      .map((x) => parseInt(x, 16).toString(16))
      .join(":")}::/64`;
  }
}
