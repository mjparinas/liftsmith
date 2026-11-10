import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "node:module";

// The full jsx-a11y rule set (Next registers the plugin but turns on only a few of its rules). Taken
// from Next's own copy, so there is one plugin instance.
const jsxA11y = createRequire(import.meta.resolve("eslint-config-next"))("eslint-plugin-jsx-a11y");

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      // Scrollable regions must be focusable so keyboard users can scroll them (axe scrollable-region-focusable).
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["region"], tags: [] }],
      "jsx-a11y/label-has-associated-control": ["error", { depth: 3 }],
    },
  },
  {
    // Type-aware checks for bugs the compiler can't see: a promise nobody waits for (its error is
    // lost), an async function where a plain callback is expected, and a switch that misses a case
    // of a union. JSX handlers may be async (React ignores the returned promise).
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
    },
  },
  {
    // Plans must be reproducible: content and engine code use the seeded rng in src/lib/random.ts.
    files: ["src/lib/**/*.ts"],
    ignores: ["**/*.test.ts", "src/lib/store.ts", "src/lib/juice.ts"],
    rules: { "no-restricted-properties": ["error", { object: "Math", property: "random", message: "Use rng() from src/lib/random.ts so plans are reproducible." }] },
  },
  globalIgnores(["**/.next/**", "out/**", "build/**", "next-env.d.ts", "android/**", "ios/**", "reports/**", ".stryker-tmp/**", "scripts/stryker-vitest5.mjs"]),
]);
