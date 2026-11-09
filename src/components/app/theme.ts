// Colour roles shared by the app screens (design pass, 2026-11-09). Hues are tints for marks and
// cards, never for body text; status colours (good, warn, bad) keep their meaning.
import type { Call } from "@/lib/readiness";
import type { Muscle } from "@/lib/types";
import type { IconName } from "./icons";

export const HUE = {
  accent: "#4c8dff",
  violet: "#a78bfa",
  cyan: "#38d6e8",
  ember: "#ff8a3d",
  mint: "#34d399",
  gold: "#f2c14e",
} as const;

/** Muscle families get one hue each, so a plan's balance shows at a glance. */
export type Family = "push" | "pull" | "legs" | "core";
const FAMILY: Record<Muscle, Family> = {
  chest: "push", frontDelts: "push", sideDelts: "push", triceps: "push",
  rearDelts: "pull", biceps: "pull", forearms: "pull", traps: "pull", upperBack: "pull", lats: "pull",
  lowerBack: "core", abs: "core", obliques: "core",
  glutes: "legs", quads: "legs", hamstrings: "legs", adductors: "legs", calves: "legs",
};
export const FAMILY_HUE: Record<Family, string> = { push: HUE.accent, pull: HUE.cyan, legs: HUE.violet, core: HUE.ember };
export const familyOf = (m: Muscle): Family => FAMILY[m];
export const muscleHue = (m: Muscle): string => FAMILY_HUE[FAMILY[m]];

/** Today's call: push days glow ember, easy days cool cyan, normal days brand blue. */
export const CALL_STYLE: Record<Call, { hue: string; icon: IconName }> = {
  push: { hue: HUE.ember, icon: "bolt" },
  normal: { hue: HUE.accent, icon: "target" },
  recover: { hue: HUE.cyan, icon: "leaf" },
};
