import type { Config } from "jest";

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testMatch: ["<rootDir>/tests/unit/**/*.test.{ts,tsx,js,jsx}"],
  moduleNameMapper: {
    "\\.(css|scss|sass)$": "identity-obj-proxy",
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": ["ts-jest", { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(execa)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!src/main.tsx",
    "!src/**/*.d.ts",
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
};

export default config;