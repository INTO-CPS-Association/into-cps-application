import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Limit the number of workers on CI, use default locally
  workers: 2,
};
export default config;