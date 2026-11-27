// Exercises the library has twice under the same name, and the website's list without them. Its own file so the
// site's helpers (seo.ts, bestFor.ts) can share it without importing each other.
import { EXERCISES } from "./exercises";
import type { Exercise } from "./types";

/**
 * Exercises the library has twice under the same name (2026-11-27, docs/decisions/seo.md "Same name, one page"): the
 * app keeps both ids, because logged sets point at them, but on the website two pages with one title split the
 * ranking for that search. The twin's page stays up for old links with its canonical address on the page named here,
 * and is left out of the sitemap and of every list that links to exercise pages. `exerciseMeta.test.ts` fails when a
 * new name is used twice without an entry.
 */
export const WEB_TWIN: Readonly<Record<string, string>> = {
  "db-chest-supported-row": "chest-supported-row",
  "cable-pullover": "straight-arm-pulldown",
  "db-shrug": "shrug",
  "db-wrist-curl": "wrist-curl",
  "db-walking-lunge": "walking-lunge",
  "single-leg-db-calf-raise": "db-calf-raise",
  "cable-hammer-curl": "rope-hammer-curl",
  "seated-dip-machine": "machine-dip",
  "barbell-lunge": "barbell-reverse-lunge",
  "db-y-raise": "incline-y-raise",
  "bw-lateral-step-up": "db-lateral-step-up",
  "pogo-jumps": "pogo-hops",
  "hanging-oblique-knee-raise": "hanging-oblique-raise",
  "ring-fallout": "ring-rollout",
  "kb-crossbody-carry": "kb-mixed-carry",
};
/** The page search engines should show for an exercise: its own, or its twin's. */
export const exercisePagePath = (id: string) => `/exercises/${WEB_TWIN[id] ?? id}/`;
/** The exercises with a page of their own on the website: the library without the twins. */
export const SITE_EXERCISES: readonly Exercise[] = EXERCISES.filter((e) => !(e.id in WEB_TWIN));
