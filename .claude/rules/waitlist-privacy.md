---
paths:
  - "src/app/api/**/*"
  - "src/app/privacy/**/*"
  - "src/domain/waitlist/**/*"
  - "src/application/waitlist/**/*"
  - "src/infrastructure/**/*"
  - "migrations/**/*"
  - "wrangler.*"
---

# 출시 알림 · 개인정보 규칙 (상세: docs/spec/30-waitlist.md)

- 저장 항목은 이메일 · 동의 시각 · 신청 시각 · 신청 위치(source)만. IP · User-Agent · 쿠키는 저장하지 않는다.
- 동의(consent)가 `true`가 아니면 저장하지 않는다(400 `CONSENT_REQUIRED`).
- 이미 신청한 이메일도 신규와 같은 성공 응답을 준다(가입 여부 노출 금지).
- 이메일을 로그 · 오류 메시지 · 분석 이벤트 · 응답 본문에 넣지 않는다.
- CORS는 `WAITLIST_ALLOWED_ORIGINS` 허용 목록만 통과시킨다.
- `/home/privacy`의 내용은 실제 저장 방식과 일치해야 한다. 미결정 항목(00-decisions G1 · G2 · G6)이 남아 있으면 「초안」 표시를 하고 실서비스에 배포하지 않는다.
- 비밀값(API 토큰 등)은 코드 · 저장소에 넣지 않는다. `.env*`, `.dev.vars`는 읽지도 커밋하지도 않는다.
