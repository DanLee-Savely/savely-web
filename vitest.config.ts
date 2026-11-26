import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// tsconfig의 @/ 경로를 테스트에서도 쓴다
export default defineConfig({
  // 가이드 원고(.md)를 글자 그대로 가져온다 — next.config.ts의 turbopack 규칙(type: "text")과 같은 동작
  plugins: [
    {
      name: "md-as-text",
      transform: (code, id) => (id.endsWith(".md") ? { code: `export default ${JSON.stringify(code)};`, map: null } : null),
    },
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
