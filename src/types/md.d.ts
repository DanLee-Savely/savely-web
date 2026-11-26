// 가이드 원고(.md)는 글자 그대로 가져온다 — next.config.ts의 turbopack 규칙(type: "text")과 vitest.config.ts의 변환이 맡는다.
// 빌드할 때 코드에 묶이므로 실행 중에 파일을 읽지 않는다(Workers에는 실행 중 fs가 없다, 91-content §4-3)
declare module "*.md" {
  const source: string;
  export default source;
}
