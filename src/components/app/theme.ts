// Colour roles shared by the app screens (design pass, 2026-11-09). Hues are tints for marks and
// cards, never for body text; status colours (good, warn, bad) keep their meaning.
import type { Call } from "@/lib/readiness";
import type { Muscle } from "@/lib/types";

import type { IconName } from "./icons";

// CSS variables (globals.css), so each hue has a dark and a light value.
export const HUE = {
  accent: "var(--color-accent)",
  violet: "var(--color-violet)",
  cyan: "var(--color-cyan)",
  ember: "var(--color-ember)",
  mint: "var(--color-mint)",
  gold: "var(--color-gold)",
} as const;

/** Muscle families get one hue each, so a plan's balance shows at a glance. */
export type Family = "push" | "pull" | "legs" | "core";
const FAMILY: Record<Muscle, Family> = {
  chest: "push",
  frontDelts: "push",
  sideDelts: "push",
  triceps: "push",
  rearDelts: "pull",
  biceps: "pull",
  forearms: "pull",
  traps: "pull",
  upperBack: "pull",
  lats: "pull",
  lowerBack: "core",
  abs: "core",
  obliques: "core",
  glutes: "legs",
  quads: "legs",
  hamstrings: "legs",
  adductors: "legs",
  calves: "legs",
};
export const FAMILY_HUE: Record<Family, string> = { push: HUE.accent, pull: HUE.cyan, legs: HUE.violet, core: HUE.ember };
export const familyOf = (m: Muscle): Family => FAMILY[m];
export const muscleHue = (m: Muscle): string => FAMILY_HUE[FAMILY[m]];

/** Today's call, like a traffic light: easy days amber, normal days blue, push days green (their own
 *  tokens, with a colour-blind safe set, so the three never look alike; Melvin, 2026-11-11). The
 *  "How do you feel?" chips use the same colours for what they lead to (FEEL_HUE). */
export const CALL_STYLE: Record<Call, { hue: string; icon: IconName }> = {
  push: { hue: "var(--call-push)", icon: "bolt" },
  normal: { hue: "var(--call-normal)", icon: "target" },
  recover: { hue: "var(--call-easy)", icon: "leaf" },
};

/** The "How do you feel?" chips: Low, Okay and Great share the colour of the call they lean toward;
 *  Sore is red and Unwell violet. */
export const FEEL_HUE = {
  low: "var(--call-easy)",
  ok: "var(--call-normal)",
  great: "var(--call-push)",
  sore: "var(--feel-sore)",
  unwell: "var(--feel-unwell)",
} as const;
