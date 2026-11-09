import { dayKey, hash, rng } from "./random";
import type { Equipment, Muscle } from "./types";

// The general warm-up: a few minutes of movement prep before the first lift, built from the muscles in
// today's plan. It complements the per-exercise warm-up sets (warmup.ts, ramping up to the working
// weight), which are a separate thing. Optional: Today offers it, and it never blocks starting.

export interface Drill {
  id: string;
  name: string;
  /** Seconds, or reps when `reps` is set. */
  seconds: number;
  reps?: number;
  how: string;
  for: Muscle[];
  needs?: Equipment[];
  pulse?: boolean;
}

export const DRILLS: Drill[] = [
  { id: "march", name: "Brisk march or easy jog in place", seconds: 60, how: "Drive the knees and swing the arms until you feel warm.", for: [], pulse: true },
  { id: "jacks", name: "Jumping jacks", seconds: 45, how: "Light and quick on the balls of the feet. Step them out if you'd rather not jump.", for: ["calves", "sideDelts"], pulse: true },
  { id: "rower", name: "Easy row, bike or cross-trainer", seconds: 120, how: "Conversational pace, just enough to raise your heart rate.", for: [], pulse: true },
  { id: "arm-circles", name: "Arm circles", seconds: 30, how: "Small circles growing big, forwards then backwards.", for: ["frontDelts", "sideDelts", "rearDelts"] },
  { id: "pull-aparts", name: "Band pull-aparts", seconds: 0, reps: 15, how: "Arms straight, pull the band to your chest and squeeze the shoulder blades.", for: ["rearDelts", "upperBack"], needs: ["bands"] },
  { id: "scap-pushups", name: "Scapular push-ups", seconds: 0, reps: 10, how: "In a plank, let the chest sink between the shoulders, then push the floor away. Arms stay straight.", for: ["chest", "upperBack"] },
  { id: "inchworm", name: "Inchworms", seconds: 0, reps: 5, how: "Fold forward, walk the hands out to a plank, then walk the feet back in.", for: ["hamstrings", "abs", "chest"] },
  { id: "t-spine", name: "Open-book rotations", seconds: 0, reps: 8, how: "Lie on your side, knees bent, and open the top arm across to the floor behind you. Each side.", for: ["upperBack", "obliques", "lats"] },
  { id: "cat-cow", name: "Cat and cow", seconds: 0, reps: 8, how: "On hands and knees, round the whole spine up, then let it sag and lift the chest.", for: ["lowerBack", "abs"] },
  { id: "dead-hang", name: "Dead hang", seconds: 20, how: "Hang from the bar with relaxed shoulders, breathing slowly.", for: ["lats", "forearms"], needs: ["pullupBar"] },
  { id: "wrist", name: "Wrist circles and rocks", seconds: 30, how: "Circle the wrists, then rock gently over the palms on the floor.", for: ["forearms", "biceps", "triceps"] },
  { id: "bw-squat", name: "Bodyweight squats", seconds: 0, reps: 10, how: "Slow down, pause at the bottom, push the knees out.", for: ["quads", "glutes", "adductors"] },
  { id: "leg-swings", name: "Leg swings", seconds: 0, reps: 10, how: "Hold something steady and swing each leg front to back, then side to side.", for: ["hamstrings", "adductors", "glutes"] },
  { id: "worlds-greatest", name: "Lunge with a reach", seconds: 0, reps: 5, how: "Step into a long lunge, elbow down to the instep, then rotate and reach the arm to the ceiling. Each side.", for: ["glutes", "quads", "hamstrings", "upperBack"] },
  { id: "glute-bridge", name: "Glute bridges", seconds: 0, reps: 12, how: "Feet flat, push through the heels and squeeze at the top for a second.", for: ["glutes", "hamstrings"] },
  { id: "hip-hinge", name: "Hip hinge drill", seconds: 0, reps: 10, how: "Hands on hips, push the hips back with a long flat back until you feel the hamstrings.", for: ["hamstrings", "lowerBack", "glutes"] },
  { id: "ankle-rocks", name: "Ankle rocks", seconds: 0, reps: 10, how: "In a half kneel, rock the front knee forward past the toes, heel down. Each side.", for: ["calves", "quads"] },
  { id: "dead-bug", name: "Dead bugs", seconds: 0, reps: 8, how: "On your back, lower the opposite arm and leg slowly while the low back stays down. Each side.", for: ["abs", "obliques"] },
];

/** Rough time for a drill, counting reps at about 3 seconds each. */
export function drillSeconds(d: Drill): number {
  return d.reps ? d.reps * 3 * (/each side/i.test(d.how) ? 2 : 1) : d.seconds;
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
