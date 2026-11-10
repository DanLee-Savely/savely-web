# /app MVP 시안 이미지 (미션 6 — 기록 CRUD)

Figma 파일 `Yzb7zX5G3QrRlxhTzkZzS0` 「디자인 시스템 · UI」 페이지에서 2026-11-10에 PNG(1x)로 내보낸 것이다.
명세 원본은 `docs/spec/70-mvp-records.md`. 이미지와 명세가 다르면 **명세를 따르고** 사용자에게 알린다.
Figma MCP는 월 한도가 있으니 이 이미지를 먼저 쓴다.

| 파일 | 화면 · 상태 | 주소 | Figma 노드 | 명세 |
|---|---|---|---|---|
| 01-list.png | 목록 · 10건 · 페이지 나누기 | `/app/records?page=1` | 144:5589 | §4-1 |
| 02-detail.png | 상세 · 사진 있음 · 「기록했어요」 알림 | `/app/records/[id]` | 146:5780 | §4-2 |
| 03-new.png | 등록 · 입력 중 · 사진 칸 비어 있음 | `/app/records/new` | 146:5887 | §4-3 |
| 04-new-errors.png | 등록 · 입력 오류(E1 · E4 · E8) | `/app/records/new` | 146:6082 | §4-3 · §9 |
| 05-edit-saving.png | 수정 · 기존 값 · 사진 바꾸기/삭제 · 「저장 중…」 잠금 | `/app/records/[id]/edit` | 146:6292 | §4-4 |
| 06-detail-nophoto-delete-confirm.png | 상세 · 사진 없음 + 삭제 확인 창 | `/app/records/[id]` | 146:6501 | §4-2 · §4-5 |
| 07-not-found.png | 없는 기록 안내(404) | `/app/records/(없는 id)` | 146:6637 | §4-6 |
| 08-list-empty.png | 목록 · 빈 상태 | `/app/records` | 146:6686 | §4-1 |
| 09-list-loading.png | 목록 · 로딩(loading.tsx) | `/app/records` | 146:7091 | §4-1 |
| 10-list-error.png | 목록 · 불러오기 오류(error.tsx) | `/app/records` | 146:6887 | §4-1 |
| 11-new-income.png | 등록 · 수입 선택(지출 정보 숨김 · 수입 카테고리 6개) | `/app/records/new` | 150:7404 | §4-3 |
| 12-new-categories-expanded.png | 등록 · 카테고리 「더보기」 펼침 | `/app/records/new` | 150:7612 | §4-3 |
| 13-delete-failed.png | 삭제 확인 창 · 삭제 실패(E11) | `/app/records/[id]` | 150:7858 | §4-5 |
| 14-detail-photo-error-toast.png | 상세 · 사진 불러오기 실패(X5) + 「수정했어요」 | `/app/records/[id]` | 150:7988 | §4-2 |
| 15-note-messages.png | 메시지 모음(알림 S1~S4 · E9 · E10 · E11 · E12 · 진행 중 버튼) | — | 146:7356 | §9 |
| 16-home-hero-secondary-cta.png | 소개 사이트 히어로 · 보조 버튼 「웹에서 체험하기」 → `/app` (PC만) | `/home` | 70:1818 | 결정 M10 |

참고
- 사진 칸의 컵 그림은 자리표시다. 실제 화면에서는 올린 사진을 보여 준다.
- 금액 · 날짜 등 숫자는 예시 데이터다.
- 모바일 화면은 만들지 않는다(결정 M16).
