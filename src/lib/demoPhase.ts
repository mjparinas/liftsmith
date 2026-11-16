// The move name an exercise demo shows in its corner ("LOWER · 2S"), in the lifter's language. The motions
// (src/lib/demo/) label their phases in English; the words for every language are in
// src/locales/text/phase.ts under phase.<slug of the English label>. A label with no entry stays English,
// and demoPhase.test.ts fails so it gets one.
import type { MessageKey } from "@/locales/en";
import en from "@/locales/load/en";

import { t } from "./i18n";

/** "Hips back" → "hips-back": the catalogue key for an English phase label (without its seconds). */
export const phaseSlug = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The label without its seconds, and the seconds part (" · 2s"), if any. */
export function splitPhase(label: string): [word: string, seconds: string] {
  const m = /^(.*?)(\s*·\s*[\d.]+s)?$/.exec(label);
  return [m?.[1] ?? label, m?.[2] ?? ""];
}

export const phaseKey = (word: string) => `phase.${phaseSlug(word)}`;

/** The phase label in the app's language, seconds kept as they are. */
export function phaseWord(label: string): string {
  if (!label) return label;
  const [word, seconds] = splitPhase(label);
  const key = phaseKey(word);
  return key in en ? t(key as MessageKey) + seconds : label;
}
