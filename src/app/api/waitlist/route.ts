import { DomainError } from "@/domain/DomainError";
import type { WaitlistResult } from "@/domain/waitlist/WaitlistResult";
import { isWaitlistSource } from "@/domain/waitlist/WaitlistSource";
import { createWaitlistServer } from "@/infrastructure/container";

// POST /home/api/waitlist (30-waitlist §2). 이메일은 로그 · 응답에 넣지 않는다

const cors = (origin: string | null, allowed: string[]): HeadersInit =>
  origin && allowed.includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : { Vary: "Origin" };

const reply = (body: WaitlistResult, status: number, headers: HeadersInit) => Response.json(body, { status, headers });

// 도메인 오류 → 400, 그 밖의 오류 → 500 (오류 코드만 로그에 남긴다)
const toError = (e: unknown): [number, WaitlistResult] => {
  if (e instanceof DomainError) return [400, { ok: false, code: e.code as "INVALID_EMAIL" | "CONSENT_REQUIRED" }];
  console.error("[waitlist] SERVER_ERROR", e instanceof Error ? e.name : typeof e);
  return [500, { ok: false, code: "SERVER_ERROR" }];
};

export async function OPTIONS(req: Request) {
  const { allowedOrigins } = await createWaitlistServer();
  return new Response(null, { status: 204, headers: cors(req.headers.get("origin"), allowedOrigins) });
}

export async function POST(req: Request) {
  const server = await createWaitlistServer();
  const headers = cors(req.headers.get("origin"), server.allowedOrigins);
  // IP는 요청 제한 판단에만 쓰고 저장하지 않는다
  if (!(await server.allow(req.headers.get("cf-connecting-ip") ?? "local")))
    return reply({ ok: false, code: "RATE_LIMITED" }, 429, headers);

  const raw: unknown = await req.json().catch(() => null);
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  try {
    await server.service.execute({
      email: typeof body.email === "string" ? body.email : "",
      consent: body.consent === true,
      source: isWaitlistSource(body.source) ? body.source : null,
    });
    return reply({ ok: true }, 200, headers);
  } catch (e) {
    const [status, result] = toError(e);
    return reply(result, status, headers);
  }
}
