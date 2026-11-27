# 기록 체험판 `/app`

> README에서 옮겨 온 문서다(2026-11-27). 본문의 파일 경로는 저장소 루트 기준이다. 돌아가기: [README](../../README.md)

명세 원본: `docs/spec/70-mvp-records.md` · QA 결과: `docs/spec/71-mvp-qa.md` · 시안: `docs/design/app/`

> 2026-11-26: 기록 종류가 4가지(지출 · 수입 · 상환 · 저축), 카테고리가 41종이 됐고 카테고리는 선택 사항이 됐다. 명세 `docs/spec/80-record-assistant.md`가 `70`보다 우선한다.

세이블리의 출발점인 「직접 적는다」를 웹에서 검증한다. 로그인 없이 누구나 같은 데이터를 보고 고치는 **공개 체험판**이라, 모든 화면 위에 「실제 소비 내역 · 개인정보를 적지 말라」는 안내 띠를 두고 검색에서 뺐다(noindex).

## 배포
- 기록 체험판(Cloudflare Workers): https://www.savelyglobal.com/app — 2026-11-10 배포, 같은 Worker의 `/app*` 라우트
  - 홈 `/app` · 기록 `/app/records` · 달력 `/app/calendar` · 리포트 `/app/report`
  - 소개 사이트 히어로의 「웹에서 체험하기」(PC)로 들어가고, 체험판 왼쪽 위 로고로 소개 사이트에 돌아온다
  - 대화로 기록하기 · 기록 종류 4가지: 2026-11-26 배포. 모든 `/app` 화면 오른쪽 아래 「대화로 기록하기」 버튼으로 연다
  - 패널로 들어가는 길 강조(홈 주 버튼 · 한 줄 입력칸 · 예시 칩 · 폼의 「대화로 적기」 · `/app?chat=1`)와 소개 사이트 「대화로 기록하기」 구역: 2026-11-26 배포

## 핵심 기능
왼쪽 메뉴: 홈 · 기록 · 달력 · 리포트. 정산 · 연속 정산 · 보상 · AI 리포트 · 예산 · 멤버십은 로그인 이후라 만들지 않았다(00-decisions M17 · M18).

| 화면 | 주소 | 내용 |
|---|---|---|
| 홈 | `/app` | 「오늘 세 번 적었어요.」(오늘 건수에 따라) · 오늘 쓴 돈과 최근 3건 · 이번 달 쓴 돈 · 수입 · 기록 · 하루 평균 · 최근 7일 지출 막대 · 이번 달 많이 쓴 곳 상위 3 |
| 달력 | `/app/calendar?month=&date=` | 월요일 시작 칸에 날짜별 지출, 달 이동(미래 달 없음), 선택한 날의 쓴 돈 · 기록 · 필수지출 건수 · 기분 집계 · 「이 날 기록 추가」(그 날짜로 등록) |
| 리포트 | `/app/report?month=` | 월 지출 · 수입 · 하루 평균 · 지난달 같은 기간 비교 · 가장 많이 쓴 곳, 주별 지출(1–7 … 29–말일, 진행 중 · 예정), 카테고리별 비율, 왜 썼고 기분은 어땠나요 · 충동 인사이트 |
| 목록 | `/app/records?page=N` | 날짜 최신순 10건씩, 이전 · 번호(최대 5개) · 다음. 빈 상태 · 로딩(회색 막대 10줄) · 불러오기 오류 + 「다시 시도」 |
| 등록 | `/app/records/new` | 구분(지출 · 수입 · 상환 · 저축) · 금액 · 날짜(필수), 카테고리(선택, 먼저 12개 + 더보기) · 내용 60자 · 메모 200자 · 결제수단 · 카드 이름(카드 결제일 때만, 20자) · 왜 썼나요 · 그때 기분 · 사진 1장(선택). 지출이 아니면 지출 전용 칸 숨김 |
| 상세 | `/app/records/[id]` | 모든 항목(빈 항목은 「—」) · 사진(원본 새 탭) · 처음 적은 시각 · 고친 시각, 「수정」 · 「삭제」(확인 창) |
| 수정 | `/app/records/[id]/edit` | 등록과 같은 폼에 기존 값, 사진 바꾸기 · 삭제 |
| 사진 | `/app/records/[id]/image` | R2에서 꺼내 전달(버킷 공개 주소 없음) |
| 없는 기록 | — | 「찾는 기록이 없어요」, HTTP 404 |

- 검증은 브라우저와 서버가 **같은 도메인 클래스**(`RecordEntry.check`)로 한다. 칸별 오류 문구, 첫 오류 칸으로 포커스, 저장 중에는 입력 잠금 · 두 번 저장 방지
- 저장 · 수정 · 삭제 뒤 알림(「기록했어요」 등 3초), 쓰기 요청 제한(IP당 1분 10회, 넘으면 「요청이 너무 많아요」)
- 홈 · 달력 · 리포트는 기록 테이블만 읽어 계산한다(`record_date BETWEEN ? AND ?` 집계). 금액 · 막대 · 비율은 **지출만**, 수입은 「수입」 줄에만(M19), 「기록 n건」은 4종 모두(K3). 카테고리를 고르지 않은 지출은 「기타」에 합친다(K5). 「오늘」 · 「이번 달」은 Asia/Seoul
- 금액 표기: 수입만 `+`와 초록, 상환은 흐린 색, 지출 · 저축은 부호 없이 기본색(K2)
- 사진은 브라우저에서 긴 변 1600px JPEG로 다시 저장해 찍은 위치(GPS) 등 EXIF를 지운 뒤 올린다. 서버는 파일 앞부분 바이트로 JPG · PNG · WEBP · 5MB 이하를 다시 확인한다
- 소개 사이트 히어로에 「웹에서 체험하기」(PC만) → `/app`

## 테이블 구조 (D1 `savely-records`, `migrations-records/0001_create_records.sql` → `0002_kinds_cards_recurring.sql`)
| 열 | 타입 | 규칙 |
|---|---|---|
| `id` | TEXT PK | UUID(서버 생성 — 대화 저장만 초안 카드마다 브라우저가 만든다. 다시 눌러도 중복되지 않게, K16) |
| `kind` | TEXT | `expense` · `income` · `transfer`(상환) · `savings`(저축) |
| `amount` | INTEGER | 1 ~ 999,999,999,999 |
| `record_date` | TEXT | `'YYYY-MM-DD'`(한국 날짜), 미래 불가는 서버 코드에서 |
| `category_id` | TEXT | 지출 24 · 수입 6 · 상환 3 · 저축 8 = 41개 값, 비어 있을 수 있음(구분과 일치는 서버 코드에서) |
| `title` · `memo` | TEXT | 60자 · 200자 |
| `payment_method` · `reason` · `feeling` | TEXT | 값 목록, 지출만(지출이 아니면 NULL — CHECK 제약) |
| `card_name` | TEXT | 카드 이름 20자, 카드 결제(신용 · 체크)일 때만(CHECK 제약) |
| `image_key` | TEXT | R2 키 `{기록 id}/{uuid}.{확장자}`(원래 파일 이름 저장 안 함) |
| `created_at` · `updated_at` | TEXT | ISO 8601 UTC, 서버 코드가 넣음 |

인덱스 `records_date_idx (record_date DESC, created_at DESC)` — 목록 정렬 · 페이지 나누기용

마이그레이션 `0002`가 더한 테이블(대화로 기록하기용):

| 테이블 | 내용 |
|---|---|
| `cards` | 등록한 카드(이름 20자 · 신용/체크), 이름 중복 불가, 30장까지 |
| `recurring_items` | 고정지출 · 고정수입(이름 · 금액 · 매달 나가는 날 · 카테고리 · 결제수단), 같은 구분 안에서 이름 중복 불가, 30개까지 |
| `assistant_usage` | 날짜(Asia/Seoul)별 OpenAI 호출 수 — 하루 상한용. 문장이나 응답은 들어가지 않는다 |

## 데이터 처리 규칙
- D1 · R2는 서버 코드에서 Cloudflare **바인딩**으로만 접근한다(`src/infrastructure/container.ts`). 브라우저에는 데이터베이스 · 버킷 주소나 키가 없다
- SQL은 바인딩 파라미터(`?1`…)만 쓴다. DB CHECK 제약은 마지막 방어선
- 「오늘」은 Asia/Seoul 기준, 날짜는 문자열 그대로 다룬다
- 로그에는 기록 id와 오류 종류만 남긴다(금액 · 내용 · 메모 금지)
- 출시 알림 D1(실제 이메일)과 **다른 데이터베이스**다

## 바인딩 · 환경 변수 이름 (값은 `wrangler.jsonc` · 대시보드. 비밀 값은 이름만 적는다)
| 이름 | 종류 | 용도 |
|---|---|---|
| `RECORDS_DB` | D1 | 기록 테이블 |
| `RECORD_IMAGES` | R2 | 기록 사진 |
| `RECORDS_RATE_LIMITER` | Rate Limiting | 쓰기 요청 제한(IP당 1분 10회 — 기록 · 대화 저장 · 카드 · 고정지출) |
| `ASSISTANT_SEND_RATE_LIMITER` | Rate Limiting | 대화 문장 보내기 제한(IP당 1분 20회) |
| `ASSISTANT_RATE_LIMITER` | Rate Limiting | OpenAI 호출 제한(IP당 1분 6회) |
| `OPENAI_MODEL` | 변수 | OpenAI 모델 이름 |
| `OPENAI_API_KEY` | 비밀 값 | OpenAI 키 — `wrangler secret put`으로 넣고, 로컬은 `.dev.vars`(본보기 `.dev.vars.example`). 저장소에 넣지 않는다 |
| `DB` · `WAITLIST_RATE_LIMITER` · `WAITLIST_ALLOWED_ORIGINS` | D1 · Rate Limiting · 변수 | 출시 알림 |

## 코드 구조
- domain: `RecordEntry` · `Amount` · `RecordDate` · `RecordTitle` · `RecordMemo` · `ImageFile` · `CategoryCatalog` · `MonthKey`(달) · `WeekBuckets`(주 구간) · `RecordRepository` · `RecordStatsReader`(집계) · `ImageStorage` · 도메인 오류
- application: 유스케이스 하나 = 클래스 하나(`Create` · `List` · `Get` · `Update` · `DeleteRecordService`, `GetHomeSummary` · `GetMonthCalendar` · `GetMonthlyReportService`)
- infrastructure: `D1RecordRepository` · `D1RecordStatsReader` · `R2ImageStorage` · `WriteRateLimiter`(테스트 전용 InMemory 3개)
- interaction: `RecordFormFlow`(폼 상태 · 칸별 오류) · `PageWindow`(페이지 번호)
- 화면: Server Actions(`src/app/app/records/actions.ts`) · 재사용 컴포넌트(`src/components/app/`), 문구는 `src/content/app.content.ts`

## QA 결과 (2026-11-10 · 2026-11-26, 로컬 preview)
> 로컬 preview에서만 보이는 것: 폼 저장 직후 스크립트 5개가 404로 찍히고 화면이 한 번 새로 열린다. 로컬 서버가 저장 뒤 이동할 화면 정보를 실서비스 주소에 물어봐서 실서비스 빌드의 파일 이름이 돌아오기 때문이다(wrangler가 라우트의 주소를 요청 주소로 쓴다). 실서비스에서는 생기지 않는다.

**2026-11-26:** Q1~Q30을 다시 돌려 모두 통과했고, 기록 종류 4가지 · 대화로 기록하기 항목 Q31~Q44(14개)를 더해 **44개 통과**했다([대화로 기록하기](record-assistant.md)). 같은 날 패널 밖의 입구 · 소개 사이트 새 구역 항목 Q45~Q51(7개)을 더하고 전체를 다시 돌려 **51개 통과**했다.

2026-11-10: Q1~Q30 **30개 통과**(홈 · 달력 · 리포트를 더한 뒤 Q1~Q22도 다시 통과). 홈 제목 · 세 화면 합계 일치 · 수입 제외 · 달 이동 · 날짜 선택 → 등록 · 28/30/31일 주 구간 · 빈 상태 · 한국 날짜 기준 — 빈 값 · 잘못된 형식 · 서버 검증(요청 본문 조작) · 두 번 저장 · 새로고침 · 수정 · 구분 전환 · 삭제 · 없는 주소(404) · 사진 형식 · 크기 · 오프라인 · 페이지 나누기 · 빈 목록 · 로딩 · 오류 · 저장소 직접 접근 · 사진 위치 정보 · 날짜 경계 · 요청 제한 · 데이터베이스 분리. 상세는 `docs/spec/71-mvp-qa.md`
