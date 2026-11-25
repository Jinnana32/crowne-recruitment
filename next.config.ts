import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stay off, and next dev must not rewrite AGENTS.md.
  // See docs/DECISIONS.md D-007.
  agentRules: false,
  // Puppeteer launches Chromium outside the Next bundle (D-015).
  serverExternalPackages: ["puppeteer"],
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
