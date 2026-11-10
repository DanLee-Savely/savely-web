import { RateLimitKey } from "../waitlist/RateLimitKey";

// 기록 쓰기(등록 · 수정 · 삭제) 요청 제한: 같은 IP 1분 10회 (M15, 바인딩 RECORDS_RATE_LIMITER). IP는 판단에만 쓰고 저장하지 않는다
export class WriteRateLimiter {
  constructor(private readonly binding?: RateLimit) {}

  async allow(ip: string): Promise<boolean> {
    return this.binding ? (await this.binding.limit({ key: RateLimitKey.of(ip) })).success : true;
  }
}
