import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list'], ['json', { outputFile: 'playwright-report/results.json' }]],

  globalSetup: require.resolve('./tests/e2e/setup/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/setup/global-teardown'),

  use: {
    baseURL: process.env.REACT_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: true,
  },
});

export const testConfig = {
  projectPath: "/home/simone/Scrivania/into-cps-forked_react/INTO-CPS Project",
};