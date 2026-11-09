import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Engine tests run in node; component and integration tests opt in to jsdom with
// `// @vitest-environment jsdom` at the top of the file (as in Gradelings).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 20000,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["**/*.test.{ts,tsx}", "src/test/**"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
