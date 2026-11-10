import type { MessageKey } from "@/locales/en";

import { t } from "./i18n";
import { dayKey, hash, rng } from "./random";
import type { Equipment, Muscle } from "./types";

// The general warm-up: a few minutes of movement prep before the first lift, built from the muscles in
// today's plan. It complements the per-exercise warm-up sets (warmup.ts, ramping up to the working
// weight), which are a separate thing. Optional: Today offers it, and it never blocks starting.

export interface Drill {
  id: string;
  /** In the app's language (warm.<id> in src/locales/text/warm.ts). */
  readonly name: string;
  /** Seconds, or reps when `reps` is set. */
  seconds: number;
  reps?: number;
  /** How to do it, in the app's language (warm.<id>.how). */
  readonly how: string;
  /** Done on each side, so the reps count twice. */
  eachSide?: boolean;
  for: Muscle[];
  needs?: Equipment[];
  pulse?: boolean;
}

const DATA: Omit<Drill, "name" | "how">[] = [
  {
    id: "march",
    seconds: 60,
    for: [],
    pulse: true,
  },
  {
    id: "jacks",
    seconds: 45,
    for: ["calves", "sideDelts"],
    pulse: true,
  },
  {
    id: "rower",
    seconds: 120,
    for: [],
    pulse: true,
  },
  {
    id: "arm-circles",
    seconds: 30,
    for: ["frontDelts", "sideDelts", "rearDelts"],
  },
  {
    id: "pull-aparts",
    seconds: 0,
    reps: 15,
    for: ["rearDelts", "upperBack"],
    needs: ["bands"],
  },
  {
    id: "scap-pushups",
    seconds: 0,
    reps: 10,
    for: ["chest", "upperBack"],
  },
  {
    id: "inchworm",
    seconds: 0,
    reps: 5,
    for: ["hamstrings", "abs", "chest"],
  },
  {
    id: "t-spine",
    seconds: 0,
    reps: 8,
    eachSide: true,
    for: ["upperBack", "obliques", "lats"],
  },
  {
    id: "cat-cow",
    seconds: 0,
    reps: 8,
    for: ["lowerBack", "abs"],
  },
  {
    id: "dead-hang",
    seconds: 20,
    for: ["lats", "forearms"],
    needs: ["pullupBar"],
  },
  {
    id: "wrist",
    seconds: 30,
    for: ["forearms", "biceps", "triceps"],
  },
  {
    id: "bw-squat",
    seconds: 0,
    reps: 10,
    for: ["quads", "glutes", "adductors"],
  },
  {
    id: "leg-swings",
    seconds: 0,
    reps: 10,
    for: ["hamstrings", "adductors", "glutes"],
  },
  {
    id: "worlds-greatest",
    seconds: 0,
    reps: 5,
    eachSide: true,
    for: ["glutes", "quads", "hamstrings", "upperBack"],
  },
  {
    id: "glute-bridge",
    seconds: 0,
    reps: 12,
    for: ["glutes", "hamstrings"],
  },
  {
    id: "hip-hinge",
    seconds: 0,
    reps: 10,
    for: ["hamstrings", "lowerBack", "glutes"],
  },
  {
    id: "ankle-rocks",
    seconds: 0,
    reps: 10,
    eachSide: true,
    for: ["calves", "quads"],
  },
  {
    id: "dead-bug",
    seconds: 0,
    reps: 8,
    eachSide: true,
    for: ["abs", "obliques"],
  },
];

export const DRILLS: Drill[] = DATA.map((d) => ({
  ...d,
  get name() {
    return t(`warm.${d.id}` as MessageKey);
  },
  get how() {
    return t(`warm.${d.id}.how` as MessageKey);
  },
}));

/** Rough time for a drill, counting reps at about 3 seconds each. */
export function drillSeconds(d: Drill): number {
  return d.reps ? d.reps * 3 * (d.eachSide ? 2 : 1) : d.seconds;
}

/**
 * About `minutes` of warm-up for today's muscles: one pulse raiser, then the drills that cover the most
 * of today's muscles, varied a little by day. Only drills the gym's equipment allows.
 */
export function warmupRoutine(muscles: readonly Muscle[], equipment: readonly Equipment[], now: number, minutes = 5): Drill[] {
  const have = new Set(equipment);
  const can = DRILLS.filter((d) => (d.needs ?? []).every((n) => have.has(n)));
  const r = rng(hash(`warmup:${dayKey(now)}`));
  const pulses = can.filter((d) => d.pulse && (d.id !== "rower" || minutes >= 6));
  const out: Drill[] = [pulses[Math.floor(r() * pulses.length)]];
  const want = new Set(muscles);
  const budget = minutes * 60;
  let used = drillSeconds(out[0]);
  const covered = new Set<Muscle>();
  const pool = can.filter((d) => !d.pulse).map((d) => ({ d, jitter: r() }));
  while (used < budget && pool.length) {
    pool.sort((a, b) => score(b.d) - score(a.d) || b.jitter - a.jitter);
    const { d } = pool.shift()!;
    if (score(d) <= 0 && out.length >= 3) break;
    if (used + drillSeconds(d) > budget + 20) continue;
    out.push(d);
    used += drillSeconds(d);
    d.for.forEach((m) => covered.add(m));
  }
  return out;

  function score(d: Drill): number {
    return d.for.reduce((s, m) => s + (want.has(m) ? (covered.has(m) ? 0.5 : 2) : 0), 0);
  }
}
