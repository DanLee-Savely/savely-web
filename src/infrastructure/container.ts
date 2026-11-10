import { CreateRecordService } from "@/application/record/CreateRecordService";
import { DeleteRecordService } from "@/application/record/DeleteRecordService";
import { GetHomeSummaryService } from "@/application/record/GetHomeSummaryService";
import { GetMonthCalendarService } from "@/application/record/GetMonthCalendarService";
import { GetMonthlyReportService } from "@/application/record/GetMonthlyReportService";
import { GetRecordService } from "@/application/record/GetRecordService";
import { ListRecordsService } from "@/application/record/ListRecordsService";
import { UpdateRecordService } from "@/application/record/UpdateRecordService";
import { RegisterWaitlistService } from "@/application/waitlist/RegisterWaitlistService";
import type { ImageStorage } from "@/domain/record/ImageStorage";
import { D1RecordRepository } from "./record/D1RecordRepository";
import { D1RecordStatsReader } from "./record/D1RecordStatsReader";
import { R2ImageStorage } from "./record/R2ImageStorage";
import { SystemClock } from "./record/SystemClock";
import { WriteRateLimiter } from "./record/WriteRateLimiter";
import { D1WaitlistRepository } from "./waitlist/D1WaitlistRepository";
import { InMemoryWaitlistRepository } from "./waitlist/InMemoryWaitlistRepository";
import { RateLimitKey } from "./waitlist/RateLimitKey";
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
    allow: async (key) => (env.WAITLIST_RATE_LIMITER ? (await env.WAITLIST_RATE_LIMITER.limit({ key: RateLimitKey.of(key) })).success : true),
    allowedOrigins: (env.WAITLIST_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  };
}

// 기록 체험판 (70-mvp-records §7). 브라우저 폼 검사 · 서버가 같은 시계를 쓴다
export const clock = new SystemClock();

export type RecordsServer = {
  list: ListRecordsService;
  get: GetRecordService;
  create: CreateRecordService;
  update: UpdateRecordService;
  remove: DeleteRecordService;
  home: GetHomeSummaryService;
  calendar: GetMonthCalendarService;
  report: GetMonthlyReportService;
  images: ImageStorage;
  limiter: WriteRateLimiter;
};

// 서버: 바인딩이 없으면 멈춘다(메모리 저장소로 대신하지 않음 — 로컬도 wrangler 로컬 D1 · R2를 쓴다)
export async function createRecordsServer(): Promise<RecordsServer> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  if (!env.RECORDS_DB || !env.RECORD_IMAGES) throw new Error("RECORDS_DB · RECORD_IMAGES 바인딩이 없어요");
  const repository = new D1RecordRepository(env.RECORDS_DB);
  const images = new R2ImageStorage(env.RECORD_IMAGES);
  const stats = new D1RecordStatsReader(env.RECORDS_DB);
  return {
    list: new ListRecordsService(repository),
    get: new GetRecordService(repository),
    create: new CreateRecordService(repository, images, clock),
    update: new UpdateRecordService(repository, images, clock),
    remove: new DeleteRecordService(repository, images),
    home: new GetHomeSummaryService(stats, clock),
    calendar: new GetMonthCalendarService(stats, clock),
    report: new GetMonthlyReportService(stats, clock),
    images,
    limiter: new WriteRateLimiter(env.RECORDS_RATE_LIMITER),
  };
}
