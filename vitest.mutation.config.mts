import { defineConfig } from "vitest/config";

import base from "./vitest.config.mts";

// Mutation runs (stryker.config.mjs) check the engine against the engine's own tests: every test under
// src/lib. Screen, site and server tests render or serve whole pages, so running them for each of the
// ~3,000 mutants made a run take about five hours, and the workflow was cancelled at its hour limit
// before writing any report (2026-11-11 and 2026-11-12).
export default defineConfig({ ...base, test: { ...base.test, include: ["src/lib/**/*.test.ts"] } });
