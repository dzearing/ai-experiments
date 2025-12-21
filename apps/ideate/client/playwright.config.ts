import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Ideate e2e tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially for collaborative tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for collaborative tests
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5190',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't auto-start the server - expect it to be running
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5190',
  //   reuseExistingServer: !process.env.CI,
  // },

  // Timeout for each test
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
});
