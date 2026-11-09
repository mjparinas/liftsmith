import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Plans must be reproducible: content and engine code use the seeded rng in src/lib/random.ts.
    files: ["src/lib/**/*.ts"],
    ignores: ["**/*.test.ts", "src/lib/store.ts", "src/lib/juice.ts"],
    rules: { "no-restricted-properties": ["error", { object: "Math", property: "random", message: "Use rng() from src/lib/random.ts so plans are reproducible." }] },
  },
  globalIgnores(["**/.next/**", "out/**", "build/**", "next-env.d.ts", "android/**", "ios/**", "reports/**", ".stryker-tmp/**", "scripts/stryker-vitest5.mjs"]),
]);
