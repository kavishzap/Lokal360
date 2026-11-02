import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_DIST === "1" ? ".next-e2e" : ".next",
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
