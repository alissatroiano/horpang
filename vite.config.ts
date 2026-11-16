import { defineConfig } from 'vitest/config';

// UI test files opt into jsdom with a per-file docblock:
//   // @vitest-environment jsdom
export default defineConfig({
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
