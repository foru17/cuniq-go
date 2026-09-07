import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolves the `@/*` alias from tsconfig.json
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
  },
});
