import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  testMatch: ["*/tests/**/*.ts", "*/session/**/setup.ts"],
  timeout: 30 * 1000,
  fullyParallel: false,
  workers: 1,
  maxFailures: 1,
  retries: 0,
  projects: [
    {
      name: 'setup',
      testMatch: '*/session/**/setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: 'tests/**/*.ts',
    },
  ],
});
