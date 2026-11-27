# 세이블리 웹사이트 (savely-web)

출시 전 가계부 앱 「세이블리」의 웹사이트다. 소개 사이트(`/home`)와, 로그인 없이 기록을 적어 보는 기록 체험판(`/app`)이 한 프로젝트에 있다.

- 기록 체험판: https://www.savelyglobal.com/app
- 소개 사이트: https://www.savelyglobal.com/home (둘 다 Cloudflare Workers, 같은 Worker)

## 미션별 제출 범위

### 미션 6 — MVP: 기록 체험판 `/app`
기록을 적고 · 보고 · 고치고 · 지우는 CRUD 한 사이클과, 그 기록만 읽어 모아 보는 화면이다. 왼쪽 메뉴의 화면 4개가 범위다.

| 화면 | 주소 | 내용 |
|---|---|---|
| 홈 | [`/app`](https://www.savelyglobal.com/app) | 오늘 · 이번 달 쓴 돈, 최근 기록 3건, 최근 7일 지출 막대 |
| 기록 | [`/app/records`](https://www.savelyglobal.com/app/records) | 목록(10건씩) · 등록 `/new` · 상세 `/[id]` · 수정 `/[id]/edit` · 삭제, 사진 1장 |
| 달력 | [`/app/calendar`](https://www.savelyglobal.com/app/calendar) | 날짜별 지출, 고른 날의 기록 · 그 날짜로 등록 |
| 리포트 | [`/app/report`](https://www.savelyglobal.com/app/report) | 월 지출 · 수입, 주별 · 카테고리별 비율, 왜 썼고 기분은 어땠는지 |

- **테이블:** D1 `savely-records`의 `records` 하나(`migrations-records/0001_create_records.sql`, 구분은 지출 · 수입). **미션 7에서 추가:** `records`에 구분 4가지 · `card_name` 열, 새 테이블 `cards` · `recurring_items` · `assistant_usage`(`0002_kinds_cards_recurring.sql`)
- **사진 저장:** R2 `savely-record-images` — 버킷 공개 주소 없이 `/app/records/[id]/image`로만 전달
- **QA 결과:** [docs/spec/71-mvp-qa.md](docs/spec/71-mvp-qa.md) — Q1~Q30 통과(2026-11-10). 명세 [70-mvp-records.md](docs/spec/70-mvp-records.md) · 상세 [docs/overview/app-records.md](docs/overview/app-records.md)
- **실행 방법**(전체 명령은 아래 「실행 방법」):

```bash
npm install
npx wrangler d1 migrations apply savely-records --local   # 처음 한 번: 로컬 D1에 기록 테이블 생성
npm run dev    # http://localhost:3000/app (로컬 D1 · R2)
npm test       # 단위 테스트
```

### 미션 7 — OpenAI API 활용: 대화로 기록하기
고도화 기능 요건(유저 기능 · 결제 기능 · OpenAI API 활용 중 1개) 가운데 OpenAI API 활용을 골랐다. 기록 폼의 여러 칸 대신 한 문장으로 적으면 기록 초안 카드를 만들어 주고, 사용자는 확인하고 저장만 한다.

| 하는 일 | 예시 | 처리 |
|---|---|---|
| 기록 초안 만들기 | 「점심 9천원, 커피 4500원」 · 「어제 택시 12000원」 | 규칙 기반 파서가 먼저 읽고, 읽지 못한 부분만 OpenAI로 보낸다(카드에 「AI가 정리」 표시) |
| 초안 확인 · 저장 | 카드를 눌러 고치기 → 「n건 저장하기」 → 확인 창 | 사용자가 눌러야 저장된다. 저장할 때 서버가 도메인 클래스로 다시 검사 |
| 대화로 물어보기 | 「이번 달 카페 얼마」 · 「어제 뭐 썼지」 | 규칙만. 저장된 기록에서 센 숫자로 답한다 |
| 고정지출 · 카드 등록 | 「넷플릭스 17000원 매달 15일 고정지출」 · 「삼성카드 등록해줘」 | 규칙만. 버튼을 눌러야 등록된다 |

- **여는 곳:** 모든 `/app` 화면의 「대화로 기록하기」(오른쪽 패널) · 패널을 연 채로 들어오는 주소 [`/app?chat=1`](https://www.savelyglobal.com/app?chat=1) — 2026-11-26 배포
- **OpenAI 활용:** Responses API · 구조화 출력(`json_schema`, strict) · `store: false` · 시간 제한 10초. 서버에서만 부르고(`DraftOrganizer` → `OpenAiDraftOrganizer`), 응답은 규칙 초안과 같은 검증기(`DraftValidator`)를 거친다. OpenAI가 실패해도 규칙 결과만으로 계속된다
- **키 · 한도 · 개인정보:** 키는 Workers 비밀 값 `OPENAI_API_KEY`, 모델은 변수 `OPENAI_MODEL`. 문장 보내기 1분 20회 · OpenAI 호출 1분 6회 · 하루 300회. 문장과 응답은 저장 · 로깅하지 않는다
- **테이블:** 새 테이블 `cards` · `recurring_items` · `assistant_usage`(날짜별 호출 수만), `records`에 구분 4가지 · `card_name` 열(`migrations-records/0002_kinds_cards_recurring.sql`)
- **QA 결과:** [docs/spec/71-mvp-qa.md](docs/spec/71-mvp-qa.md) — Q31~Q51 통과(2026-11-26), 모바일 앱과 같은 문장 세트 245건 통과. 명세 [80-record-assistant.md](docs/spec/80-record-assistant.md) · 상세 [docs/overview/record-assistant.md](docs/overview/record-assistant.md)
- **실행 방법**(미션 6 명령에 더해):

```bash
cp .dev.vars.example .dev.vars   # OPENAI_API_KEY를 넣는다(없으면 규칙만으로 정리한다)
npm run dev                      # http://localhost:3000/app?chat=1
```

## 미션 안내 스택과의 대응

| 미션 안내 스택 | 세이블리 구현 | 코드에서 바꾸는 지점 | 바꾼 이유 ([00-decisions.md](docs/spec/00-decisions.md)의 번호) |
|---|---|---|---|
| Supabase 테이블 (Postgres) | Cloudflare D1 (SQLite) | `RecordRepository` → `D1RecordRepository` (집계는 `RecordStatsReader` → `D1RecordStatsReader`) | M14: 안내는 Supabase를 명시하지만, 핵심 요건(CRUD를 DB와 안정적으로 연결)을 기준으로 판단. 출시 알림과는 별도 데이터베이스 |
| Supabase Storage | Cloudflare R2 | `ImageStorage` → `R2ImageStorage` | M14(D1과 같은 결정) · M8: 서버에서 바인딩으로만 접근하고, 공개 주소 없이 사진을 서버 경로로 전달 |
| Vercel 배포 | Cloudflare Workers (OpenNext) | `wrangler.jsonc` | F3: 보유한 도메인에서 Cloudflare를 쓰기로 함 · F8: 같은 프로젝트에 `/app*`를 이어 붙임 · F4 · B6 · M12: Vercel 사본을 만들지 않고 주소를 하나로 모음 |
| Supabase Auth (로그인) | 사용 안 함 — 로그인 없는 공개 체험판 | — | M8: 사용자별 권한은 로그인 이후 · M12 · M15: 공개 쓰기라 안내 띠 · 쓰기 요청 제한(IP당 1분 10회) · 검색 제외를 함께 둠 |

`RecordRepository` · `ImageStorage`는 `src/domain/record/`의 인터페이스다. 같은 인터페이스를 쓰는 테스트용 `InMemoryRecordRepository` · `InMemoryImageStorage`가 있어, 저장소를 바꿀 때 바뀌는 곳은 `src/infrastructure/`의 구현체와 조립(`src/infrastructure/container.ts`)뿐이다.

## 더 읽을 문서
미션 범위 밖의 내용과 상세는 `docs/`로 옮겼다(2026-11-27).

| 문서 | 내용 |
|---|---|
| [docs/overview/app-records.md](docs/overview/app-records.md) | 기록 체험판 상세 — 화면별 기능 · 테이블 구조 · 데이터 처리 규칙 · 바인딩과 환경 변수 이름 · 코드 구조 · QA 결과 |
| [docs/overview/record-assistant.md](docs/overview/record-assistant.md) | 대화로 기록하기 상세 — 흐름 · 문장을 읽는 순서 · 기능 · OpenAI 활용 · 개인정보 · 검증 |
| [docs/overview/home-site.md](docs/overview/home-site.md) | 소개 사이트 — 서비스 소개 · 타깃 · 구현한 인터랙션 · 측정과 검색 노출 · 가계부 가이드 · 검색 노출 |
| [docs/overview/decisions-summary.md](docs/overview/decisions-summary.md) | 핵심 결정 요약 표 · 검수 결과 한눈에 |
| [docs/overview/review-log.md](docs/overview/review-log.md) | 검수 기록 — 시안과 달랐던 점과 고친 방법 |
| [docs/overview/figma-mcp.md](docs/overview/figma-mcp.md) | Figma MCP 활용 (호출 기록은 [docs/figma-mcp-log.md](docs/figma-mcp-log.md)) |
| [docs/spec/](docs/spec/) | 명세 원본 — 결정 기록 [00](docs/spec/00-decisions.md) · 체험판 [70](docs/spec/70-mvp-records.md) · QA [71](docs/spec/71-mvp-qa.md) · 대화로 기록하기 [80](docs/spec/80-record-assistant.md). 전체 목록은 [docs/README.md](docs/README.md) |

## 기술 스택
| 영역 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) · React 19 · TypeScript(strict) |
| 스타일 | Tailwind CSS 4 · shadcn/ui(Radix) · lucide-react · 디자인 변수(`src/styles/tokens.css`) |
| 글꼴 | Pretendard(화면 글자) · JetBrains Mono(금액 · 숫자) |
| 배포 | Cloudflare Workers(OpenNext, 라우트 `/home*` · `/_next/*` · `/robots.txt` · `/sitemap.xml`, `/app*`) |
| 저장 | Cloudflare D1(출시 알림 이메일 · 기록 체험판, 서로 다른 데이터베이스) · R2(기록 사진) · Rate Limiting 바인딩 |
| AI | OpenAI Responses API(구조화 출력 `json_schema` · `store: false`) — 서버에서만 호출, 모델은 환경 변수 `OPENAI_MODEL` |
| 검사 | Vitest(도메인 · 상태 클래스 · 문장 세트, D1 쿼리는 Node 내장 SQLite) · Playwright(시안 비교 스크린샷 · QA 자동 점검) · ESLint |

- 구조: 검증 · 저장 · 상태 전이는 클래스(`domain` · `application` · `infrastructure` · `interaction`), 화면은 함수 컴포넌트, 훅은 둘을 잇는 얇은 어댑터
- 문구는 모두 `src/content/home.content.ts`(원본 `docs/spec/content.json`)에서 가져온다
- 경로: 메인은 `src/app/home/` → `/home`. basePath 없이 두어 이후 로그인 후 PC 앱(`/app` 등)을 같은 프로젝트에 이어 붙일 수 있다

## 실행 방법
```bash
npm install
npx wrangler d1 migrations apply savely-waitlist --local   # 처음 한 번: 로컬 D1 테이블 생성(출시 알림)
npx wrangler d1 migrations apply savely-records --local    # 처음 한 번: 로컬 D1 테이블 생성(기록 체험판)
cp .dev.vars.example .dev.vars   # 선택: OpenAI 키를 넣으면 대화로 기록하기가 OpenAI를 쓴다(없으면 규칙만으로 정리)
npm run dev            # http://localhost:3000/home · /app (로컬 D1 · R2 · 요청 제한)
npm run preview        # 배포와 같은 Worker 환경(http://localhost:8787)
npm test               # 단위 테스트
npm run lint
node scripts/compare-design.mjs [섹션]   # 시안 비교 스크린샷 (개발 서버 실행 중, docs/compare/에 저장)
node scripts/qa-records.mjs <폴더>       # QA Q1~Q22 (preview 실행 중, 로컬 데이터를 지운다)
node scripts/qa-dashboard.mjs <폴더>     # QA Q23~Q30
node scripts/qa-assistant.mjs <폴더>     # QA Q31~Q51 (기록 종류 4가지 · 대화로 기록하기 · 패널 밖의 입구 · 소개 사이트 05b 구역)
npm run deploy         # Cloudflare 배포 (권한 필요)
```
