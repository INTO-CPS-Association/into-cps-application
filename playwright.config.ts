import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    trace: 'retain-on-failure',
  },
  testDir: './test',
  timeout: 30000,
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),

   /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['monocart-reporter', {  
      name: "Tests Report",
      outputFile: './monocart-report/index.html',
      coverage: {
        entryFilter: {
          '**/node_modules/**': false,
          '**/dist/**': false,
          'src/**/*.ts': true,
          'src/**/*.js': true
      },
      sourceFilter: {
          '**/node_modules/**': false,
          '**/dist/**': false,
          'src/**/*.ts': true,
          'src/**/*.js': true 
      },
        outputDir: 'test/coverage-reports'
      }
    }]
],
  globalTeardown: 'test/global-teardown.ts',
  globalSetup: 'test/global-setup.ts',
  projects: [
    {
      name: 'electron',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      }
    }
  ]
});