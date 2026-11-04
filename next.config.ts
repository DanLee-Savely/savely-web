import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 메인은 /home(src/app/home), 앱은 이후 /app 등 같은 프로젝트에 붙인다 (00-decisions F8). basePath는 쓰지 않는다
  async redirects() {
    return [{ source: "/", destination: "/home", permanent: false }];
  },
  // 다른 사이트의 iframe에 넣지 못하게 한다 (보안 점검 2026-10-31). 스크립트 CSP는 nonce가 필요해 쓰지 않는다
  async headers() {
    return [
      {
        source: "/home/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
