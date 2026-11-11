// Plain-language explanations for labels that aren't obvious (Melvin, 2026-11-09). Shown by the
// Info button (src/components/Info.tsx) next to the label, in the app and on the web dashboard.
// Keep each one short: what it means, then what it does for the lifter. The text lives in the
// catalogues (src/locales, keys gloss.<term>.title and gloss.<term>.body, paragraphs split by a
// newline), so it follows the app's language; GLOSSARY reads it through getters.
import type { MessageKey } from "@/locales/en";

import { t } from "./i18n";

const TERMS = [
  "deloadWeeks",
  "deload",
  "rir",
  "rpe",
  "blockWeek",
  "readiness",
  "call",
  "volume",
  "e1rm",
  "weeklySets",
  "variety",
  "recovery",
  "superset",
  "warmup",
  "firstWeights",
  "healthTwin",
  "hrv",
  "restingHr",
  "breathingRate",
  "vo2max",
  "bodyFat",
  "leanMass",
  "bmi",
  "restDrop",
  "fitnessAge",
  "barSpeed",
  "setTypes",
  "stretching",
  "crate",
] as const;

export type Term = (typeof TERMS)[number];
export type GlossaryEntry = { readonly title: string; readonly body: readonly string[] };

export const GLOSSARY = Object.fromEntries(
  TERMS.map((term) => [
    term,
    {
      get title() {
        return t(`gloss.${term}.title` as MessageKey);
      },
      get body() {
        return t(`gloss.${term}.body` as MessageKey).split("\n");
      },
    },
  ]),
) as unknown as Record<Term, GlossaryEntry>;
