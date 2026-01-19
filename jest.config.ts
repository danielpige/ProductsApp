// jest.config.ts
import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets';

export default {
  ...createCjsPreset(),

  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/src/test.ts'],

  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/polyfills.ts', '!src/**/*.module.ts'],
} satisfies Config;
