import { RegisterWaitlistService } from "@/application/waitlist/RegisterWaitlistService";
import { D1WaitlistRepository } from "./waitlist/D1WaitlistRepository";
import { InMemoryWaitlistRepository } from "./waitlist/InMemoryWaitlistRepository";
import { WaitlistApiClient } from "./waitlist/WaitlistApiClient";

// 구현체 조립은 이 파일에서만 한다 (CLAUDE.md §5)

// 브라우저: 실서비스는 같은 도메인(상대 경로), Vercel 배포본은 실서비스 주소로 보낸다
export const waitlistApiClient = new WaitlistApiClient(
  `${process.env.NEXT_PUBLIC_WAITLIST_API_URL ?? ""}/home/api/waitlist`,
);

// 서버: DB(D1) 바인딩이 있으면 D1, 없으면 메모리 저장소 (로컬 개발은 wrangler 로컬 D1을 쓴다)
const memory = new InMemoryWaitlistRepository();

export type WaitlistServer = {
  service: RegisterWaitlistService;
  /** 요청 제한 통과 여부. 바인딩이 없으면(로컬) 항상 통과 */
  allow: (key: string) => Promise<boolean>;
  allowedOrigins: string[];
};

export async function createWaitlistServer(): Promise<WaitlistServer> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  return {
    service: new RegisterWaitlistService(env.DB ? new D1WaitlistRepository(env.DB) : memory),
    allow: async (key) => (env.WAITLIST_RATE_LIMITER ? (await env.WAITLIST_RATE_LIMITER.limit({ key })).success : true),
    allowedOrigins: (env.WAITLIST_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  };
}
