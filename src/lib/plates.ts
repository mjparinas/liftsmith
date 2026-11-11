import type { PlateStock } from "./types";

// Which plates go on each side of the bar. Works in the gym's own unit so 45 lb and 20 kg plates
// stay exact. Uses a bounded knapsack over hundredths, so it finds a combination whenever one
// exists (a greedy fill misses some with odd plate sets) and prefers the fewest plates.

export interface Loading {
  /** Total on the bar including the bar itself. */
  total: number;
  /** Plates for one side, heaviest first. */
  perSide: number[];
  exact: boolean;
}

const SCALE = 100;

function sidesAvailable(plates: PlateStock[]): { w: number; pairs: number }[] {
  return plates
    .map((p) => ({ w: Math.round(p.weight * SCALE), pairs: Math.floor(p.count / 2) }))
    .filter((p) => p.w > 0 && p.pairs > 0)
    .sort((a, b) => b.w - a.w);
}

/** Fewer plates wins; on a tie, the one with the heavier first plate (how lifters load a bar). */
function better(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return a.length < b.length;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! > b[i]!;
  return false;
}

/** Every per-side load you can make, with the fewest-plates way to make it. */
function reachable(plates: PlateStock[], maxSide: number): Map<number, number[]> {
  const best = new Map<number, number[]>([[0, []]]);
  for (const { w, pairs } of sidesAvailable(plates)) {
    const entries = [...best.entries()];
    for (const [sum, combo] of entries) {
      for (let k = 1; k <= pairs; k++) {
        const s = sum + w * k;
        if (s > maxSide) break;
        const next = [...combo, ...Array(k).fill(w)].sort((a, b) => b - a);
        const cur = best.get(s);
        if (!cur || better(next, cur)) best.set(s, next);
      }
    }
  }
  return best;
}

/**
 * Load `target` on a bar of `bar` with the plates owned. Returns the exact loading when possible,
 * otherwise the nearest one (below wins a tie, because a lighter set is the safer miss).
 */
export function loadBar(target: number, bar: number, plates: PlateStock[]): Loading {
  const barU = Math.round(bar * SCALE);
  const wantSide = Math.max(0, (Math.round(target * SCALE) - barU) / 2);
  const totalPerSide = sidesAvailable(plates).reduce((s, p) => s + p.w * p.pairs, 0);
  const options = reachable(plates, Math.min(totalPerSide, Math.ceil(wantSide) + 5000));
  let pick = 0;
  let dist = Infinity;
  for (const s of options.keys()) {
    const d = Math.abs(s - wantSide);
    if (d < dist - 1e-9 || (Math.abs(d - dist) < 1e-9 && s < pick)) {
      pick = s;
      dist = d;
    }
  }
  const perSide = options.get(pick)!.map((w) => w / SCALE);
  return { total: (barU + pick * 2) / SCALE, perSide, exact: dist < 1e-9 };
}

/** The loadable totals nearest below and above a target (for "can't make 101, try 100 or 102.5"). */
export function nearestLoads(target: number, bar: number, plates: PlateStock[]): { below: number; above: number | null } {
  const barU = Math.round(bar * SCALE);
  const totalPerSide = sidesAvailable(plates).reduce((s, p) => s + p.w * p.pairs, 0);
  const sums = [...reachable(plates, totalPerSide).keys()].map((s) => (barU + s * 2) / SCALE).sort((a, b) => a - b);
  let below = bar;
  let above: number | null = null;
  for (const t of sums) {
    if (t <= target + 1e-9) below = t;
    else if (above === null) above = t;
  }
  return { below, above };
}

/** The smallest jump the plates allow (two of the lightest plate). */
export function smallestJump(plates: PlateStock[]): number {
  const light = sidesAvailable(plates).at(-1);
  return light ? (light.w * 2) / SCALE : 0;
}

type PlateHue = "red" | "blue" | "yellow" | "green" | "white" | "black" | "silver" | "orange" | "purple";

/**
 * One colour per plate size, so no two plates in a set look alike (Melvin, 2026-11-11: "every plate
 * should be a different colour"). The big plates use the competition colours (25 kg / 55 lb red,
 * 20 kg / 45 lb blue, 15 kg / 35 lb yellow, 10 kg / 25 lb green, 5 kg / 10 lb white). The change
 * plates follow the powerlifting habit of black and chrome instead of repeating red and blue.
 */
export const PLATE_HUES: Record<"kg" | "lb", Record<string, PlateHue>> = {
  kg: {
    25: "red",
    20: "blue",
    15: "yellow",
    10: "green",
    5: "white",
    2.5: "black",
    2: "purple",
    1.5: "orange",
    1.25: "silver",
    1: "purple",
    0.5: "orange",
  },
  lb: {
    55: "red",
    45: "blue",
    35: "yellow",
    25: "green",
    10: "white",
    5: "black",
    2.5: "silver",
    1.25: "orange",
    1: "purple",
    0.5: "purple",
  },
};

/** Text on each plate: dark on the light plates, white on the dark ones. */
const INK: Record<PlateHue, "dark" | "light"> = {
  red: "light",
  blue: "light",
  yellow: "dark",
  green: "dark",
  white: "dark",
  black: "light",
  silver: "dark",
  orange: "dark",
  purple: "light",
};

/** A plate size not in the table (a custom one) gets the colour of the nearest size below it. */
function hueFor(weight: number, unit: "kg" | "lb"): PlateHue {
  const table = PLATE_HUES[unit];
  const exact = table[String(weight)];
  if (exact) return exact;
  const below = Object.keys(table)
    .map(Number)
    .filter((w) => w <= weight)
    .sort((a, b) => b - a)[0];
  return below === undefined ? "silver" : table[String(below)]!;
}

/** How a plate is drawn: colours are CSS tokens (globals.css), so they follow light and dark mode. */
export function plateStyle(
  weight: number,
  unit: "kg" | "lb",
): { hue: PlateHue; fill: string; text: string; rim: string; height: number; width: number } {
  const kg = unit === "kg" ? weight : weight * 0.45359237;
  const t = Math.min(1, Math.max(0, kg / 25));
  const height = 34 + Math.round(t * 66);
  const width = kg >= 15 ? 14 : kg >= 5 ? 11 : 8;
  const hue = hueFor(weight, unit);
  const fill = `var(--plate-${hue})`;
  return {
    hue,
    fill,
    text: `var(--plate-ink-${INK[hue]})`,
    // The rim stands in for the plate's colour on the black, chrome and neon finishes.
    rim: hue === "black" ? "var(--plate-rim-black)" : fill,
    height,
    width,
  };
}
