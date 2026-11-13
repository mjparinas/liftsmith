import type { AppEvent, Profile } from "./types";

// How likely the adaptive planner is to pick each exercise for this lifter (Melvin, 2026-11-13: "each
// exercise should maintain a probability of being picked … custom to each user").
//
// Every exercise starts from how popular it is: staples (bench press, squats, deadlifts, rows, presses,
// curls, shrugs, lunges) are picked often, common variations sometimes and unusual moves rarely. A liked
// exercise (the star, `training.favourites`) is picked much more often. Swapping an exercise away for
// something else lowers it, and the one swapped in rises a little; both fade over a few months, so a
// lift the lifter skipped in a bad week comes back. "Not available here" swaps say nothing about taste
// (the gym was missing something), so they're left to `avoided` in generator.ts.
//
// The weights only move the draw among exercises that already passed the hard filters: equipment, a
// broken-equipment swap at this gym, injuries, recovery and the split day. Nothing here can bring
// back an exercise those took out.
//
// Nothing new is stored or synced: the likes live on the profile and the swaps are events, both of which
// already sync, so every device works out the same weights. The swaps are read out of the event log once
// and kept on the device (`SwapCache`), and later calls read only the events added since.

export type Popularity = "staple" | "common" | "niche";

/** The lifts most people program: picked most often. */
export const STAPLE: ReadonlySet<string> = new Set([
  // Chest
  "bench-press",
  "db-bench-press",
  "incline-bench-press",
  "db-incline-press",
  "machine-chest-press",
  "cable-fly",
  "push-up",
  "dip",
  // Shoulders
  "overhead-press",
  "seated-barbell-press",
  "db-shoulder-press",
  "db-standing-press",
  "lateral-raise",
  "face-pull",
  "rear-delt-fly",
  // Back
  "deadlift",
  "sumo-deadlift",
  "trap-bar-deadlift",
  "barbell-row",
  "db-row",
  "db-bent-over-row",
  "t-bar-row",
  "seated-cable-row",
  "chest-supported-row",
  "lat-pulldown",
  "pull-up",
  "chin-up",
  "barbell-shrug",
  "shrug",
  "db-shrug",
  // Arms
  "barbell-curl",
  "ez-curl",
  "db-curl",
  "hammer-curl",
  "db-concentration-curl",
  "pinwheel-curl",
  "db-cross-body-curl",
  "preacher-curl",
  "cable-curl",
  "skull-crusher",
  "cable-pushdown",
  "rope-pushdown",
  "db-overhead-extension",
  // Legs
  "back-squat",
  "front-squat",
  "goblet-squat",
  "leg-press",
  "hack-squat",
  "bulgarian-split-squat",
  "walking-lunge",
  "db-walking-lunge",
  "reverse-lunge",
  "db-reverse-lunge",
  "forward-lunge",
  "romanian-deadlift",
  "db-rdl",
  "leg-extension",
  "lying-leg-curl",
  "seated-leg-curl",
  "hip-thrust",
  "standing-calf-raise",
  "seated-calf-raise",
  // Core
  "plank",
  "crunch",
  "hanging-leg-raise",
  "hanging-knee-raise",
  "cable-crunch",
]);

/** Well-known variations: picked sometimes. Everything not here or in STAPLE is niche. */
export const COMMON: ReadonlySet<string> = new Set([
  // Chest
  "close-grip-bench",
  "db-fly",
  "pec-deck",
  "incline-push-up",
  "decline-push-up",
  "smith-bench-press",
  "smith-incline-press",
  "incline-machine-press",
  "low-cable-fly",
  "cable-crossover-high",
  "decline-bench-press",
  "db-decline-press",
  "db-incline-fly",
  "db-floor-press",
  "db-neutral-press",
  "paused-bench",
  "incline-cable-fly",
  "wide-push-up",
  "knee-push-up",
  "machine-dip",
  "close-grip-push-up",
  "diamond-push-up",
  "barbell-floor-press",
  // Shoulders
  "machine-shoulder-press",
  "cable-lateral-raise",
  "reverse-pec-deck",
  "band-pull-apart",
  "pike-push-up",
  "push-press",
  "landmine-press",
  "db-arnold-press",
  "db-front-raise",
  "cable-front-raise",
  "db-upright-row",
  "barbell-upright-row",
  "cable-upright-row",
  "machine-lateral-raise",
  "cable-rear-delt-fly",
  "cable-face-pull-rope",
  "db-seated-lateral-raise",
  "smith-shoulder-press",
  "db-push-press",
  "db-alternating-shoulder-press",
  "cable-shoulder-press",
  // Back
  "pendlay-row",
  "rack-pull",
  "good-morning",
  "machine-row",
  "cable-row-wide",
  "single-arm-cable-row",
  "close-grip-pulldown",
  "reverse-grip-pulldown",
  "wide-grip-pulldown",
  "neutral-grip-pulldown",
  "cable-pullover",
  "straight-arm-pulldown",
  "assisted-pull-up",
  "band-assisted-pull-up",
  "inverted-row",
  "neutral-grip-pull-up",
  "wide-pull-up",
  "kb-row",
  "landmine-row",
  "seal-row",
  "underhand-barbell-row",
  "smith-row",
  "machine-high-row",
  "db-chest-supported-row",
  "db-pullover",
  "back-extension",
  "weighted-back-extension",
  "trap-bar-shrug",
  "cable-shrug",
  "smith-shrug",
  "power-clean",
  "stiff-leg-deadlift",
  "deficit-deadlift",
  // Arms
  "incline-db-curl",
  "db-preacher-curl",
  "ez-preacher-curl",
  "machine-preacher-curl",
  "machine-curl",
  "cable-hammer-curl",
  "rope-hammer-curl",
  "spider-curl",
  "reverse-curl",
  "ez-reverse-curl",
  "zottman-curl",
  "db-alternating-curl",
  "seated-db-curl",
  "drag-curl",
  "kb-curl",
  "band-curl",
  "ez-skull-crusher",
  "db-skull-crusher",
  "cable-overhead-extension",
  "db-kickback",
  "bench-dip",
  "jm-press",
  "v-bar-pushdown",
  "straight-bar-pushdown",
  "reverse-grip-pushdown",
  "wrist-curl",
  "db-wrist-curl",
  "barbell-wrist-curl",
  "reverse-wrist-curl",
  "farmers-carry",
  // Legs
  "box-squat",
  "smith-squat",
  "pause-squat",
  "kb-goblet-squat",
  "bodyweight-squat",
  "split-squat",
  "db-split-squat",
  "step-up",
  "db-step-up",
  "lateral-lunge",
  "barbell-lunge",
  "barbell-reverse-lunge",
  "barbell-walking-lunge",
  "kb-lunge",
  "db-squat",
  "db-front-squat",
  "db-sumo-squat",
  "narrow-leg-press",
  "wide-leg-press",
  "single-leg-press",
  "pendulum-squat",
  "reverse-hack-squat",
  "smith-split-squat",
  "smith-hip-thrust",
  "single-leg-rdl",
  "db-single-leg-rdl",
  "trap-bar-rdl",
  "kb-deadlift",
  "kb-swing",
  "glute-bridge",
  "barbell-glute-bridge",
  "db-hip-thrust",
  "single-leg-hip-thrust",
  "cable-pull-through",
  "cable-kickback",
  "hip-abduction",
  "hip-adduction",
  "nordic-curl",
  "calf-press",
  "db-calf-raise",
  "bw-calf-raise",
  "smith-calf-raise",
  "barbell-calf-raise",
  "single-leg-calf-raise",
  "goblet-box-squat",
  "single-leg-extension",
  // Core
  "side-plank",
  "ab-wheel",
  "dead-bug",
  "pallof-press",
  "russian-twist",
  "bicycle-crunch",
  "lying-leg-raise",
  "reverse-crunch",
  "sit-up",
  "decline-sit-up",
  "db-crunch",
  "mountain-climber",
  "v-up",
  "hollow-hold",
  "bird-dog",
  "cable-woodchop",
  "kb-suitcase-carry",
  "db-suitcase-carry",
  "toes-to-bar",
  "oblique-crunch",
  "flutter-kicks",
  "db-side-bend",
]);

/** The starting weight for each popularity tier. Tuned so a typical gym's plans are mostly staples (pickWeights.test.ts). */
export const BASE: Record<Popularity, number> = { staple: 1, common: 0.2, niche: 0.012 };

/** A liked exercise starts as a staple, however unusual, and is picked this many times as often as one. */
export const LIKE = 40;
/** Each recent swap away multiplies the weight by this. */
export const SWAP_AWAY = 0.55;
/** Each recent swap in multiplies it by this, up to SWAP_IN_MAX. */
export const SWAP_IN = 1.15;
export const SWAP_IN_MAX = 1.6;
/** A swap counts half after this long, and not at all after SWAP_FORGET. */
export const SWAP_HALF_LIFE = 60 * 86400_000;
export const SWAP_FORGET = 365 * 86400_000;
/** No exercise falls below this share of its popularity, so a few swaps never bury a lift for good. */
export const FLOOR = 0.05;

/** Where an exercise's weight starts before swaps: its popularity, or a staple's when it's liked. */
function start(id: string, liked: ReadonlySet<string>): number {
  return liked.has(id) ? BASE.staple : BASE[popularity(id)];
}

export function popularity(id: string): Popularity {
  return STAPLE.has(id) ? "staple" : COMMON.has(id) ? "common" : "niche";
}

/** A swap that says something about taste: when, from what and to what. */
export interface TasteSwap {
  at: number;
  from: string;
  to: string;
}

/** How much one swap still counts, from 1 when new down to 0 after SWAP_FORGET. */
export function fade(age: number): number {
  if (age < 0) return 1;
  if (age >= SWAP_FORGET) return 0;
  return 0.5 ** (age / SWAP_HALF_LIFE);
}

/** The lifter's own nudges to one exercise, before popularity: liked, swapped away, swapped in. */
export interface Taste {
  liked: boolean;
  /** Faded count of swaps away. */
  away: number;
  /** Faded count of swaps in. */
  into: number;
  /** The multiplier on top of popularity (likes and swaps). */
  factor: number;
}

export interface PickWeights {
  /** Popularity (a staple's when liked) × likes × swaps, never below FLOOR of where it started. */
  weight(id: string): number;
  taste(id: string): Taste;
  /** Exercises picked less often because of swaps, most lowered first. */
  lowered(): string[];
}

/** Builds the weights from the taste swaps, likes and resets. Pure: the same inputs always give the same weights. */
export function buildWeights(swaps: readonly TasteSwap[], training: Profile["training"], now: number): PickWeights {
  const liked = new Set(training?.favourites ?? []);
  const resets = training?.pickResets ?? {};
  const away = new Map<string, number>();
  const into = new Map<string, number>();
  for (const s of swaps) {
    const f = fade(now - s.at);
    if (f <= 0) continue;
    if (s.at > (resets[s.from] ?? -Infinity)) away.set(s.from, (away.get(s.from) ?? 0) + f);
    if (s.at > (resets[s.to] ?? -Infinity)) into.set(s.to, (into.get(s.to) ?? 0) + f);
  }
  const taste = (id: string): Taste => {
    const a = away.get(id) ?? 0;
    const i = into.get(id) ?? 0;
    const like = liked.has(id) ? LIKE : 1;
    const factor = Math.max(FLOOR, like * SWAP_AWAY ** a * Math.min(SWAP_IN_MAX, SWAP_IN ** i));
    return { liked: liked.has(id), away: a, into: i, factor };
  };
  return {
    weight: (id) => start(id, liked) * taste(id).factor,
    taste,
    lowered: () =>
      [...away.keys()]
        .map((id) => ({ id, f: taste(id).factor }))
        .filter((x) => x.f < 0.8)
        .sort((x, y) => x.f - y.f || x.id.localeCompare(y.id))
        .map((x) => x.id),
  };
}

/** Reads the swaps that say something about taste out of the events, in order. */
export function tasteSwaps(events: readonly AppEvent[], from = 0): TasteSwap[] {
  const out: TasteSwap[] = [];
  for (let i = from; i < events.length; i++) {
    const e = events[i]!;
    if (e.type === "swap" && !e.avoid && e.from !== e.to) out.push({ at: e.at, from: e.from, to: e.to });
  }
  return out;
}

/** Storage for the swap cache: localStorage in the app, a map in tests. */
export interface CacheStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const CACHE_KEY = "liftsmith.pickSwaps.v1";

interface Cached {
  /** How many events were read. */
  n: number;
  /** Ids of the first and last events read, to tell when the log changed under us. */
  first: string;
  last: string;
  swaps: TasteSwap[];
}

function browserStore(): CacheStore | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Keeps the taste swaps on the device so the event log is read once: the next call reads only the events
 * added since. When the log changed in any other way (sync merged older events in, a workout was deleted,
 * another account signed in) it's read again from the start.
 */
export class SwapCache {
  private mem: Cached | undefined;
  private lastEvents: readonly AppEvent[] | undefined;
  /** How many events the last call read, for tests. */
  scanned = 0;
  constructor(private readonly store: CacheStore | undefined = browserStore()) {}

  swaps(events: readonly AppEvent[]): TasteSwap[] {
    if (events === this.lastEvents && this.mem?.n === events.length) {
      this.scanned = 0;
      return this.mem.swaps;
    }
    const prev = this.mem ?? this.load();
    const n = events.length;
    const fits = prev && prev.n > 0 && prev.n <= n && events[0]!.id === prev.first && events[prev.n - 1]!.id === prev.last;
    const swaps = fits ? [...prev.swaps, ...tasteSwaps(events, prev.n)] : tasteSwaps(events);
    this.scanned = fits ? n - prev.n : n;
    const next: Cached = { n, first: events[0]?.id ?? "", last: events[n - 1]?.id ?? "", swaps };
    this.mem = next;
    this.lastEvents = events;
    if (!prev || prev.n !== n || prev.last !== next.last || prev.first !== next.first) this.save(next);
    return swaps;
  }

  private load(): Cached | undefined {
    try {
      const raw = this.store?.getItem(CACHE_KEY);
      if (!raw) return undefined;
      const c = JSON.parse(raw) as Cached;
      return typeof c.n === "number" && Array.isArray(c.swaps) ? c : undefined;
    } catch {
      return undefined;
    }
  }

  private save(c: Cached): void {
    try {
      this.store?.setItem(CACHE_KEY, JSON.stringify(c));
    } catch {
      // Storage full or blocked: the in-memory copy still works.
    }
  }
}

const shared = new SwapCache();

/** This lifter's pick weights now, reading the swaps through the device cache. */
export function pickWeights(events: readonly AppEvent[], profile: Pick<Profile, "training">, now: number, cache?: SwapCache): PickWeights {
  return buildWeights((cache ?? shared).swaps(events), profile.training, now);
}

/**
 * Draws one item with probability in proportion to its weight. `r` is a number in [0, 1) from the seeded
 * generator. Items with no weight are never drawn; with no weight anywhere it falls back to the first item.
 */
export function draw<T>(items: readonly { item: T; w: number }[], r: number): T | undefined {
  let total = 0;
  for (const x of items) total += Math.max(0, x.w);
  if (!items.length) return undefined;
  if (total <= 0) return items[0]!.item;
  let left = r * total;
  for (const x of items) {
    const w = Math.max(0, x.w);
    if (w > 0 && left < w) return x.item;
    left -= w;
  }
  // Rounding: the last item with weight.
  for (let i = items.length - 1; i >= 0; i--) if (items[i]!.w > 0) return items[i]!.item;
  return items[0]!.item;
}
