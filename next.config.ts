import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/home",
  async redirects() {
    return [{ source: "/", destination: "/home", basePath: false, permanent: false }];
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
