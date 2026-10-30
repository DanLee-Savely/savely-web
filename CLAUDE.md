# CLAUDE.md — 세이블리 소개 사이트 (savely-web)

이 저장소에서 일하는 에이전트가 매 세션 가장 먼저 읽는 규칙이다. 여기 규칙이 일반 관행보다 우선한다.
규칙과 요청이 충돌하거나, 문서에 없는 결정이 필요하면 멈추고 사용자에게 묻는다.

## 1. 무엇을 만드는가
- **서비스:** 세이블리(Savely) — 직접 적으며 소비를 돌아보는 가계부 앱 (iOS · Android, **출시 전**)
- **이 저장소:** 세이블리 소개 사이트 HOME(랜딩 페이지). 코드잇 스프린트 미션 5
  - 기획 → 디자인 반영 → 구현 → 검수 → 배포를 완주하는 과제다
  - 미션 6에서 MVP로 확장한다
- **흐름:** 문제(돌아볼 틈 없이 같은 한 달이 반복) → 해결(적고 · 마감하고 · 돌아보는 습관을 만드는 가계부 + 습관을 돕는 포인트) → 기대효과(한 달이 달라짐)
- **핵심 행동(CTA):** 「출시 알림 신청」 — 이메일을 남기면 출시 소식을 먼저 받는다. 앱 다운로드 · 스토어 링크는 없다.
- **타깃 (초안 · 확정 필요):** 가계부를 써 봤지만 오래 못 간 사람 / 월말 카드값에 놀라는 일이 반복되는 사람 / 가족 소비를 함께 돌아보고 싶은 사람

## 2. 반드시 먼저 읽을 문서 (작업 종류별)

| 작업 | 읽을 문서 |
|---|---|
| 어떤 결정이든 | `docs/spec/00-decisions.md` (결정 기록 · 미결정 목록) |
| 섹션 구현 | `docs/spec/10-sections.md`, `docs/spec/content.json`, `docs/spec/20-interactions.md` + 시안 이미지 `docs/design/` — 절차는 스킬 `implement-section` |
| 출시 알림 · API · 개인정보 | `docs/spec/30-waitlist.md` |
| 프로젝트 생성 · 배포 | `docs/spec/40-deploy.md` |
| 검수 | `docs/spec/50-acceptance.md` |
| 상세 수치 원본 | `docs/figma/*.txt`, `docs/figma/tokens.json` (Figma에서 추출한 구조 덤프) |

- 경로별 규칙은 `.claude/rules/`에 있다(디자인 시스템 · 객체 지향 구조 · 출시 알림 개인정보 · 문구). 해당 파일을 만질 때 자동으로 적용된다.

## 3. 디자인 원본과 Figma MCP
- **Figma 파일:** `Yzb7zX5G3QrRlxhTzkZzS0` (세이블리 PC)
- **구현 기준 = 라이트(화이트 · 그린) 프로토타입.** UI 정적 시안과 다르면 프로토타입을 따른다(10-sections.md 참고).

| 대상 | 노드 ID |
|---|---|
| 라이트 프로토타입 페이지 / PC / 모바일 | `70:2269` / `70:2938` / `70:3056` |
| UI 라이트 PC / 모바일 (정적) | `70:1816` / `70:2055` |
| PC 섹션: GNB · S01 · S02 · S03 · S04 · S05 · S06 · S07 · S11 · Footer | `70:1817` · `70:1818` · `70:1829` · `70:1845` · `70:1885` · `70:1915` · `70:1942` · `70:1970` · `70:2015` · `70:2019` |
| 모바일 섹션 (같은 순서) | `70:2056` · `70:2064` · `70:2075` · `70:2091` · `70:2128` · `70:2158` · `70:2185` · `70:2213` · `70:2240` · `70:2244` |
| 인터랙션 세트 | 출시 알림 모달 `70:2270` · 시트 `70:2313` · 공감 `70:2362`/`70:2435` · 문제 `70:2508` · 보상 `70:2609`/`70:2666` · 해결 `70:2723` · 수치 `70:2784` · 전후 `70:2851`/`70:2896` · 히어로 `78:3604`/`81:3760` |

- **MCP 한도:** 무료 요금제 MCP 호출 월 20회. 먼저 `docs/figma/`의 추출본과 `docs/design/` 이미지를 쓴다.
  - MCP는 섹션당 최대 1회(`get_design_context`)만 쓰고, 결과는 `docs/figma/<노드ID>.md`에 저장한다.
  - 호출할 때마다 `docs/figma-mcp-log.md`에 기록한다.
- MCP가 준 코드는 참고용이다. 이 문서의 구조 · 토큰 규칙에 맞게 다시 쓴다.

## 4. 기술 스택과 배포 (상세: 40-deploy.md)
- Next.js App Router + TypeScript(strict) + Tailwind CSS + shadcn/ui, lucide-react
- 글꼴: Pretendard(화면 글자) · JetBrains Mono(금액 · 숫자). Figma는 Noto Sans KR로 그려서 1~2px 차이는 허용한다.
- **basePath 없음 (2026-10-30, 00-decisions F8).** 메인은 `src/app/home/` → `/home`, 이후 앱은 같은 프로젝트의 `/app` 등에 붙인다. 링크 · 이미지 문자열 경로는 `/home/...`처럼 실제 경로를 그대로 쓴다.
- **실서비스:** Cloudflare Workers(OpenNext) — 라우트 `www.savelyglobal.com/home*` · `/_next/*`(새 경로가 생기면 그 경로만 추가, 예 `/app*`). 출시 알림 저장은 D1(바인딩 `DB`)
- **제출용:** Vercel(같은 저장소 자동 배포). 폼은 실서비스 API로 보낸다(CORS 허용 목록).
- **색 모드:** 라이트 고정. 다크 토큰은 정의만 두고 전환은 켜지 않는다.

## 5. 코드 구조 — 객체 지향
- domain · application · infrastructure · interaction 계층은 **클래스**로 만든다.
  - 캡슐화, 생성자 주입(인터페이스), 단일 책임
  - 구현체 조립은 `src/infrastructure/container.ts` 한 곳에서만 한다
- 화면은 **React 함수 컴포넌트**로 만든다(React 공식 문서가 새 코드에 클래스 컴포넌트를 권장하지 않음).
  - 컴포넌트는 표시와 입력 전달만 한다. 검증 · 저장 · fetch · 상태 전이는 클래스에 둔다.
  - 훅은 클래스를 화면에 연결하는 얇은 어댑터다.
```
src/
  app/            layout(루트) · home/{page · privacy/page · api/waitlist/route.ts · icon.png} (얇게). 앱은 이후 app/app/ 등
  domain/         EmailAddress · WaitlistEntry · WaitlistRepository(인터페이스) · 오류 클래스
  application/    RegisterWaitlistService
  infrastructure/ D1WaitlistRepository · InMemoryWaitlistRepository · WaitlistApiClient · container.ts
  interaction/    WaitlistFormFlow · CarouselCursor · StepSequencer (React 무관 상태 클래스)
  content/        home.content.ts (← docs/spec/content.json)
  components/     ui(shadcn) · common(재사용) · sections(섹션별) · interactive(인터랙션)
  styles/         tokens.css (← docs/spec/tokens.css)
```
- 금지: `any`, 컴포넌트 안 직접 fetch, 전역 가변 상태, 컴포넌트에 문구 · 16진수 색 하드코딩

## 6. 문구 규칙 (요약 — 전체: `.claude/rules/copy-wording.md`)
- 문구 원본은 `docs/spec/content.json`이다. 바꾸려면 사용자에게 먼저 묻는다.
- 「세이블리 포인트」만 쓴다(`SVX` 금지).
- 금지 표현: 가상자산 · 토큰 · 코인 · 블록체인 · 출금 · 현금처럼 · 정액 보장 · 수익 · 투자
- 마켓 오픈 날짜를 쓰지 않는다(「마켓이 열리면」만). 보상 적립량 · 월 한도 숫자를 쓰지 않는다.
- 「무료회원」 금지(결제하지 않은 회원은 「일반」).
- 다른 회사 로고 금지.
- 앱 화면 이미지는 더미 데이터 캡처만 쓴다.

## 7. 미션 5 단계에서 숨기는 것 (만들지 않는다)
- 상단: 「로그인」, 「소개」 외 메뉴 → 상단에는 「소개」와 「출시 알림 신청」만
- 하단: 「이용약관」 · 「문의하기」 링크, 대표 성명 · 사업자등록번호 · 통신판매업 번호 · 주소
- 하단에 보이는 것: 회사명(「세이블리」, 00-decisions C5) · 문의 메일 · 사이트 주소 · 「개인정보처리방침」 링크 · ©

## 8. 개인정보 · 보안 (전체: `.claude/rules/waitlist-privacy.md`)
- 저장은 이메일 · 동의 시각 · 신청 시각 · 신청 위치만. IP · 기기 정보는 저장하지 않는다.
- 중복 신청도 같은 성공 응답을 준다. 이메일을 로그에 남기지 않는다.
- `.env*` · `.dev.vars`는 읽지 않고 커밋하지 않는다. 비밀값은 사용자가 대시보드에 직접 넣는다.

## 9. 작업 방식
- **계획 → 승인 → 실행:** 파일을 바꾸기 전에 무엇을 왜 바꾸는지 보여주고 승인을 받는다.
- **AI 결과 검수:** 구현 후 `node scripts/compare-design.mjs <섹션>`으로 찍어 시안과 비교하고, 차이를 고친 뒤 README 「검수 기록」에 남긴다. 체크리스트는 `docs/spec/50-acceptance.md`
- **커밋:** 작은 단위로, `type: 한국어 요약` 형식(예: `feat: 히어로 캐러셀 구현`)
- **push · 배포:** 사용자가 요청할 때만 한다.
- **README(제출물):** 서비스 소개 · 타깃 · 기술 스택 · 구현한 인터랙션 · 배포 URL 2개 · 실행 방법 · Figma MCP 활용 기록 · 검수 기록

## 10. 미결정 (확정 전에는 임의로 채우지 않는다 — 상세: 00-decisions.md G · H)
1. 개인정보 보호책임자 표기
2. ~~출시 알림 이메일 보관 기간~~ → 00-decisions B4로 확정
3. ~~하단 회사명~~ → 「세이블리」(00-decisions C5)
4. 타깃 문구 확정
5. 금융 문해력 수치 원문 대조
6. 광고성 정보 동의 · 해외 저장 기재 방식(전문가 확인)
