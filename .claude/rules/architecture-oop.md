---
paths:
  - "src/domain/**/*"
  - "src/application/**/*"
  - "src/infrastructure/**/*"
  - "src/interaction/**/*"
  - "src/app/api/**/*"
---

# 객체 지향 구조 규칙 (로직 코드를 만질 때 적용)

## 계층과 의존 방향
```
app(route.ts · page) → application(서비스) → domain(엔티티 · 값 객체 · 인터페이스)
                                   ↑
                    infrastructure(D1 · HTTP 구현) — domain 인터페이스를 구현
interaction(UI 상태 클래스) — React와 무관한 순수 TS, 화면은 훅으로 연결
```
- domain은 아무것도 import하지 않는다(프레임워크 · DB · fetch 금지).
- application은 domain의 인터페이스에만 의존한다. 구현체 이름을 모른다.
- 구현체 생성(`new`)과 조립은 `src/infrastructure/container.ts`에서만 한다.

## 클래스 작성 규칙
- 필드는 `private readonly`(또는 `#`)로 숨기고, 필요한 동작만 메서드로 공개한다.
- 의존 대상은 생성자로 받는다(인터페이스 타입). 정적 싱글턴 · 전역 가변 상태 금지
- **값 객체(예: `EmailAddress`):** `static create()`에서 검증하고 실패하면 도메인 오류를 던진다. 생성 후 바뀌지 않는다. `equals()` · `toString()` 제공
- **엔티티(예: `WaitlistEntry`):** 생성 규칙을 `static create()`에 모은다.
- **서비스(예: `RegisterWaitlistService`):** 유스케이스 하나 = 클래스 하나, 공개 메서드 `execute()` 하나
- **도메인 오류:** `class XxxError extends DomainError`. HTTP 코드 변환은 `route.ts`의 매퍼 한 곳에서만 한다.
- **UI 상태 클래스(예: `WaitlistFormFlow`, `CarouselCursor`, `StepSequencer`):** 상태와 전이 메서드만 가진다. 타이머 · DOM 접근은 하지 않는다. 시간 흐름은 훅에서 메서드를 호출해 표현한다.
- 메서드는 한 가지 일만 한다. 20줄을 넘기면 나눈다.
- `any` 금지. 공개 메서드에는 반환 타입을 적는다.

## 화면과의 경계
- React 컴포넌트는 함수형으로 만든다(React 공식 권장). 컴포넌트 안에서 검증 · 저장 · fetch를 하지 않는다.
- 컴포넌트 → 훅(`useWaitlistForm` 등) → 클래스 순서로 연결한다. 훅은 얇은 어댑터다.

## 테스트 (권장)
- domain · application · interaction 클래스는 Vitest 단위 테스트를 붙인다. 저장소는 `InMemoryWaitlistRepository`를 쓴다.
