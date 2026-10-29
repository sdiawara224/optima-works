import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      ...(process.env.CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
        : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  reporter: 'list',
});
