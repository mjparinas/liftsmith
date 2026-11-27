// The website's free workout generator (docs/decisions/workout-generator.md). A visitor picks their equipment, the
// minutes they have, what to train, their goal and their experience, and the app's own adaptive engine (generate in
// generator.ts) writes the workout, as it would for a brand-new lifter with that gym. The picks travel in a short code
// (`?w=` on /tools/workout-generator/), so the same link always gives the same workout, in the browser and, through an
// App Link, in the Android app. Nothing about the visitor is needed or kept: no account, no history, no body weight.
import { defaultProfile, makeGym, PRESETS } from "./defaults";
import { EXERCISE_BY_ID } from "./exercises";
import { generate, type Plan, type PlanItem } from "./generator";
import { LEGS, PULL, PUSH } from "./programs";
import { TIMED } from "./progression";
import { EQUIPMENT, type Equipment, type Experience, type Goal, type Gym, type Muscle, type Profile, type Routine } from "./types";

export const GEN_MINUTES = { min: 15, max: 90, step: 5, start: 45 } as const;

/** Equipment presets: the setup wizard's four gyms. */
export const GEN_KITS = ["commercial", "home", "dumbbells", "bodyweight"] as const;
export type GenKit = (typeof GEN_KITS)[number];

/**
 * What to train. Full body leaves the engine free; the splits use the program splits' muscle lists (programs.ts), and
 * the single areas their own short lists. The engine only picks an exercise whose main muscles are all in the list.
 */
export const GEN_FOCUS = [
  "full",
  "upper",
  "lower",
  "push",
  "pull",
  "legs",
  "chest",
  "back",
  "shoulders",
  "arms",
  "glutes",
  "core",
] as const;
export type GenFocus = (typeof GEN_FOCUS)[number];

export const FOCUS_MUSCLES: Record<Exclude<GenFocus, "full">, readonly Muscle[]> = {
  upper: [...PUSH, ...PULL],
  lower: LEGS,
  push: PUSH,
  pull: PULL,
  legs: LEGS,
  chest: ["chest", "frontDelts", "triceps"],
  back: ["lats", "upperBack", "rearDelts", "traps", "lowerBack", "biceps"],
  shoulders: ["frontDelts", "sideDelts", "rearDelts", "traps"],
  arms: ["biceps", "triceps", "forearms"],
  glutes: ["glutes", "hamstrings", "adductors"],
  core: ["abs", "obliques", "lowerBack"],
};

export const GEN_GOALS: readonly Goal[] = ["muscle", "strength", "general"];
export const GEN_LEVELS: readonly Experience[] = ["new", "intermediate", "advanced"];

export interface GenOptions {
  equipment: Equipment[];
  minutes: number;
  focus: GenFocus;
  goal: Goal;
  level: Experience;
  /** Pair exercises into supersets (the app's free automatic supersets, autoSuperset.ts). */
  pairs: boolean;
  /** Picks a different workout for the same choices ("Another one"). */
  seed: number;
}

export const GEN_DEFAULTS: GenOptions = {
  equipment: kitEquipment("commercial"),
  minutes: GEN_MINUTES.start,
  focus: "full",
  goal: "muscle",
  level: "intermediate",
  pairs: false,
  seed: 1,
};

export function kitEquipment(kit: GenKit): Equipment[] {
  return [...PRESETS.find((p) => p.id === kit)!.equipment];
}

/** The preset whose equipment is exactly this, if any. */
export function kitOf(equipment: readonly Equipment[]): GenKit | undefined {
  const set = new Set(equipment);
  return GEN_KITS.find((k) => {
    const e = kitEquipment(k);
    return e.length === set.size && e.every((x) => set.has(x));
  });
}

// ---- The code in the link: "1.<equipment>.<minutes>.<focus>.<goal>.<level>.<pairs>.<seed>", equipment as a bit
// mask over EQUIPMENT (base 36), focus, goal and level as their index. A new item at the end of EQUIPMENT gets a new
// bit, so old links keep meaning what they meant.

const VERSION = "1";
const MAX_SEED = 36 ** 4;

export function encodeGen(o: GenOptions): string {
  let mask = 0;
  for (const e of o.equipment) {
    const i = EQUIPMENT.indexOf(e);
    if (i >= 0) mask += 2 ** i;
  }
  return [
    VERSION,
    mask.toString(36),
    clampMinutes(o.minutes),
    GEN_FOCUS.indexOf(o.focus),
    GEN_GOALS.indexOf(o.goal),
    GEN_LEVELS.indexOf(o.level),
    o.pairs ? 1 : 0,
    cleanSeed(o.seed).toString(36),
  ].join(".");
}

/** The options in a code, or null when it isn't one. */
export function decodeGen(code: string | null | undefined): GenOptions | null {
  if (!code || code.length > 40) return null;
  const parts = code.split(".");
  if (parts.length !== 8 || parts[0] !== VERSION) return null;
  const [, m, min, f, g, l, p, s] = parts as [string, string, string, string, string, string, string, string];
  if (!/^[0-9a-z]{1,11}$/.test(m) || !/^[0-9a-z]{1,4}$/.test(s)) return null;
  const mask = parseInt(m, 36);
  const minutes = Number(min);
  const focus = GEN_FOCUS[Number(f)];
  const goal = GEN_GOALS[Number(g)];
  const level = GEN_LEVELS[Number(l)];
  if (!Number.isSafeInteger(mask) || !Number.isInteger(minutes) || !focus || !goal || !level || (p !== "0" && p !== "1")) return null;
  if (clampMinutes(minutes) !== minutes) return null;
  const equipment = EQUIPMENT.filter((_, i) => Math.floor(mask / 2 ** i) % 2 === 1);
  return { equipment, minutes, focus, goal, level, pairs: p === "1", seed: cleanSeed(parseInt(s, 36)) };
}

function clampMinutes(n: number): number {
  const { min, max, step } = GEN_MINUTES;
  if (!Number.isFinite(n)) return GEN_MINUTES.start;
  return Math.min(max, Math.max(min, Math.round(n / step) * step));
}

const cleanSeed = (n: number) => (Number.isInteger(n) && n >= 0 ? n % MAX_SEED : 1);

/** A new seed for "Another one": the next one along, so it never repeats the one on screen. */
export const nextSeed = (seed: number) => (cleanSeed(seed) + 1) % MAX_SEED;

// ---- The workout. Every visitor is a first-time lifter on a fixed day in the first build week of a block (so never
// a deload), so the same code always gives the same workout.

/** A Monday at noon UTC: the same calendar day in every time zone the server or a phone might be in. */
export const GEN_DAY = Date.UTC(2026, 0, 5, 12);

export interface GenResult {
  plan: Plan;
  profile: Profile;
  gym: Gym;
}

export function genProfile(o: GenOptions): Profile {
  return {
    ...defaultProfile(GEN_DAY),
    goal: o.goal,
    experience: o.level,
    minutes: o.minutes,
    onboarded: true,
    training: o.pairs ? { supersets: true } : undefined,
  };
}

export function genGym(o: GenOptions): Gym {
  // The seed is in the gym's id, which seeds the engine's draw (with the day).
  return { ...makeGym("commercial", "kg", `web-${o.seed}`), name: "", equipment: [...o.equipment], updatedAt: GEN_DAY };
}

export function generateWeb(o: GenOptions): GenResult {
  const profile = genProfile(o);
  const gym = genGym(o);
  const muscles = o.focus === "full" ? undefined : [...FOCUS_MUSCLES[o.focus]];
  const plan = generate({ gym, profile, events: [], minutes: o.minutes, now: GEN_DAY, muscles });
  return { plan, profile, gym };
}

/** The workout as a routine, for "Start this in the app" (a routine link, routineShare.ts): no weights, as always. */
export function genRoutine(plan: Plan, name: string): Pick<Routine, "name" | "items"> {
  return {
    name,
    items: plan.items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, ...(i.group ? { group: i.group } : {}) })),
  };
}

/** Whether an item is timed (a hold or carry, in seconds), which never gets rep wording. */
export const isTimed = (item: Pick<PlanItem, "exerciseId">) => TIMED.has(item.exerciseId);

export const exerciseOf = (item: Pick<PlanItem, "exerciseId">) => EXERCISE_BY_ID.get(item.exerciseId);

/**
 * The options in the API's query: `w` (a link's code), or each choice on its own (`eq` a comma list, `min`, `focus`,
 * `goal`, `level`, `pairs`, `seed`), as the page sends them. Anything unknown is dropped or put back to its default.
 */
export function optionsFromQuery(q: URLSearchParams): GenOptions | null {
  const code = q.get("w");
  if (code) return decodeGen(code);
  const known = new Set<string>(EQUIPMENT);
  const eq = (q.get("eq") ?? "").split(",").filter((e): e is Equipment => known.has(e));
  const focus = (GEN_FOCUS as readonly string[]).includes(q.get("focus") ?? "") ? (q.get("focus") as GenFocus) : GEN_DEFAULTS.focus;
  const goal = GEN_GOALS.find((g) => g === q.get("goal")) ?? GEN_DEFAULTS.goal;
  const level = GEN_LEVELS.find((l) => l === q.get("level")) ?? GEN_DEFAULTS.level;
  const seed = Number(q.get("seed") ?? 1);
  return {
    equipment: eq,
    minutes: clampMinutes(Number(q.get("min") ?? GEN_MINUTES.start)),
    focus,
    goal,
    level,
    pairs: q.get("pairs") === "1",
    seed: cleanSeed(seed),
  };
}
