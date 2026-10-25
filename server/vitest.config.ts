import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    // Integration tests share one Postgres database and clean fixtures in
    // afterAll — parallel files would delete each other's rows mid-test.
    fileParallelism: false,
  },
});
