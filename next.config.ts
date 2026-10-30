import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 메인은 /home(src/app/home), 앱은 이후 /app 등 같은 프로젝트에 붙인다 (00-decisions F8). basePath는 쓰지 않는다
  async redirects() {
    return [{ source: "/", destination: "/home", permanent: false }];
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
