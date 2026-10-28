# 30 · 출시 알림 신청 (API · 저장 · 개인정보)

## 1. 흐름
```
[신청 창 UI] → WaitlistApiClient.register(email, consent)
  → POST {API_BASE}/home/api/waitlist
    → route.ts: 요청 해석 → RegisterWaitlistService.execute()
      → EmailAddress.create(email)        // 검증 · 정규화 (값 객체)
      → WaitlistEntry.create(...)         // 엔티티
      → WaitlistRepository.save(entry)    // D1 (실서비스) / InMemory (로컬 · 테스트)
    ← 결과를 HTTP 응답으로 변환 (오류 매핑은 route.ts 한 곳)
```
- `API_BASE`
  - 실서비스(Cloudflare)에서는 같은 도메인이므로 빈 값(상대 경로)
  - Vercel 배포본에서는 `NEXT_PUBLIC_WAITLIST_API_URL=https://www.savelyglobal.com`

## 2. API 계약

**요청** `POST /home/api/waitlist` (`Content-Type: application/json`)
```json
{ "email": "user@example.com", "consent": true, "source": "hero" }
```
- `source`: 신청 창을 연 위치. `gnb` | `hero` | `final-cta` | `floating` | `mobile-menu` (분석용, 선택값)

**응답**

| 상황 | 상태 코드 | 본문 |
|---|---|---|
| 신규 등록 | 200 | `{ "ok": true }` |
| 이미 신청한 이메일 | 200 | `{ "ok": true }` — 신규와 같게 응답(가입 여부 노출 금지) |
| 이메일 형식 오류 | 400 | `{ "ok": false, "code": "INVALID_EMAIL" }` |
| 동의 없음 | 400 | `{ "ok": false, "code": "CONSENT_REQUIRED" }` |
| 요청 과다 | 429 | `{ "ok": false, "code": "RATE_LIMITED" }` |
| 서버 오류 | 500 | `{ "ok": false, "code": "SERVER_ERROR" }` (내부 메시지 · 이메일을 응답에 넣지 않음) |

- **CORS:** `OPTIONS` 사전 요청을 처리한다. `Access-Control-Allow-Origin`은 허용 목록(환경 변수 `WAITLIST_ALLOWED_ORIGINS`)에 있는 출처만 그대로 돌려준다. 허용 목록 예: Vercel 배포 도메인
- **남용 방지:** 같은 IP에서 1분에 5회를 넘으면 429. IP는 판단에만 쓰고 저장하지 않는다
  - 구현 방법(Cloudflare Rate Limiting 바인딩 또는 메모리 카운터)은 구현 단계에서 공식 문서를 확인해 고른다
  - 스팸이 늘면 Cloudflare Turnstile 추가를 검토한다(현재 범위 밖)

## 3. 검증 규칙 (`EmailAddress`)
- 앞뒤 공백 제거, 소문자로 정규화
- 길이 3~254자
- 형식: `로컬@도메인.최상위` (간단한 정규식 + 도메인에 점 1개 이상). 지나치게 엄격한 정규식은 쓰지 않는다
- 잘못된 값은 생성 시 `InvalidEmailError`를 던진다

## 4. 저장소 (Cloudflare D1)
- 바인딩 이름 `DB`, 데이터베이스 이름 `savely-waitlist`(제안)
- 마이그레이션 파일 `migrations/0001_create_waitlist.sql`:
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  consented_at TEXT   NOT NULL,           -- ISO 8601 (UTC)
  created_at  TEXT    NOT NULL,           -- ISO 8601 (UTC)
  source      TEXT
);
```
- 같은 이메일이 다시 들어오면 `INSERT ... ON CONFLICT(email) DO NOTHING`으로 무시하고 성공 처리
- **저장하지 않는 것:** IP, 기기 정보(User-Agent), 쿠키 값
- 무료 한도(공식 문서, 2026-10 확인): 쓰기 하루 10만 건, 읽기 하루 500만 건, 저장 5GB. 한도를 넘으면 자정(UTC)까지 쿼리가 실패한다

**신청 목록 확인 (대표님용 명령)**
```bash
npx wrangler d1 execute savely-waitlist --remote \
  --command "SELECT email, created_at, source FROM waitlist ORDER BY created_at DESC"
```

## 5. 클래스 설계 (CLAUDE.md §5 구조)

| 계층 | 클래스 · 인터페이스 | 책임 |
|---|---|---|
| domain | `EmailAddress` | 값 객체. 정규화 · 검증, 불변 |
| domain | `WaitlistEntry` | 엔티티. email, consentedAt, createdAt, source |
| domain | `WaitlistRepository` (interface) | `save(entry): Promise<SaveResult>` (`created` / `duplicate`) |
| domain | `InvalidEmailError`, `ConsentRequiredError` | 도메인 오류 |
| application | `RegisterWaitlistService` | 유스케이스. 동의 확인 → 엔티티 생성 → 저장. 중복도 성공으로 반환 |
| infrastructure | `D1WaitlistRepository` | D1 구현 |
| infrastructure | `InMemoryWaitlistRepository` | 로컬 · 테스트 |
| infrastructure | `WaitlistApiClient` | 브라우저 → API 호출, 응답을 결과 객체로 변환 |
| infrastructure | `container.ts` | 환경에 맞는 저장소를 골라 서비스에 주입 |
| interaction | `WaitlistFormFlow` | 폼 상태 전이: idle → filled → submitting → done / error |

- **단위 테스트(권장):** `EmailAddress` 경계값, 서비스의 중복 처리, `WaitlistFormFlow` 전이

## 6. 개인정보처리방침 페이지 `/home/privacy`
- 실제 처리 방식과 정확히 일치해야 한다. 담을 항목:
  - 처리 목적(출시 알림 발송)
  - 수집 항목(이메일)
  - 보유 기간 · 파기 절차
  - 정보주체의 권리와 행사 방법(열람 · 삭제 요청: contact@savelyglobal.com)
  - 보호책임자 연락처
  - 안전성 확보 조치
  - 해외 저장(Cloudflare) 사항
- 미결정(00-decisions G1 · G2 · G6)이 남아 있으면 페이지 상단에 「초안」 표시를 두고, **확정 전에는 실서비스에 배포하지 않는다.**
- 이 문서는 법률 자문이 아니다. 정식 운영 전 전문가 검토를 권장한다.

## 7. 로깅 금지
- 이메일을 `console.log`, 오류 추적, 분석 도구에 남기지 않는다. 오류 로그에는 오류 코드만 남긴다.
