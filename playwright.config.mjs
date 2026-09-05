import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "python3 -m http.server 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "tablet",
      testMatch: "**/browser-playability.spec.mjs",
      use: {
        browserName: "chromium",
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
      },
    },
    {
      name: "mobile-webkit",
      testMatch: "**/browser-playability.spec.mjs",
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet-webkit",
      testMatch: "**/browser-playability.spec.mjs",
      use: {
        browserName: "webkit",
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
      },
    },
    {
      name: "firefox",
      testMatch: "**/browser-playability.spec.mjs",
      use: { browserName: "firefox", viewport: { width: 1366, height: 900 } },
    },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/537.36 Chrome/151 Mobile Safari/537.36",
      },
    },
  ],
});
