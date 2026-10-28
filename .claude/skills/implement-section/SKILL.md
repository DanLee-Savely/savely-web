---
name: implement-section
description: 세이블리 HOME의 섹션 하나(예 03-problem)를 Figma 프로토타입과 같게 구현하고 시안과 비교·보정할 때 사용한다. 「S03 구현」, 「히어로 만들어줘」 같은 요청에 쓴다.
---

# 섹션 구현 절차

인자로 섹션 번호-이름(예: `03-problem`)을 받는다. 순서를 건너뛰지 않는다.

## 1. 읽기 (구현 전)
1. `docs/spec/10-sections.md`에서 해당 섹션을 읽는다.
2. `docs/spec/content.json`에서 해당 섹션의 문구를 읽는다.
3. `docs/spec/20-interactions.md`에서 관련 인터랙션(I1~I10)을 읽는다.
4. 시안 이미지를 직접 본다.
   - `docs/design/proto-pc/<섹션>.png`
   - `docs/design/proto-mobile/<섹션>@2x.png`
   - 인터랙션이 있으면 `docs/design/interactions/<세트>/`의 상태별 이미지 전부
5. 수치가 더 필요하면 `docs/figma/ui-home-pc-light.txt` · `ui-home-mobile-light.txt` · `interaction-components-light.txt`에서 해당 부분을 찾는다.

## 2. 계획 보고 (승인 받기)
- 만들 · 바꿀 파일 목록, 컴포넌트 구조, 쓸 클래스(`src/interaction/` 등), 문구 출처를 짧게 보여주고 승인을 받는다.

## 3. Figma MCP (필요할 때만, 섹션당 최대 1회)
- `docs/figma/<노드ID>.md`가 이미 있으면 호출하지 않는다.
- 없으면 CLAUDE.md §3 표의 노드 ID로 `get_design_context`를 1회 호출한다.
  - 결과를 `docs/figma/<노드ID>.md`에 저장한다.
  - `docs/figma-mcp-log.md`에 기록한다.
- 결과 코드는 참고용이다. 토큰 · 컴포넌트 규칙에 맞게 다시 쓴다.

## 4. 구현
- 문구는 `src/content/home.content.ts`에서 가져온다.
- 색 · 간격 · 글자는 `tokens.css` 변수와 `.sv-text-*`만 쓴다.
- 반복 UI는 `src/components/common/`을 재사용한다.
- 상태 전이는 `src/interaction/` 클래스로 만든다.
- 섹션 루트에 `data-section`, `id`를 단다.

## 5. 비교 · 보정
1. 개발 서버를 실행한다.
2. `node scripts/compare-design.mjs <섹션>`으로 화면을 찍는다.
3. `docs/compare/pc/<섹션>.png`와 `docs/compare/mobile/<섹션>@2x.png`를 시안과 나란히 본다(애니메이션 섹션의 비교 기준은 50-acceptance.md 참고).
4. 다른 곳을 목록으로 적고 고친다: 줄바꿈 · 간격 · 크기 · 색 · 정렬. 차이가 없어질 때까지 반복한다.
5. 글꼴 차이(Figma Noto Sans KR ↔ 코드 Pretendard)로 생기는 1~2px 차이는 허용한다.

## 6. 마무리
- `docs/spec/50-acceptance.md`의 해당 섹션 항목을 체크한다.
- 콘솔 에러 0을 확인한다.
- 문구 금지어 점검 명령을 실행한다.
- README 「검수 기록」에 「무엇이 달랐고 어떻게 고쳤는지」를 한 줄로 남긴다.
- 커밋은 사용자 승인 후 `feat: <섹션> 구현` 형식으로 한다.
