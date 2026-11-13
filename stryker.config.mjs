// Mutation testing for the rules that turn events into the workouts and numbers lifters see.
// Run with `npm run test:mutation` (reruns only redo what changed). Report: reports/mutation/mutation.html
// Copied from Gradelings, including its Vitest 5 runner (scripts/stryker-vitest5.mjs).
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest5",
  plugins: ["@stryker-mutator/*", "./scripts/stryker-vitest5.mjs"],
  vitest: { configFile: "vitest.mutation.config.mts", related: true },
  coverageAnalysis: "perTest",
  mutate: [
    "src/lib/readiness.ts",
    "src/lib/plates.ts",
    "src/lib/progression.ts",
    "src/lib/recovery.ts",
    "src/lib/block.ts",
    "src/lib/generator.ts",
    "src/lib/derive.ts",
    "src/lib/game.ts",
    "src/lib/loads.ts",
    "src/lib/units.ts",
    "src/lib/pickWeights.ts",
  ],
  mutator: { excludedMutations: ["StringLiteral"] },
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  tempDirName: ".stryker-tmp",
  incremental: true,
  incrementalFile: "reports/mutation/stryker-incremental.json",
  // Ratchet: the first run scored 34%; 55% on 2026-11-13, then 67.5% after tests for readiness, loads,
  // progression and the generator, then 76% after derive, plates, recovery and game rules, then 85% after generator and quest tests (round 3).
  // Raise break as tests land (Gradelings aims for 85).
  thresholds: { high: 85, low: 80, break: 80 },
  concurrency: 4,
  timeoutMS: 20000,
  ignoreStatic: true,
};

export default config;
