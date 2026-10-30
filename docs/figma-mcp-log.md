# Figma MCP 호출 기록

- 무료(Starter) 요금제 한도: 월 20회. 같은 노드는 다시 부르지 않고 `docs/figma/<노드ID>.md`를 재사용한다.
- 이 기록은 README 「Figma MCP 활용」의 근거가 된다(미션 5 요건 3).

| 날짜 | 도구 | 노드 ID | 목적 | 저장 파일 |
|---|---|---|---|---|
| 2026-10-29 | create_session | 파일 `Yzb7zX5G3QrRlxhTzkZzS0` | S04 최신 이미지 받기용 세션 | — |
| 2026-10-29 | get_screenshot | `70:2976` (PC S04) | S04 수정 후 시안 이미지 | 실패: 1×1 빈 이미지(원본 1440×1169) |
| 2026-10-29 | get_screenshot | `70:3110` (모바일 S04) | S04 수정 후 시안 이미지 | 실패: 1×1 빈 이미지(원본 390×2073) |
| 2026-10-29 | get_screenshot | `70:2976` (PC S04, contentsOnly) | 재시도 | 실패: 같은 결과. 더 부르지 않음 |
| 2026-10-30 | create_session | 파일 `Yzb7zX5G3QrRlxhTzkZzS0` | S03 C안 · S04 시각화 시안 받기용 세션 | — |
| 2026-10-30 | get_screenshot | `70:1845` (UI PC S03) | S03 C안 시안 | `design/pc`, `proto-pc/03-problem.png` (1440×838) |
| 2026-10-30 | get_screenshot | `70:2091` (UI 모바일 S03) | S03 C안 시안 | `design/mobile`, `proto-mobile/03-problem@2x.png` (390×1177 → 2배 확대) |
| 2026-10-30 | get_screenshot | `70:1885` (UI PC S04) | S04 막대 · 그래프 시안 | `design/pc`, `proto-pc/04-literacy.png` (1440×1328) |
| 2026-10-30 | get_screenshot | `70:2128` (UI 모바일 S04) | S04 막대 · 그래프 시안 | `design/mobile`, `proto-mobile/04-literacy@2x.png` (390×2550 → 2배 확대) |

- 2026-10-29 실패 원인: 프로토타입 노드(`70:2976` 등)는 프레임이 900px로 잘려 빈 이미지가 나옴. UI 노드로 받으면 정상
- 이번 달 사용: 8회 / 20회

## 참고: MCP 없이 미리 추출해 둔 자료 (2026-10-28)
- Figma Plugin API로 추출했다. MCP 호출 횟수에 포함되지 않는다.
- `docs/figma/ui-home-pc-light.txt`, `ui-home-mobile-light.txt`: UI 시안 구조(크기 · 간격 · 토큰 · 문구)
- `docs/figma/interaction-components-light.txt`: 인터랙션 컴포넌트의 변형과 리액션(트리거 · 시간 · 전환)
- `docs/figma/prototype-frames-light.txt`: 프로토타입 프레임(고정 요소 · 링크 · 오버레이)
- `docs/figma/tokens.json`: 색 · 간격 · 모서리 변수, 텍스트 스타일
- `docs/design/**`: 섹션 · 상태별 시안 이미지
