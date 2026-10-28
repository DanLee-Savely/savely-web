# 세이블리 소개 사이트 (savely-web)

## 검수 기록

| 섹션 | 시안과 달랐던 점 | 고친 방법 |
|---|---|---|
| 00 GNB | 모바일 메뉴 시트 아래에 시안에 없는 1px 테두리가 보임 (shadcn Sheet 기본값) | `data-[side=top]:border-b-0`으로 덮어씀 |
| 00 GNB | 메뉴 · 신청 창 배경 막이 shadcn 기본(검정 10% + 흐림)이라 시안(`#08140F` 45%, 흐림 없음)과 다름 | `sheet.tsx` 배경 막을 `bg-sv-backdrop` 토큰으로 교체 |
