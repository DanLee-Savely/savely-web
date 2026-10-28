# 40 · 프로젝트 생성과 배포

> 명령어의 세부 옵션은 도구 버전에 따라 바뀔 수 있다. 실행 전에 각 도구의 공식 문서를 확인하고, 다르면 공식 문서를 따른다.

## 0. 시작 전 (사용자가 직접)
- 저장소 폴더의 수업 실습 파일을 정리한다(`codeit-it-5th-basic/`, `main.js`, `package.json`, `package-lock.json`, `node_modules/`).
  - 이 파일들이 남아 있으면 Next.js 프로젝트 생성 · 병합 시 충돌한다.
- 남겨 둘 것: `CLAUDE.md`, `.claude/`, `docs/`, `scripts/`, `README.md`, `.gitignore`, `.git/`

## 1. Next.js 프로젝트 생성 (임시 폴더에 만든 뒤 병합)
- 이유: 저장소에 이미 문서가 있어서, 프로젝트 생성 도구가 「빈 폴더가 아님」으로 멈출 수 있다.
- **방법 A (권장) — Cloudflare 공식 생성 도구 사용:** Next.js와 OpenNext 설정을 함께 만들어 준다(OpenNext 문서 안내)
```bash
cd /tmp
npm create cloudflare@latest -- savely-scaffold --framework=next --platform=workers
#   질문이 나오면: TypeScript · App Router · Tailwind · src/ 사용 · import alias @/* 선택
#   배포 여부를 물으면 「아니오」
```
- **방법 B:** `npx create-next-app@latest`로 만든 뒤 OpenNext 어댑터 안내대로 `@opennextjs/cloudflare`를 추가한다.
- **병합** (기존 문서는 덮어쓰지 않음):
```bash
rsync -a --ignore-existing --exclude .git /tmp/savely-scaffold/ ~/Documents/"savely-web(PC)"/
```
- **.gitignore 병합:** `--ignore-existing` 때문에 기존 `.gitignore`가 유지된다. 생성 도구가 만든 `/tmp/savely-scaffold/.gitignore` 내용을 기존 파일에 합치고, 아래 항목이 있는지 확인한다.
```
node_modules/
.next/
.open-next/
.wrangler/
.env*
.dev.vars
docs/compare/
```
- **shadcn/ui 초기화** (저장소 폴더에서):
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog sheet input checkbox carousel tooltip
```
- `next.config`에 `basePath: '/home'` 추가
- `docs/spec/tokens.css` → `src/styles/tokens.css`로 옮기고 `globals.css`에서 불러온다
- `docs/assets/app/*` → `public/images/app/`, `docs/assets/brand/*` → `public/images/brand/`
  - basePath 주의: `next/image`에 문자열 경로를 쓸 때는 `/home/images/...`처럼 basePath를 붙인다(Next.js 공식 문서). 가능하면 정적 import

## 2. basePath 검증 (본 구현 전에 먼저)
- 빈 페이지 하나로 Cloudflare에 배포해서 `https://www.savelyglobal.com/home`과 정적 파일(이미지 · CSS · JS)이 정상인지 확인한다.
- 이유: OpenNext 공식 문서에 basePath 지원이 명시돼 있지 않다.
- 실패하면 대안을 사용자와 정한다.
  - 대안 1: 정적 내보내기(`output: 'export'`) + Workers 정적 파일 + API용 Worker
  - 대안 2: `home.savelyglobal.com` 같은 하위 도메인 사용

## 3. Cloudflare (실서비스)
1. **D1 생성:** `npx wrangler d1 create savely-waitlist` → 출력된 `database_id`를 `wrangler.jsonc`의 `d1_databases`에 `binding: "DB"`로 기록한다(`database_id`는 비밀값이 아님)
2. **마이그레이션 적용:** `npx wrangler d1 migrations apply savely-waitlist --remote`
3. **Route 설정:** `wrangler.jsonc`에 `routes: [{ "pattern": "www.savelyglobal.com/home*", "zone_name": "savelyglobal.com" }]`
   - www 레코드는 Cloudflare 프록시(주황 구름)가 켜져 있어야 한다(Cloudflare 공식 문서)
4. **GitHub 자동 배포:** Cloudflare 대시보드 → Workers & Pages → 해당 Worker → Settings → Builds에서 GitHub 저장소 연결 (**사용자가 직접**)
   - 빌드 명령 예: `npx opennextjs-cloudflare build` / 배포 명령 예: `npx opennextjs-cloudflare deploy`
   - 정확한 명령은 생성된 `package.json` 스크립트를 따른다
   - 참고: OpenNext 저장소 이슈 #573 — 배포 명령을 `npm run deploy`로 바꿔 해결한 사례가 있다
5. **루트 리다이렉트:** Cloudflare 대시보드 → Rules → Redirect Rules (**사용자가 직접**)
   - `www.savelyglobal.com/` → `https://www.savelyglobal.com/home` (301)
   - `savelyglobal.com/*` → `https://www.savelyglobal.com/home` (301)
   - 기존 `survey.savelyglobal.com`은 건드리지 않는다
6. **환경 변수:** `WAITLIST_ALLOWED_ORIGINS` = Vercel 배포 도메인

## 4. Vercel (제출용)
1. Vercel 대시보드에서 GitHub 저장소 `DanLee-Savely/savely-web`을 가져온다 (**사용자가 직접**, GitHub 권한 승인 필요)
2. 환경 변수 `NEXT_PUBLIC_WAITLIST_API_URL=https://www.savelyglobal.com`
3. basePath 때문에 Vercel 주소는 `https://<프로젝트>.vercel.app/home`이 된다. 루트(`/`) 접속 시 `/home`으로 보내는 리다이렉트를 `next.config`의 `redirects`에 추가한다(`basePath: false` 옵션 사용)
4. 확인: 시크릿 창과 모바일에서 페이지 · 이미지 · 인터랙션 · 출시 알림 신청까지 직접 확인한다(미션 5 요건)

## 5. 비밀값 원칙
- API 토큰 · 비밀키는 저장소에 넣지 않는다. 대시보드 환경 변수로 넣는다(**사용자가 직접**).
- 로컬 개발용 비밀값은 `.dev.vars` / `.env.local`(둘 다 `.gitignore`)
- 에이전트는 이 파일들을 읽지 않는다.

## 6. 커스텀 도메인 · 분석 (미션 5 심화)
- 커스텀 도메인 연결은 실서비스(Cloudflare)로 충족된다. README에 두 주소를 모두 적는다.
- Vercel Analytics는 선택 사항이다.
