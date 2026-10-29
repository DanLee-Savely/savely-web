# docs — 구현 인수인계 자료

| 폴더 · 파일 | 내용 |
|---|---|
| `spec/00-decisions.md` | 기획 · 디자인 대화에서 확정한 결정과 이유, 미결정 목록 |
| `spec/10-sections.md` | 섹션별 레이아웃 · 구성 (PC · 모바일) |
| `spec/20-interactions.md` | 인터랙션 10종의 동작 · 시간 · 접근성 |
| `spec/30-waitlist.md` | 출시 알림 신청 API · D1 · 개인정보 |
| `spec/40-deploy.md` | 프로젝트 생성 · Cloudflare · Vercel 배포 |
| `spec/50-acceptance.md` | 시안 일치 · 품질 검수 체크리스트 |
| `spec/60-claude-code-guide.md` | Claude Code 단계별 지시문 (사용자용) |
| `spec/content.json` | 화면 문구 원본 |
| `spec/tokens.css` | 디자인 토큰 (Figma 변수에서 생성) |
| `figma/` | Figma에서 추출한 구조 · 리액션 · 토큰 원본 (MCP 미사용) |
| `figma-mcp-log.md` | Figma MCP 호출 기록 |
| `design/proto-pc`, `design/proto-mobile` | **기준 시안** — 프로토타입 섹션 이미지 |
| `design/pc`, `design/mobile` | UI 정적 시안 (참고) |
| `design/interactions/` | 인터랙션 상태별 이미지 · 오버레이 |
| `assets/app/` | 앱 화면 캡처 5장 (더미 데이터) |
| `assets/brand/` | 로고 · 앱 아이콘 |
| `compare/` | 비교 스크립트가 만드는 스크린샷 (git 제외) |

## 알림 — S04 디자인 수정, 코드 미반영 (2026-10-29)
- Figma S04(금융 문해력)에 「아는 것은 상위권, 챙기는 습관은 아직이에요」 블록(문제 카드 3장)을 추가하고, **위 수치 3개도 같은 박스 스타일로 바꿨다.** 결정: `spec/00-decisions.md` A8~A10
- 반영된 문서: `spec/content.json`(`literacy.issues` · `literacy.source`), `spec/10-sections.md`, `spec/20-interactions.md`(I4 툴팁 위치), `spec/50-acceptance.md`, `figma/*.txt`
- **코드(`LiteracySection` · `LiteracyStats` · `src/content/home.content.ts`)에는 아직 반영되지 않았다.**
- **아래 이미지는 수정 전 상태**다.
  - `design/proto-pc/04-literacy.png`, `design/proto-mobile/04-literacy@2x.png`
  - `design/pc/04-literacy.png`, `design/mobile/04-literacy@2x.png`, `design/pc/_full-page@0.5x.jpg`, `design/mobile/_full-page.jpg`
  - `design/interactions/literacy-stats-pc/*` (수치 툴팁 6장)
- 코드에 반영할 때: Figma MCP `get_screenshot`으로 프로토타입 S04 최신 이미지(PC `70:2976` · 모바일 `70:3110`)를 받아 위 `proto-*` 파일 2개를 덮어쓰고 `figma-mcp-log.md`에 기록한 뒤 비교한다(2회). 그 전까지 S04의 기준은 `spec/10-sections.md`와 `spec/content.json`이다.
