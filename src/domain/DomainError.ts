// 도메인 규칙 위반. code는 API 응답 코드로 쓰고, HTTP 변환은 route.ts 한 곳에서만 한다
// 메시지에 사용자 입력(이메일 등)을 넣지 않는다
export abstract class DomainError extends Error {
  abstract readonly code: string;

  /** fn이 도메인 오류를 던지면 그 코드, 아니면 null. 다른 오류는 그대로 던진다 */
  static codeOf(fn: () => unknown): string | null {
    try {
      fn();
      return null;
    } catch (e) {
      if (e instanceof DomainError) return e.code;
      throw e;
    }
  }
}
