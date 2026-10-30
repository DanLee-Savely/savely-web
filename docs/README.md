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

## 알림 — S03 C안 · S04 시각화 (2026-10-30)
- Figma MCP `get_screenshot`으로 UI 노드(S03 `70:1845` · `70:2091`, S04 `70:1885` · `70:2128`)를 받아 `design/pc|mobile`, `design/proto-pc|proto-mobile`의 03 · 04 이미지를 갱신했다. 프로토타입 노드는 프레임이 900px로 잘려 빈 이미지가 나온다
  - 모바일은 1x로 받아 2배로 확대해 `@2x` 파일에 저장했다(글자가 약간 흐림)
- 결정: `spec/00-decisions.md` D8~D12. 명세: `spec/10-sections.md` S03 · S04, `spec/20-interactions.md` I3 · I4
- **아직 갱신하지 않은 이미지(수정 전 상태):** `design/pc/_full-page@0.5x.jpg`, `design/mobile/_full-page.jpg`, `design/interactions/literacy-stats-pc/*`(툴팁), `design/interactions/problem-flow-pc/*`(이전 S03 카드안 — 더 이상 기준 아님)
