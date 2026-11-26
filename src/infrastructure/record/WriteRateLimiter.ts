import { RateLimitKey } from "../waitlist/RateLimitKey";

// IP별 요청 제한(Cloudflare Rate Limiting 바인딩). 기록 쓰기는 같은 IP 1분 10회(M15, RECORDS_RATE_LIMITER),
// 대화로 기록하기의 문장 보내기 · OpenAI 호출도 같은 방식으로 센다(80 §7). IP는 판단에만 쓰고 저장하지 않는다. 바인딩이 없으면(로컬) 항상 통과
export class WriteRateLimiter {
  constructor(private readonly binding?: RateLimit) {}

  async allow(ip: string): Promise<boolean> {
    return this.binding ? (await this.binding.limit({ key: RateLimitKey.of(ip) })).success : true;
  }
}
