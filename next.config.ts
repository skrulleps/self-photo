import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // file statis di folder out/, disajikan Cloudflare Pages tanpa server Node
  output: "export",
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
