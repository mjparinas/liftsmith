import { plateStyle, type Loading } from "@/lib/plates";
import type { Unit } from "@/lib/types";

import type { PoleDisc } from "./rig";

// Turns a real bar loading (`loadBar`) into disc sizes and sleeve positions for the 3D/2D demos.
// Without a loading the demos keep their fixed decorative stack.

/** A disc on one sleeve: radius and thickness in demo metres, centre at ±z from the bar middle. */
export interface DemoDisc {
  r: number;
  w: number;
  z: number;
}

/** Decorative three-disc look when the workout hasn't passed a real loading. */
export const DECORATIVE: readonly DemoDisc[] = [
  { r: 0.225, w: 0.05, z: 0.5 + 0.05 / 2 },
  { r: 0.19, w: 0.035, z: 0.5 + 0.055 + 0.035 / 2 },
  { r: 0.14, w: 0.025, z: 0.5 + 0.095 + 0.025 / 2 },
];

/** Small-bar decorative stack (curls / skull crushers). */
export const DECORATIVE_SMALL: readonly DemoDisc[] = DECORATIVE.map((d) => ({
  r: d.r * 0.55,
  w: d.w * 0.6,
  z: 0.42 + (d.z - 0.5) * 0.85,
}));

/** Trap-bar decorative stack (two discs per sleeve). */
export const DECORATIVE_TRAP: readonly DemoDisc[] = [
  { r: 0.225, w: 0.05, z: 0.42 + 0.05 / 2 },
  { r: 0.19, w: 0.035, z: 0.47 + 0.035 / 2 },
];

const MAX_DISCS = 8;
const GAP = 0.004;

/** Stable key so the scene rebuilds only when the stack or unit actually changes. */
export function loadingKey(loading?: Loading | null, unit?: Unit | null): string {
  if (!loading || !unit) return "";
  return `${unit}:${loading.oneEnd ? 1 : 0}:${loading.perSide.join(",")}`;
}

/** Map a plate weight to demo radius and thickness, scaled for small bars. */
export function discSize(weight: number, unit: Unit, scale = 1): { r: number; w: number } {
  const s = plateStyle(weight, unit);
  const t = Math.min(1, Math.max(0, (s.height - 34) / 66));
  const r = (0.12 + t * 0.105) * scale;
  const w = (0.018 + ((s.width - 8) / 6) * 0.032) * (scale < 1 ? 0.6 : 1);
  return { r, w };
}

/**
 * Stack plates on one sleeve, heaviest nearest the collar (same order as PlateBar).
 * `collarZ` is where the first plate's inner face starts.
 */
export function sleeveStack(perSide: readonly number[], unit: Unit, collarZ: number, scale = 1): DemoDisc[] {
  const out: DemoDisc[] = [];
  let z = collarZ;
  for (const weight of perSide.slice(0, MAX_DISCS)) {
    const { r, w } = discSize(weight, unit, scale);
    z += w / 2;
    out.push({ r, w, z });
    z += w / 2 + GAP;
  }
  return out;
}

/** Discs for a full olympic / ez bar, or the decorative default when loading is missing. */
export function barDiscs(loading: Loading | null | undefined, unit: Unit | null | undefined, small: boolean): DemoDisc[] {
  if (!loading || !unit) return small ? [...DECORATIVE_SMALL] : [...DECORATIVE];
  const collar = small ? 0.42 : 0.5;
  const scale = small ? 0.55 : 1;
  return sleeveStack(loading.perSide, unit, collar, scale);
}

/** Discs for a trap bar sleeve. */
export function trapDiscs(loading: Loading | null | undefined, unit: Unit | null | undefined): DemoDisc[] {
  if (!loading || !unit) return [...DECORATIVE_TRAP];
  return sleeveStack(loading.perSide, unit, 0.42, 1);
}

/**
 * Discs for a landmine sleeve (heaviest nearest the hands). `null` when there's no loading (keep the
 * pole's single default disc); empty when the bar is unloaded.
 */
export function poleDiscs(loading: Loading | null | undefined, unit: Unit | null | undefined): PoleDisc[] | null {
  if (!loading?.oneEnd || !unit) return null;
  if (!loading.perSide.length) return [];
  return loading.perSide.slice(0, MAX_DISCS).map((w) => discSize(w, unit));
}

/** Radii only (from `poleDiscs`); kept for callers that don't need thickness. */
export function poleRadii(loading: Loading | null | undefined, unit: Unit | null | undefined): number[] | null {
  const discs = poleDiscs(loading, unit);
  return discs === null ? null : discs.map((d) => d.r);
}
