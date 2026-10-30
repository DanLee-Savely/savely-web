---
paths:
  - "src/components/**/*"
  - "src/app/**/*.tsx"
  - "src/styles/**/*"
---

# 디자인 시스템 규칙 (화면 코드를 만질 때 적용)

- **기준 시안:** Figma 라이트 프로토타입. 수치는 `docs/spec/10-sections.md`, 문구는 `docs/spec/content.json`, 인터랙션은 `docs/spec/20-interactions.md`
- **색 · 간격 · 모서리:** `src/styles/tokens.css`의 `--sv-*` 변수만 쓴다. 16진수 색이나 임의 px 색을 컴포넌트에 직접 쓰지 않는다.
  - Tailwind에서는 `bg-[var(--sv-surface)]`처럼 쓰거나, 테마 확장으로 이름을 붙여 쓴다.
- **글자:** Figma 텍스트 스타일 13종(`.sv-text-*` 클래스, tokens.css)만 쓴다. 임의 크기 · 굵기를 만들지 않는다.
  - Pretendard는 화면 글자, JetBrains Mono는 금액 · 숫자(Amount · Mono 스타일)에 쓴다.
- **레이아웃:** 콘텐츠 최대 폭 1120, 좌우 여백 PC 160 · 모바일 20. 섹션 세로 패딩 PC 96 · 모바일 56
- **반응형 기준:** 390 / 1440 시안. 그 사이 폭(768 · 1024 · 1280)에서도 잘림 · 겹침 · 가로 스크롤이 없어야 한다. 기준점은 `md`(768) · `lg`(1024)
- **줄바꿈:** content.json의 `pc` / `mobile` 값을 그대로 쓴다. 한국어 줄바꿈은 `word-break: keep-all`을 기본으로 한다.
- **컴포넌트**
  - 반복 UI(버튼 · 카드 · 칩 · 섹션 머리말)는 `src/components/common/`에 한 번만 만들고 재사용한다.
  - shadcn 생성 파일(`src/components/ui/`)은 직접 고치기보다 감싸서(`AppButton` 등) 세이블리 스타일을 입힌다.
- **버튼 · 링크 구분:** 이동은 `<a>`/`Link`, 동작(창 열기 · 전환)은 `<button>`
- **이미지:** `next/image`. 정적 import를 우선한다. 문자열 경로는 실제 경로(`/home/...`)를 그대로 쓴다(basePath 없음). 모든 이미지에 `alt`
- **섹션 루트:** `data-section="<번호-이름>"`과 `id`를 단다(비교 스크립트 · 앵커 이동에 사용).
- **움직임:** `prefers-reduced-motion`을 존중한다. 전환 시간과 곡선은 20-interactions.md의 값을 쓴다.
- **구현 후:** `node scripts/compare-design.mjs <섹션>`으로 찍어 시안과 비교하고, 50-acceptance.md 항목을 체크한다.
