# 10 · 섹션 명세 (레이아웃 · 구성)

- 문구는 `docs/spec/content.json`, 인터랙션은 `docs/spec/20-interactions.md`를 본다.
- 수치 근거(크기 · 간격 · 색 토큰)는 Figma 구조 덤프 `docs/figma/ui-home-pc-light.txt`, `docs/figma/ui-home-mobile-light.txt`에 있다. 이 문서의 숫자는 그 요약이다.
- **구현 기준은 프로토타입이다.** UI 시안(정적)과 프로토타입이 다른 섹션(S02 · S03 · S05 · S06 · S07)은 프로토타입 쪽을 따른다.
- 시안 이미지
  - 프로토타입 섹션(기준): PC `docs/design/proto-pc/<섹션>.png`(1x), 모바일 `docs/design/proto-mobile/<섹션>@2x.png`
  - UI 정적 시안(참고): PC `docs/design/pc/`, 모바일 `docs/design/mobile/`
  - 인터랙션 상태별: `docs/design/interactions/<세트>/<상태>.png`
- 표기: `pad 위/오른쪽/아래/왼쪽`, `gap` = 자식 간격(px), 토큰 이름은 `docs/spec/tokens.css` 변수와 같다.

## 공통 레이아웃

| 항목 | PC (1440) | 모바일 (390) |
|---|---|---|
| 콘텐츠 폭 | 1120 (좌우 160) | 350 (좌우 20) |
| 섹션 세로 패딩 | 96 (S01 96/112, S11 112) | 56 (S01 40/56, S11 72) |
| 섹션 배경 교차 | S02 · S04 · S06 · S11 · Footer = `page-bg`, 나머지 = `bg` | 같음 |
| 섹션 머리말(head) | eyebrow(Eyebrow/12.5, accent) → 제목(Hero/34, text) → 설명(Body/15, text-2), gap 12 | 같음, 제목은 content.json의 mobile 줄바꿈 |
| 섹션 내부 간격 | head와 본문 사이 48 | 28~32 (섹션별 아래 표 참고) |

각 섹션 루트에는 `id`(앵커)와 `data-section="<번호-이름>"` 속성을 단다. 시안 비교 스크립트가 이 속성으로 섹션을 잘라 찍는다.

| data-section | id | 시안 이미지 |
|---|---|---|
| `00-gnb` | — | `00-gnb` |
| `01-hero` | `hero` | `01-hero` |
| `02-empathy` | `empathy` | `02-empathy` |
| `03-problem` | `problem` | `03-problem` |
| `04-literacy` | `literacy` | `04-literacy` |
| `05-solution` | `solution` | `05-solution` |
| `06-reward` | `reward` | `06-reward` |
| `07-habit` | `habit` | `07-habit` |
| `11-waitlist` | `waitlist` | `11-waitlist` |
| `99-footer` | — | `99-footer` |

---

## 00 · GNB (상단 메뉴)
- **PC:** 높이 78, pad 16/160, 좌우 끝 정렬(space-between). 왼쪽 로고(Lockup 136×36) · 가운데 메뉴 「소개」(Support/14.5, text-2) · 오른쪽 버튼 「출시 알림 신청」(Primary M, pill)
  - 스크롤해도 화면 위에 고정한다. 배경은 `bg` 86% + 배경 흐림 20px, 아래 테두리 `border-2` 1px
- **모바일:** 높이 70, pad 12/20. 로고(106×28) · 오른쪽 [출시 알림 신청(Primary M) + 메뉴 버튼(40×40, 3줄 아이콘)] gap 12. 고정, 배경 흐림
- 「로그인」 등 숨긴 메뉴는 만들지 않는다 (00-decisions C1).

## 01 · 히어로
- **PC:** 가로 배치, gap 60, 세로 가운데 정렬
  - 왼쪽 copy(폭 632, 세로 gap 24): eyebrow → 제목(Hero/Web 56) → 설명(Body/15, text-2) → 버튼(Primary L) → 안내문(Support/13, text-3)
  - 오른쪽 hero device(428×711): [이전 버튼 40] gap 20 [휴대폰 308×660] gap 20 [다음 버튼 40] / 아래 gap 16에 라벨 + 점 5개
- **모바일:** 세로 배치, gap 40. copy(폭 350) 아래에 hero device(313×512): [이전 36] gap 12 [휴대폰 217×465] gap 12 [다음 36] / 아래 라벨 + 점
- **휴대폰 프레임:** 테두리 영역 `surface-3`, 모서리 48(모바일 33.85), 안쪽 여백 10(모바일 7.05), 화면 모서리 38(모바일 26.8)
  - 그림자 2겹: `0 0 80px rgba(0,96,57,.14)`, `0 24px 48px rgba(0,0,0,.14)`
- 인터랙션: 20-interactions §I1(히어로 캐러셀)

## 02 · 공감
- **PC:** 가로 배치, gap 64. 왼쪽 head(폭 400) · 오른쪽 talk(폭 656, 세로 gap 12)
  - 말풍선 3개: 배경 `surface`, 모서리 20/20/20/6(왼쪽 아래만 6), pad 16/22, Body/15
  - 줄마다 왼쪽 들여쓰기 0 / 56 / 112
  - 마지막 문장: Title/Section 20, 말풍선과의 간격 12+12
- **모바일:** 세로, gap 32. 말풍선 들여쓰기 0 / 24 / 48
- 인터랙션: §I2(말풍선 순차 등장)

## 03 · 문제 (2026-10-30 C안으로 교체 — 00-decisions D12)
- 섹션 전체 가운데 정렬(머리말 포함). 세로 gap PC 64 · 모바일 40. head → flow → amount
- **PC flow:** 4열(각 280, 합 1120). 각 열은 세로 gap 6, 가운데 정렬
  - 번호 Mono/13(01~03 text-3, 04 text) → 제목 Hero/34(text) → 설명 Support/14.5(text-2, 2줄)
  - 열 경계에 「→」(Title/Section 20, text-3)를 제목 높이에 맞춰 둔다
  - 돌아오는 선: 4열 가운데 아래에서 52px 내려가 1열 가운데까지 간 뒤 위로 올라감. 1.5px text-3, 아래 모서리 r20, 1열 쪽 끝에 위로 향한 화살촉
  - 선 가운데 알약: 배경 `bg`(선을 가림), r999, pad 8/18, gap 8. 「↻」(Title/Section 20, accent) + 「점검이 빠지면 이 흐름이 매달 반복돼요」(Label/15, text)
- **amount (가운데, 세로 gap 10):** 「그 사이 작은 지출이 쌓이면 (예시)」 Label/15 text-2 → 「하루 5,000원 → 한 달 150,000원 → 1년」 Title/Section 20 text-3 → 「1,825,000원」 Amount/Display 96(risk) → 「30일 · 365일 기준으로 단순 계산했어요.」 Support/13 text-3
- **모바일:** 4단계를 세로로 가운데 쌓고 사이에 「↓」(text-3). 오른쪽에 4단계 제목 옆에서 1단계 제목 옆으로 올라가는 선(1.5px text-3, 오른쪽 모서리 r16, 1단계 쪽 끝에 왼쪽 화살촉)
  - 알약은 flow 아래, 배경 `surface`. 금액 큰 숫자는 48px, 계산 줄은 Body/15 한 줄
- 시안: `docs/design/proto-pc/03-problem.png`, `proto-mobile/03-problem@2x.png` (UI 노드 `70:1845` · `70:2091`, 2026-10-30)
- 인터랙션: §I3(문제 흐름 강조) — PC만

## 04 · 금융 문해력 중요성
- **PC:** 세로, gap 48. head → stats(가로 3열, gap 16) → issues → quote 카드 → 출처
  - **박스 스타일 통일 (2026-10-29):** stats와 issues는 같은 이야기(아는 것 vs 챙기는 것)를 하므로 같은 박스로 맞춘다. 박스 = `surface`, r16, pad 24, 테두리 없음, 세로 gap 12. 한 행의 박스는 높이를 같게(가장 높은 박스 기준, PC stats 190 · issues 223)
  - stat 박스: 라벨(Label/15, PC는 「ⓘ」 포함) → 값(Amount/44 + 「점」 Title/Section 20, 기준선 정렬, gap 4) → **막대** → 설명(Support/14.5, text-2)
    - **막대 (2026-10-30, D8):** 트랙 높이 8 · r4 · `surface-3`, 0~100 기준. 채움 = 값% 길이 · r4, 값이 OECD 평균 이상이면 `accent`, 미만이면 `risk`(73.6 accent · 53.7 · 43.4 risk)
    - 기준선: 2×16 세로선(`text`), 위치 = OECD 평균%(66.9 · 58.0 · 70.2). 아래에 라벨 「OECD 평균 …」(Support/13, text-3) 가운데 정렬. 문구 content.json `stats[].avg`
  - **issues (2026-10-29 추가, 문구는 content.json `literacy.issues`):** 세로, gap 24. issues-head → items
    - issues-head: 세로 gap 8. 소제목(Title/Section 20, text) → 설명(Body/15, text-2, 2줄)
    - items: 가로 3열, gap 16(stats와 같은 열 위치). 각 항목은 stat 박스와 같음
      - 라벨(Label/15, text) → 값 → **그래프** → 설명(Support/14.5, text-2, 2줄) → 관련 지표 한 줄(Support/13: 「관련 지표 · 」 text-3 + 지표 text-2)
      - **그래프 (2026-10-30, D8, 높이 96):** 기준선 y=70 1px `border`. 막대는 0에서 시작 · 최대 46px(가장 큰 값) · 위 모서리 r4, 칸을 같은 폭으로 나눠 가운데 둔다. 마지막 막대만 `risk`, 나머지 `border`
        - x 라벨 Support/13(마지막 text-2, 나머지 text-3), 막대 위 값 라벨 Label/13(마지막 text, 나머지 text-3)
        - 리볼빙: 막대 7개(폭 24, 3~9월). 값 라벨은 처음 「6조 6,725억」(그래프 왼쪽 정렬) · 끝 「7조 521억」(오른쪽 정렬)만
        - 노후: 막대 2개(폭 56) 「OECD 평균」 14.8% / 「한국」 39.7%. 보이스피싱: 「2024년」 8,546억 / 「2025년」 1조 2,578억
        - 데이터 content.json `issues.cards[].chart`
      - 값: [숫자(Amount/44, text) + 단위(Title/Section 20, text-2)] 묶음, 숫자-단위 gap 4, 묶음 사이 gap 10, 기준선 정렬. 예) 「7 조」 「521 억 원」 / 「39.7 %」 / 「1 조」 「2,578 억 원」
    - 툴팁 없음. 그래프 성장 애니메이션만 있음(§I4)
  - quote: `surface`, r16, pad 32, 가로 gap 32. 「금융문해력이란?」(Title/Section 20, 폭 180) + 인용문(Body/15) + 출처 표기(Support/13, text-3)
  - 맨 아래 출처 Support/13, text-3
- **모바일:** stats와 issues의 items 모두 세로(gap 12)로 쌓는다. 박스 pad 20(나머지는 PC와 같음). 소제목 2줄 · 설명 4줄(content.json mobile 줄바꿈). quote는 세로(pad 24, gap 12)
- 출처는 2줄(PC). 모바일은 폭에 맞춰 자연 줄바꿈
- 시안: `docs/design/proto-pc/04-literacy.png`, `proto-mobile/04-literacy@2x.png` (UI 노드 `70:1885` · `70:2128`, 2026-10-30). UI 노드에는 「ⓘ」가 없지만 툴팁을 위해 유지한다(00-decisions H)
- 인터랙션: §I4(수치 설명 툴팁 · 막대 성장) — PC 호버, 모바일은 탭(아래 20 문서 참고)

## 05 · 해결 — 세이블리 (기능 소개)
- **PC (기준 = 프로토타입):** 세로, gap 48. head → 본문(가로, gap 56, 세로 가운데)
  - 왼쪽 list(폭 784, 세로 gap 12): 단계 항목 3개(784×99, pad 22/24, r16, 가로 gap 16: 번호 Mono/15 + [제목 Title/Section 20 / 설명 Support/14.5, gap 6])
    - 선택된 항목: `accent-tint` 6% 배경 + `accent` 1px 테두리, 번호 accent, 제목 text, 설명 text-2
    - 나머지: 배경 없음 + `border` 1px 테두리, 번호 text-3, 제목 text-2, 설명 text-3
  - 오른쪽 휴대폰(280×598): 테두리 `surface-3`, r44, pad 10, 화면 260×578 r36. 선택 단계의 앱 캡처를 보여줌. 그림자는 히어로와 같음
- **PC (UI 정적 시안, 참고용):** 카드 3열(357×450) + 잘린 앱 이미지. 구현하지 않는다.
- **모바일:** 카드 세로 나열(gap 12, 각 카드 `surface` r16 pad 24)
  - 이미지 302×240, r12, 앱 캡처를 폭 302로 놓고 세로 위치 -81 / -67 / -242
  - 텍스트(pad 8): 번호(Mono/13, accent) → 제목 → 설명
- 인터랙션: §I5(해결 스텝) — PC만, 모바일은 카드 나열

## 06 · 습관 보상
- **PC:** 세로, gap 48. head → 습관 고리(가로, gap 8, 줄바꿈 허용) → 카드 3열(gap 16)
  - 고리: 칩 4개(pill, pad 10/16, Label/15, `surface`) 사이 「→」, 끝에 「↺」. 「포인트 받고」 칩은 강조(`accent` 배경, 흰 글자). 뒤 화살표도 accent
  - 카드: `accent-tint` 6%, r16, pad 28, 세로 gap 10. 제목 Title/Section 20(accent) + 설명 Body/15
- **모바일:** 고리는 2줄로 줄바꿈(350폭). 카드 세로(gap 10, pad 22)
- 인터랙션: §I6(보상 고리 순환 강조) — PC · 모바일 모두
- 문구 주의: 적립 수치 · 한도 숫자 금지(00-decisions A5). 「마켓이 열리면」만 사용

## 07 · 습관이 되면 (기대효과)
- **PC (기준 = 프로토타입):** 세로, gap 48. head → 토글 블록(세로 gap 20) → 아래 띠
  - 분할 토글(348×52, `surface`, pill, pad 4, gap 4): 「점검이 빠진 한 달」 / 「세이블리와 함께한 한 달」. 선택 쪽 `accent` 배경 + 흰 글자, 다른 쪽 text-2
  - 카드 4개(247×126, r16, pad 24, gap 8) 사이 「→」
    - before: `surface`, 제목 text-2, 설명 text-3
    - after: `accent-tint` 6%, 제목 accent, 설명 text-2, 화살표 accent
  - 아래 띠: `surface`, r12, 「↺ 이 흐름이 반복될수록…」
- **모바일 (기준 = 프로토타입):** 토글(350폭, 각 칸 169) → 카드 세로 4개(350×78, 가로 gap 14, pad 16/18, r14, 제목 폭 92) → 띠
- UI 정적 시안의 「두 줄 동시 비교」는 참고용이며 구현하지 않는다.
- 인터랙션: §I7(전후 토글)

## 11 · 출시 알림 신청 (마지막 CTA)
- **PC:** 가운데 정렬, gap 20, pad 112/160. 제목(Hero/Web 56) → 설명(Body/15) → 버튼(Primary L)
- **모바일:** pad 72/20, 제목 Hero/34(2줄)
- 버튼은 신청 창을 연다(§I8).

## 99 · Footer
- **PC:** pad 64/160, 세로 gap 32
  - 위: 워드마크 로고(100×20, text 색)
  - info: 회사명 · 「문의 contact@savelyglobal.com · www.savelyglobal.com」(Support/13, text-3)
  - 아래: 위 테두리 `border-2`, pad-top 24, ©
- **모바일:** pad 40/20/48, 세로 gap 20. 로고 → 구분선 → info 3줄(회사명 / 문의 / 사이트) → ©
- **추가 (시안에 없음, 00-decisions C4):** 「개인정보처리방침」 링크를 info 아래에 Support/13, text-2, 밑줄 없이 둔다(호버 시 밑줄)
- 회사명은 미결정(00-decisions G3). 확정 전 배포 금지.

## 고정 요소 (PC 프로토타입)
- **떠 있는 CTA:** 「출시 알림 받기」(Primary L)
  - 위치: 화면 오른쪽 아래(프로토타입 기준 x=1270, y=812 → 오른쪽 32 · 아래 32 근처). 그림자 `0 12px 32px rgba(0,31,18,.16)`
  - 프로토타입처럼 항상 보이게 한다. (「히어로에서는 숨기기」 같은 변경은 사용자 승인 후에만)
  - 모바일 프로토타입에는 떠 있는 CTA가 없다(상단 GNB에 버튼이 있음)
- **GNB 고정**(위 00 참고)

## 다크 모드
- `docs/figma/tokens.json`의 `color.dark` 값으로 `[data-theme="dark"]` 변수만 정의한다. 화면 전환 기능은 만들지 않는다(00-decisions D2).
