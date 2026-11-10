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
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
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

/** Plate colours follow the common competition convention so they read at a glance. */
export function plateStyle(weight: number, unit: "kg" | "lb"): { fill: string; text: string; height: number; width: number } {
  const kg = unit === "kg" ? weight : weight * 0.45359237;
  const t = Math.min(1, Math.max(0, kg / 25));
  const height = 34 + Math.round(t * 66);
  const width = kg >= 15 ? 14 : kg >= 5 ? 11 : 8;
  const colour =
    kg >= 24
      ? ["#d33b3b", "#fff"]
      : kg >= 19
        ? ["#2f6fdb", "#fff"]
        : kg >= 14
          ? ["#e7b416", "#111"]
          : kg >= 9
            ? ["#2e9e5b", "#04140b"]
            : kg >= 4.5
              ? ["#e8e8e8", "#111"]
              : kg >= 2
                ? ["#d33b3b", "#fff"]
                : kg >= 1.1
                  ? ["#2f6fdb", "#fff"]
                  : ["#9aa4b2", "#111"];
  return { fill: colour[0], text: colour[1], height, width };
}
