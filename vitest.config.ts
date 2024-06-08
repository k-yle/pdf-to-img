import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setupTests.ts"],
    coverage: {
      provider: "v8",
      exclude: ["node_modules", "bin", ".eslintrc.js"],
    },
    testTimeout: 30_000,
  },
});
