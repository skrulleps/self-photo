import { defineConfig } from "@playwright/test";

const ci = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    permissions: ["camera"],
    trace: "on-first-retry",
    launchOptions: {
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    },
  },
  webServer: {
    // CI menguji file statis hasil build, sama seperti yang disajikan Cloudflare Pages.
    // next start nggak bisa dipakai dengan output: "export".
    command: ci ? "python3 -m http.server 3000 --directory out" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
