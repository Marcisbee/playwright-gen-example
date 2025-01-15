import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	reporter: "html",
	testMatch: ["*/tests/**/*.ts", "*/**/setup.ts"],
	timeout: 3 * 1000,
	fullyParallel: false,
	workers: 1,
	projects: [
		{
			name: 'setup',
			testMatch: '**/setup.ts',
		},
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup'],
		},
	],
});
