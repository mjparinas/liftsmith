"use client";

// The app's plate graphic: the shared PlateBar (also on the website's plate calculator, which stays English)
// with its words in the lifter's language (plate.<word> in src/locales/text/plate.ts).
import type { ComponentProps } from "react";

import { PLATE_WORDS, PlateBar as SharedPlateBar, type PlateWords } from "@/components/PlateBar";
import { t } from "@/lib/i18n";

export type { PlateFinish } from "@/components/PlateBar";

export function plateWords(): PlateWords {
  const out = {} as PlateWords;
  for (const k of Object.keys(PLATE_WORDS) as (keyof PlateWords)[]) out[k] = t(`plate.${k}`);
  return out;
}

export function PlateBar(props: Omit<ComponentProps<typeof SharedPlateBar>, "words">) {
  return <SharedPlateBar {...props} words={plateWords()} />;
}
