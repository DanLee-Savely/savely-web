// 도메인 규칙 위반. code는 API 응답 코드로 쓰고, HTTP 변환은 route.ts 한 곳에서만 한다
// 메시지에 사용자 입력(이메일 등)을 넣지 않는다
export abstract class DomainError extends Error {
  abstract readonly code: string;
}
