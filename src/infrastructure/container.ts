import type { AnalyticsPort } from "@/application/analytics/AnalyticsPort";
import { AssistantFunnel } from "@/application/analytics/AssistantFunnel";
import { HomeFunnel } from "@/application/analytics/HomeFunnel";
import { AnswerRecordQueryService } from "@/application/assistant/AnswerRecordQueryService";
import { GetAssistantEntryService } from "@/application/assistant/GetAssistantEntryService";
import { InterpretSentenceService } from "@/application/assistant/InterpretSentenceService";
import { ListRecurringItemsService, RegisterRecurringItemService, RemoveRecurringItemService, UpdateRecurringItemService } from "@/application/assistant/RecurringItemServices";
import { RegisterCardService } from "@/application/assistant/RegisterCardService";
import { SaveDraftsService } from "@/application/assistant/SaveDraftsService";
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
import { ANALYTICS_HOSTNAME, GA_DEBUG_PARAM, GOOGLE_TAG_ID, INTERNAL_PARAM, NAVER_ANALYTICS_ID } from "@/lib/analytics/config";
import { AnalyticsLoader } from "./analytics/AnalyticsLoader";
import { GtagAnalytics, type GtagWindow } from "./analytics/GtagAnalytics";
import { InternalTraffic } from "./analytics/InternalTraffic";
import { NaverAnalyticsScript, type NaverWindow } from "./analytics/NaverAnalyticsScript";
import { NoopAnalytics } from "./analytics/NoopAnalytics";
import { VisitGate } from "./analytics/VisitGate";
import { D1AssistantUsage } from "./assistant/D1AssistantUsage";
import { D1CardRepository } from "./assistant/D1CardRepository";
import { D1RecurringItemRepository } from "./assistant/D1RecurringItemRepository";
import { OpenAiDraftOrganizer } from "./assistant/OpenAiDraftOrganizer";
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

// 방문 통계 (90-measurement-search §2-2). ID가 비어 있으면 Noop — 아무것도 불러오지 않고 보내지 않는다.
// ID가 있어도 실서비스 주소에서만 보낸다(개발 서버에서는 `?sv_ga_debug=1`을 붙였을 때만 DebugView로 보낸다).
// 쿠키 · 사이트 저장소를 쓸 수 없는 브라우저와 본인 방문 표시가 있는 브라우저에서는 스크립트를 아예 불러오지 않는다(VisitGate, §2-9)
const browser = (): (Window & GtagWindow & NaverWindow) | null => (typeof window === "undefined" ? null : (window as Window & GtagWindow & NaverWindow));
const search = (): string => browser()?.location.search ?? "";
const onProduction = (): boolean => browser()?.location.hostname === ANALYTICS_HOSTNAME;
const gaDebug = (): boolean => process.env.NODE_ENV === "development" && new URLSearchParams(search()).get(GA_DEBUG_PARAM) === "1";
const internalTraffic = new InternalTraffic(INTERNAL_PARAM, () => window.localStorage);
const visitGate = new VisitGate(internalTraffic, { search, cookieEnabled: () => browser()?.navigator.cookieEnabled === true, storage: () => window.localStorage });
const gtagAnalytics = GOOGLE_TAG_ID
  ? new GtagAnalytics({
      tagId: GOOGLE_TAG_ID,
      window: browser,
      enabled: () => (onProduction() || gaDebug()) && visitGate.open,
      debug: gaDebug,
    })
  : null;
const naverAnalytics = NAVER_ANALYTICS_ID ? new NaverAnalyticsScript(NAVER_ANALYTICS_ID, browser) : null;

export const analytics: AnalyticsPort = gtagAnalytics ?? new NoopAnalytics();
/** 루트 레이아웃의 스크립트 로더가 쓴다 */
export const analyticsLoader = new AnalyticsLoader(gtagAnalytics, naverAnalytics, visitGate, { onProduction });
/** 소개 사이트 한 페이지의 흐름. 페이지를 열 때마다 새로 만든다. [guideSlug]는 가이드 글 화면일 때만 */
export const createHomeFunnel = (guideSlug: string | null = null): HomeFunnel => new HomeFunnel(analytics, guideSlug);
/** 체험판 대화 패널의 흐름 */
export const assistantFunnel = new AssistantFunnel(analytics);

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

// 대화로 기록하기 (80-record-assistant). 문장 해석은 서버에서만 한다 — 키워드 사전 · OpenAI 키와 주소가 브라우저로 나가지 않는다
/** 하루 전체 OpenAI 호출 상한(Asia/Seoul 날짜, §7 제안값). 넘으면 그날은 규칙만으로 정리한다 */
const ASSISTANT_DAILY_LIMIT = 300;

export type AssistantServer = {
  interpret: InterpretSentenceService;
  save: SaveDraftsService;
  /** 패널을 열 때 읽는 것: 자주 적는 항목 · 채우지 않은 기록 · 고정지출 질문의 재료 */
  entry: GetAssistantEntryService;
  registerCard: RegisterCardService;
  recurring: { list: ListRecurringItemsService; register: RegisterRecurringItemService; update: UpdateRecurringItemService; remove: RemoveRecurringItemService };
  /** 문장 보내기 제한(같은 IP 1분 20회, K17) */
  sendLimiter: WriteRateLimiter;
  /** 저장 · 카드 등록 · 고정지출 등록 · 수정 · 삭제는 기록 쓰기 제한을 함께 쓴다 — 저장 확인 한 번 = 요청 1회 */
  limiter: WriteRateLimiter;
};

export async function createAssistantServer(): Promise<AssistantServer> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  if (!env.RECORDS_DB) throw new Error("RECORDS_DB 바인딩이 없어요");
  const ai = {
    // 키가 없으면(로컬에 .dev.vars가 없는 경우) 규칙만으로 정리한다
    organizer: env.OPENAI_API_KEY ? new OpenAiDraftOrganizer(env.OPENAI_API_KEY, env.OPENAI_MODEL) : null,
    limiter: new WriteRateLimiter(env.ASSISTANT_RATE_LIMITER),
    usage: new D1AssistantUsage(env.RECORDS_DB),
    dailyLimit: ASSISTANT_DAILY_LIMIT,
    // 로그에는 실패 종류만 남긴다(문장 · 응답 금지, §5-4)
    onFailure: (failure: string) => console.error("[assistant] ORGANIZE_FAILED", failure),
    onUsage: (input: number, output: number) => console.log("[assistant] OPENAI_USAGE", input, output),
  };
  const stats = new D1RecordStatsReader(env.RECORDS_DB);
  const cards = new D1CardRepository(env.RECORDS_DB);
  const recurring = new D1RecurringItemRepository(env.RECORDS_DB);
  return {
    interpret: new InterpretSentenceService(clock, ai, cards, recurring, new AnswerRecordQueryService(stats)),
    save: new SaveDraftsService(new D1RecordRepository(env.RECORDS_DB), stats, clock),
    entry: new GetAssistantEntryService(stats, recurring, clock),
    registerCard: new RegisterCardService(cards, clock),
    recurring: {
      list: new ListRecurringItemsService(recurring),
      register: new RegisterRecurringItemService(recurring, clock),
      update: new UpdateRecurringItemService(recurring, clock),
      remove: new RemoveRecurringItemService(recurring),
    },
    sendLimiter: new WriteRateLimiter(env.ASSISTANT_SEND_RATE_LIMITER),
    limiter: new WriteRateLimiter(env.RECORDS_RATE_LIMITER),
  };
}
