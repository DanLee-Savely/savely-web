# 60 · Claude Code 작업 순서 (사용자용 안내)

Claude Code를 저장소 폴더에서 실행한다. 아래 단계마다 지시문을 그대로 붙여 넣으면 된다.
각 단계가 끝나면 Claude Code가 결과를 보고한다. 확인한 뒤 다음 단계로 넘어간다.

## 0. 준비 (사용자가 직접)
1. 수업 실습 파일 정리: `codeit-it-5th-basic/`, `main.js`, `package.json`, `package-lock.json`, `node_modules/`
2. Claude Code를 claude.ai 계정으로 로그인해 실행한다. `/mcp`를 입력해 목록에 Figma가 보이는지 확인한다.
   - claude.ai에서 연결한 커넥터는 Claude Code에 자동으로 들어온다(Claude Code 공식 문서).
   - 보이지 않으면 `/status`로 로그인 방식을 확인한다.

## 1. 프로젝트 생성 · basePath 검증
```
docs/spec/40-deploy.md의 1~2단계를 진행해줘.
Next.js 프로젝트를 임시 폴더에 만들어 이 저장소에 병합하고, shadcn/ui를 초기화하고,
basePath /home을 설정한 빈 페이지로 Cloudflare 배포 전 단계까지 준비해줘.
명령을 실행하기 전에 계획을 먼저 보여줘.
```

## 2. 기반 만들기 (토큰 · 문구 · 공통 컴포넌트 · 클래스 뼈대)
```
CLAUDE.md §5 구조대로 폴더를 만들고 다음을 진행해줘.
- docs/spec/tokens.css → src/styles/tokens.css로 옮기고 globals.css·shadcn 변수와 연결
- docs/spec/content.json → src/content/home.content.ts (타입 포함)
- Pretendard·JetBrains Mono 글꼴 설정
- 공통 컴포넌트: AppButton(Primary/Secondary, M/L), SectionHeader, Container, Card
- 이미지 이동: docs/assets → public/images
계획부터 보여줘.
```

## 3. 섹션 구현 (하나씩, implement-section 스킬 사용)
아래 순서로 한 섹션씩 진행한다.
```
/implement-section 00-gnb
```
순서: `00-gnb` → `01-hero` → `02-empathy` → `03-problem` → `04-literacy` → `05-solution` → `06-reward` → `07-habit` → `11-waitlist` → `99-footer`

- 스킬이 목록에 보이지 않으면 이렇게 지시한다: 「.claude/skills/implement-section/SKILL.md 절차대로 03-problem을 구현해줘」
- 각 섹션이 끝나면 비교 이미지(docs/compare/)를 직접 열어 시안과 같은지 확인한다.

## 4. 출시 알림 신청 (폼 · API · D1)
```
docs/spec/30-waitlist.md대로 출시 알림 신청을 구현해줘.
도메인 클래스 → 서비스 → InMemory 저장소 → API → 신청 창 UI(WaitlistFormFlow) 순서로,
단위 테스트를 붙이고, 로컬에서 신청 → 완료까지 확인해줘.
D1 연결은 다음 단계에서 할 거야.
```

## 5. 개인정보처리방침 페이지
- 미결정 사항(00-decisions G1 · G2)을 먼저 정한다.
```
docs/spec/30-waitlist.md §6대로 /home/privacy 페이지 초안을 만들어줘.
보호책임자는 ○○, 보관 기간은 ○○로 해줘.
```

## 6. 배포
```
docs/spec/40-deploy.md 3~4단계를 진행해줘.
대시보드에서 내가 직접 해야 하는 일은 클릭 위치까지 안내해줘.
```

## 7. 최종 점검 · 제출 준비
```
docs/spec/50-acceptance.md 전체를 점검해줘.
PC·모바일 비교 이미지, 콘솔 에러, 금지어 점검, Lighthouse 결과를 보고하고,
README(서비스 소개 · 타깃 · 기술 스택 · 구현 인터랙션 · 배포 URL 2개 · 실행 방법 ·
Figma MCP 활용 기록 · 검수 기록)를 작성해줘.
```

## 팁
- **대화가 길어지면** 새 세션을 열어도 된다. CLAUDE.md와 docs/spec이 맥락을 이어 준다.
- **시안과 다르게 보이면** 비교 이미지 두 장을 지정해서 「이 두 이미지의 차이를 목록으로 적고 고쳐줘」라고 지시한다.
- **결정이 바뀌면** docs/spec/00-decisions.md를 먼저 고친 뒤 구현을 지시한다. 문서가 기준이 되게 하기 위해서다.
