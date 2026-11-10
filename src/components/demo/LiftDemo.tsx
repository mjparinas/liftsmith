"use client";

// The app's exercise demo: LiftDemoCore with the muscle names and its own words in the lifter's language.
// The public website uses LiftDemoCore directly with English names from the server, so its pages don't
// load the catalogues.
import { t } from "@/lib/i18n";
import { MUSCLE_LABEL } from "@/lib/types";

import { DEMO_WORDS, LiftDemoCore, type DemoWords, type LiftDemoProps } from "./LiftDemoCore";

export { bodyFor, detectMode, type DemoMode, type LiftDemoProps } from "./LiftDemoCore";

/** DEMO_WORDS in the app's language (demo.<word> in src/locales/text/demo.ts). */
export function demoWords(): DemoWords {
  const out = {} as DemoWords;
  for (const k of Object.keys(DEMO_WORDS) as (keyof DemoWords)[]) out[k] = t(`demo.${k}`);
  return out;
}

export function LiftDemo(props: LiftDemoProps) {
  return <LiftDemoCore {...props} labels={MUSCLE_LABEL} words={demoWords()} />;
}
