import { loadBar, type Loading } from "./plates";
import type { Exercise, Gym } from "./types";
import { fromKg, toKg } from "./units";

// Rounds a wanted weight to one the gym can actually make.

export function barFor(ex: Exercise, gym: Gym) {
  const id = ex.needs.includes("trapBar") ? "trap" : ex.needs.includes("ezBar") ? "ez" : "olympic";
  return gym.bars.find((b) => b.id === id) ?? gym.bars[0] ?? { id: "olympic", name: "Barbell", weight: gym.unit === "kg" ? 20 : 45 };
}

function nearest(list: number[], v: number): number {
  if (!list.length) return v;
  return list.reduce(
    (best, x) => (Math.abs(x - v) < Math.abs(best - v) || (Math.abs(x - v) === Math.abs(best - v) && x < best) ? x : best),
    list[0],
  );
}

export interface Rounded {
  kg: number;
  loading?: Loading;
}

/** `kg` is the wanted load: total bar weight for barbells, one hand for dumbbells, stack for machines. */
export function roundLoad(kg: number, ex: Exercise, gym: Gym): Rounded {
  const u = gym.unit;
  const want = fromKg(Math.max(0, kg), u);
  switch (ex.load) {
    case "barbell": {
      const bar = barFor(ex, gym);
      const loading = loadBar(Math.max(bar.weight, want), bar.weight, gym.plates);
      return { kg: toKg(loading.total, u), loading };
    }
    case "dumbbell":
      return { kg: toKg(nearest(gym.dumbbells, want), u) };
    case "kettlebell":
      return { kg: toKg(nearest(gym.kettlebells, want), u) };
    case "machine": {
      const step = gym.machineStep || (u === "kg" ? 2.5 : 5);
      return { kg: toKg(Math.max(step, Math.round(want / step) * step), u) };
    }
    case "bodyweight":
      return { kg: 0 };
  }
}

/** The next weight up or down from `kg` that the gym can make (for the +/- steppers). */
export function stepLoad(kg: number, dir: 1 | -1, ex: Exercise, gym: Gym): number {
  const u = gym.unit;
  const cur = fromKg(kg, u);
  if (ex.load === "dumbbell" || ex.load === "kettlebell") {
    const list = [...(ex.load === "dumbbell" ? gym.dumbbells : gym.kettlebells)].sort((a, b) => a - b);
    const next = dir > 0 ? list.find((x) => x > cur + 1e-6) : [...list].reverse().find((x) => x < cur - 1e-6);
    return toKg(next ?? cur, u);
  }
  if (ex.load === "machine") {
    const step = gym.machineStep || (u === "kg" ? 2.5 : 5);
    return toKg(Math.max(0, cur + dir * step), u);
  }
  if (ex.load === "barbell") {
    const bar = barFor(ex, gym);
    // Try growing jumps until the plates give a different total.
    for (let jump = 0.5; jump <= 50; jump += 0.5) {
      const l = loadBar(cur + dir * jump, bar.weight, gym.plates);
      if ((dir > 0 && l.total > cur + 1e-6) || (dir < 0 && l.total < cur - 1e-6)) return toKg(l.total, u);
    }
    return kg;
  }
  return kg;
}
