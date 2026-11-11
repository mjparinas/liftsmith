import type { Unit } from "./types";

// The dumbbells and kettlebells a gym owns, as a sorted list of weights in the gym's unit
// (Melvin, 2026-11-11: "How do I customize dumb bells?"). Edited on the Gyms screen.

export type WeightKind = "dumbbells" | "kettlebells";

/** Rounds away float noise (2.5 × 3 = 7.499999…) to two decimals. */
const tidy = (n: number) => Math.round(n * 100) / 100;

/** Every weight from `from` to `to` in `step` jumps, both ends included. Empty for a bad range. */
export function stepRange(from: number, to: number, step: number): number[] {
  if (!(step > 0) || !(from > 0) || !(to >= from)) return [];
  const out: number[] = [];
  // At most 200 weights, so a tiny step can't build a huge list.
  for (let i = 0; out.length < 200; i++) {
    const w = tidy(from + i * step);
    if (w > to + 1e-6) break;
    out.push(w);
  }
  return out;
}

/** The list sorted, without duplicates or weights of zero or less. */
export function cleanWeights(list: readonly number[]): number[] {
  return [...new Set(list.map(tidy))].filter((w) => w > 0).sort((a, b) => a - b);
}

/** Adds `w` if it's missing, removes it if it's there. */
export function toggleWeight(list: readonly number[], w: number): number[] {
  const x = tidy(w);
  return list.includes(x) ? list.filter((y) => y !== x) : cleanWeights([...list, x]);
}

export interface WeightPreset {
  id: string;
  weights: number[];
}

/** Common sets to start from: a gym rack, a home set and adjustable dumbbells; standard kettlebells. */
export function weightPresets(kind: WeightKind, unit: Unit): WeightPreset[] {
  if (kind === "dumbbells") {
    return unit === "kg"
      ? [
          { id: "rack", weights: stepRange(2, 50, 2) },
          { id: "home", weights: stepRange(2, 30, 2) },
          // Common adjustable dumbbells go up in 2.5s and top out at 24 kg.
          { id: "adjustable", weights: [...stepRange(2.5, 22.5, 2.5), 24] },
        ]
      : [
          { id: "rack", weights: stepRange(5, 120, 5) },
          { id: "home", weights: stepRange(5, 60, 5) },
          { id: "adjustable", weights: stepRange(5, 52.5, 2.5) },
        ];
  }
  return unit === "kg"
    ? [
        { id: "standard", weights: [8, 12, 16, 20, 24, 28, 32] },
        { id: "full", weights: stepRange(4, 48, 4) },
      ]
    : [
        { id: "standard", weights: [15, 25, 35, 45, 55, 70] },
        { id: "full", weights: stepRange(10, 100, 5) },
      ];
}

/** The usual jump between weights for a fresh "fill a range" (the most common gap in the list). */
export function usualStep(list: readonly number[], unit: Unit): number {
  const gaps = new Map<number, number>();
  for (let i = 1; i < list.length; i++) {
    const g = tidy(list[i]! - list[i - 1]!);
    if (g > 0) gaps.set(g, (gaps.get(g) ?? 0) + 1);
  }
  let best = 0;
  let count = 0;
  for (const [g, c] of gaps) if (c > count || (c === count && g < best)) [best, count] = [g, c];
  return best || (unit === "kg" ? 2 : 5);
}
