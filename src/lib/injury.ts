import { roundLoad } from "./loads";
import { TIMED, type Target } from "./progression";
import type { AppEvent, BodyPart, Exercise, Gym, Muscle, Pattern } from "./types";

// Injury mode (Melvin, 2026-11-09). The lifter logs an injury by body part. Exercises that load that
// part are skipped until they mark it healed, or, if they choose after a risk warning, kept at a share
// of the usual load. Everything is derived from events, like the rest of the app.
//
// The matching is deliberately broad (better to skip one exercise too many), and the lifter can mark
// any single exercise as "doesn't hurt". None of this is medical advice, and the screens say so.

export const PART_LABEL: Record<BodyPart, string> = {
  neck: "Neck",
  shoulder: "Shoulder",
  elbow: "Elbow",
  wrist: "Wrist or hand",
  chest: "Chest",
  upperBack: "Upper back",
  lowerBack: "Lower back",
  abs: "Abs or core",
  hip: "Hip",
  groin: "Groin",
  quad: "Front of thigh",
  hamstring: "Hamstring",
  knee: "Knee",
  calf: "Calf",
  ankle: "Ankle or foot",
};

interface PartRule {
  /** Affected when any of these is a primary muscle. */
  primary: Muscle[];
  /** Also affected when any of these is a secondary muscle. */
  secondary: Muscle[];
  /** Movement patterns that load the part whatever the muscles. */
  patterns: Pattern[];
  /** Single exercises that load it (e.g. leg curls load the knee). */
  ids: string[];
}

const RULES: Record<BodyPart, PartRule> = {
  neck: { primary: ["traps"], secondary: ["traps"], patterns: [], ids: ["overhead-press", "back-squat"] },
  shoulder: { primary: ["frontDelts", "sideDelts", "rearDelts"], secondary: ["frontDelts", "sideDelts", "rearDelts"], patterns: ["vpush", "vpull"], ids: [] },
  elbow: { primary: ["biceps", "triceps", "forearms"], secondary: ["biceps"], patterns: [], ids: [] },
  wrist: { primary: ["forearms"], secondary: ["forearms"], patterns: ["hpush", "vpush"], ids: ["front-squat", "plank", "side-plank"] },
  chest: { primary: ["chest"], secondary: ["chest"], patterns: [], ids: [] },
  upperBack: { primary: ["upperBack", "lats", "traps"], secondary: ["upperBack"], patterns: [], ids: [] },
  lowerBack: { primary: ["lowerBack"], secondary: ["lowerBack"], patterns: ["hinge"], ids: [] },
  abs: { primary: ["abs", "obliques"], secondary: [], patterns: ["core"], ids: [] },
  hip: { primary: ["glutes", "adductors"], secondary: [], patterns: ["squat", "hinge", "lunge"], ids: [] },
  groin: { primary: ["adductors"], secondary: ["adductors"], patterns: [], ids: [] },
  quad: { primary: ["quads"], secondary: ["quads"], patterns: ["squat", "lunge"], ids: [] },
  hamstring: { primary: ["hamstrings"], secondary: ["hamstrings"], patterns: [], ids: [] },
  knee: { primary: ["quads"], secondary: [], patterns: ["squat", "lunge"], ids: ["lying-leg-curl", "nordic-curl"] },
  calf: { primary: ["calves"], secondary: ["calves"], patterns: [], ids: [] },
  ankle: { primary: ["calves"], secondary: [], patterns: ["squat", "lunge", "carry"], ids: [] },
};

/** Does this exercise load the injured part? */
export function affects(part: BodyPart, ex: Exercise): boolean {
  const r = RULES[part];
  return r.ids.includes(ex.id) || r.patterns.includes(ex.pattern) || ex.primary.some((m) => r.primary.includes(m)) || ex.secondary.some((m) => r.secondary.includes(m));
}

/** Shares of the usual load the lifter can pick, and the one offered first. */
export const LIGHT_PCTS = [50, 60, 70, 80, 90] as const;
export const DEFAULT_PCT = 70;

export type InjuryAction = "skip" | "light" | "ok";

export interface Rule {
  action: InjuryAction;
  pct: number;
}

export interface Injury {
  id: string;
  part: BodyPart;
  since: number;
  /** Healed (ms), for past injuries. */
  healedAt?: number;
  /** For every affected exercise unless overridden. Starts as skip. */
  all: Rule;
  /** Per-exercise choices, which win over `all`. */
  rules: Map<string, Rule>;
}

/** Every injury logged, newest first. Rules apply in time order, so the latest choice wins on every device. */
export function injuries(events: readonly AppEvent[]): Injury[] {
  const by = new Map<string, Injury>();
  const evs = events.filter((e) => e.type === "injury" || e.type === "injuryRule" || e.type === "injuryHealed").sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  for (const e of evs) {
    if (e.type === "injury") {
      if (!by.has(e.injuryId)) by.set(e.injuryId, { id: e.injuryId, part: e.part, since: e.at, all: { action: "skip", pct: DEFAULT_PCT }, rules: new Map() });
      continue;
    }
    const inj = by.get(e.injuryId);
    if (!inj) continue;
    if (e.type === "injuryHealed") inj.healedAt ??= e.at;
    else {
      const rule = { action: e.action, pct: clampPct(e.pct ?? inj.all.pct) };
      if (e.exerciseId) inj.rules.set(e.exerciseId, rule);
      else if (e.action !== "ok") {
        // A new "all" choice resets the per-exercise ones, so "skip them all" means all.
        inj.all = rule;
        inj.rules.clear();
      }
    }
  }
  return [...by.values()].sort((a, b) => b.since - a.since);
}

export function activeInjuries(events: readonly AppEvent[]): Injury[] {
  return injuries(events).filter((i) => i.healedAt === undefined);
}

function clampPct(p: number): number {
  return Math.min(95, Math.max(30, Math.round(p)));
}

export interface Effect {
  action: InjuryAction;
  /** Share of the usual load when light. */
  pct: number;
  parts: BodyPart[];
}

/** What the active injuries mean for one exercise: null when none touches it. Skip wins, then the lightest. */
export function effectFor(ex: Exercise, active: readonly Injury[]): Effect | null {
  const hits = active.filter((i) => affects(i.part, ex));
  if (!hits.length) return null;
  const rules = hits.map((i) => i.rules.get(ex.id) ?? i.all);
  const parts = [...new Set(hits.map((i) => i.part))];
  if (rules.some((r) => r.action === "skip")) return { action: "skip", pct: 0, parts };
  const light = rules.filter((r) => r.action === "light");
  if (light.length) return { action: "light", pct: Math.min(...light.map((r) => r.pct)), parts };
  return { action: "ok", pct: 100, parts };
}

/** Exercise ids the active injuries leave out. */
export function skippedIds(exercises: readonly Exercise[], active: readonly Injury[]): Set<string> {
  return new Set(exercises.filter((e) => effectFor(e, active)?.action === "skip").map((e) => e.id));
}

/**
 * A target at the lighter share: load scaled and rounded down to one the gym can make (reps for
 * bodyweight and timed work), and kept well short of failure (3+ reps in reserve).
 */
export function lighten(t: Target, ex: Exercise, pct: number, gym: Gym): Target {
  const share = pct / 100;
  const note = `Injury: ${pct}% of usual, stop if it hurts`;
  const rir = Math.max(t.rir, 3);
  if (ex.load === "bodyweight" || TIMED.has(ex.id) || t.weight <= 0) {
    return { ...t, reps: Math.max(TIMED.has(ex.id) ? 10 : 3, Math.round(t.reps * share)), rir, note };
  }
  const want = t.weight * share;
  const r = roundLoad(want, ex, gym).kg;
  // Never round up past the share the lifter picked.
  const weight = r > want + 1e-6 ? roundDown(want, ex, gym) : r;
  return { ...t, weight, rir, note };
}

function roundDown(want: number, ex: Exercise, gym: Gym): number {
  for (let k = 1; k <= 40; k++) {
    const r = roundLoad(want * (1 - k * 0.025), ex, gym).kg;
    if (r <= want + 1e-6) return r;
  }
  return roundLoad(0, ex, gym).kg;
}
