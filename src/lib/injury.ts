import { t as tr, translated } from "./i18n";
import { roundLoad } from "./loads";
import { TIMED, type Target } from "./progression";
import { BODY_PARTS, type AppEvent, type BodyPart, type Exercise, type Gym, type Muscle, type Pattern } from "./types";

// Injury mode (Melvin, 2026-11-09). The lifter logs an injury by body part. Exercises that load that
// part are skipped until they mark it healed, or, if they choose after a risk warning, kept at a share
// of the usual load. Everything is derived from events, like the rest of the app.
//
// The matching is deliberately broad (better to skip one exercise too many), and the lifter can mark
// any single exercise as "doesn't hurt". None of this is medical advice, and the screens say so.

export const PART_LABEL: Record<BodyPart, string> = translated(BODY_PARTS, (p) => `part.${p}`);

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
  shoulder: {
    primary: ["frontDelts", "sideDelts", "rearDelts"],
    secondary: ["frontDelts", "sideDelts", "rearDelts"],
    patterns: ["vpush", "vpull"],
    ids: [],
  },
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
  return (
    r.ids.includes(ex.id) ||
    r.patterns.includes(ex.pattern) ||
    ex.primary.some((m) => r.primary.includes(m)) ||
    ex.secondary.some((m) => r.secondary.includes(m))
  );
}

/** Shares of the usual load the lifter can pick, and the one offered first. */
export const LIGHT_PCTS = [50, 60, 70, 80, 90] as const;
export const DEFAULT_PCT = 70;

export type InjuryAction = "skip" | "light" | "ok";

export interface Rule {
  action: InjuryAction;
  pct: number;
}

export interface PainReading {
  at: number;
  score: number;
}

/** Graded return: where it stands. */
export interface Return {
  startedAt: number;
  /** Share of the usual load skipped exercises come back at: 50, then 70, then 90. */
  pct: number;
  /** 0, 1 or 2. */
  stage: number;
  /** A full week at 90% with low pain: time to decide whether it's healed. */
  readyToHeal: boolean;
  /** Pain reached 5+ during the return, so it stopped and the exercises are skipped again. */
  stopped?: { at: number; score: number };
}

export interface Injury {
  id: string;
  part: BodyPart;
  since: number;
  /** Pain ratings, oldest first. */
  pain: PainReading[];
  /** Graded return, when the lifter started one. */
  returning?: Return;
  /** Healed (ms), for past injuries. */
  healedAt?: number;
  /** For every affected exercise unless overridden. Starts as skip. */
  all: Rule;
  /** Per-exercise choices, which win over `all`. */
  rules: Map<string, Rule>;
}

/** Every injury logged, newest first. Rules apply in time order, so the latest choice wins on every device. */
export function injuries(events: readonly AppEvent[], now = Date.now()): Injury[] {
  const by = new Map<string, Injury>();
  const evs = events
    .filter(
      (e) => e.type === "injury" || e.type === "injuryRule" || e.type === "injuryHealed" || e.type === "pain" || e.type === "injuryReturn",
    )
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const returns = new Map<string, number>();
  for (const e of evs) {
    if (e.type === "injury") {
      if (!by.has(e.injuryId))
        by.set(e.injuryId, {
          id: e.injuryId,
          part: e.part,
          since: e.at,
          pain: [],
          all: { action: "skip", pct: DEFAULT_PCT },
          rules: new Map(),
        });
      continue;
    }
    const inj = by.get(e.injuryId);
    if (!inj) continue;
    if (e.type === "injuryHealed") inj.healedAt ??= e.at;
    else if (e.type === "pain") inj.pain.push({ at: e.at, score: Math.min(10, Math.max(0, Math.round(e.score))) });
    else if (e.type === "injuryReturn") returns.set(inj.id, e.at);
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
  for (const inj of by.values()) {
    const at = returns.get(inj.id);
    if (at !== undefined) inj.returning = gradedReturn(at, inj.pain, inj.healedAt ?? now);
  }
  return [...by.values()].sort((a, b) => b.since - a.since);
}

export function activeInjuries(events: readonly AppEvent[], now = Date.now()): Injury[] {
  return injuries(events, now).filter((i) => i.healedAt === undefined);
}

// ---- Pain and graded return (agreed with the coaching-features thread, 2026-11-09).
// Not medical advice: a simple, cautious rule the lifter opts into, with pain as the brake.

const DAY = 86_400_000;
const WEEK = 7 * DAY;
/** Pain at or below this counts as low. */
export const LOW_PAIN = 2;
/** Pain at or above this during a return stops it. */
export const STOP_PAIN = 5;
export const RETURN_PCTS = [50, 70, 90] as const;

/**
 * Can a graded return start? Pain has stayed at 2 or below for about a week: the low readings run
 * back at least 6 days, every reading since is low, and the latest is no more than 4 days old.
 */
export function returnReady(inj: Pick<Injury, "pain" | "returning">, now: number): boolean {
  if (inj.returning && !inj.returning.stopped) return false;
  const after = inj.returning?.stopped?.at ?? -Infinity;
  const xs = inj.pain.filter((p) => p.at > after);
  if (!xs.length || now - xs[xs.length - 1].at > 4 * DAY) return false;
  let i = xs.length;
  while (i > 0 && xs[i - 1].score <= LOW_PAIN) i--;
  if (i === xs.length) return false;
  return now - xs[i].at >= 6 * DAY;
}

/**
 * Where a return started at `start` stands. Each stage lasts at least a week and needs a low reading
 * in it to move on; a reading of 3 or 4 restarts the week; 5 or more stops the return.
 */
export function gradedReturn(start: number, pain: readonly PainReading[], now: number): Return {
  let stage = 0;
  let from = start;
  let low = false;
  const step = (t: number) => {
    while (stage < 2 && low && t - from >= WEEK) {
      stage += 1;
      from += WEEK;
      low = false;
    }
  };
  for (const p of pain) {
    if (p.at < start) continue;
    if (p.at > now) break;
    step(p.at);
    if (p.score >= STOP_PAIN)
      return { startedAt: start, pct: RETURN_PCTS[stage], stage, readyToHeal: false, stopped: { at: p.at, score: p.score } };
    if (p.score > LOW_PAIN) {
      from = p.at;
      low = false;
    } else low = true;
  }
  step(now);
  return { startedAt: start, pct: RETURN_PCTS[stage], stage, readyToHeal: stage === 2 && low && now - from >= WEEK };
}

/** The pain trend: change from the first to the latest of the last `n` readings (negative is better). */
export function painTrend(inj: Pick<Injury, "pain">, n = 14): { latest?: number; change?: number; points: number[] } {
  const points = inj.pain.slice(-n).map((p) => p.score);
  if (!points.length) return { points };
  return { latest: points[points.length - 1], change: points.length > 1 ? points[points.length - 1] - points[0] : undefined, points };
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
  // During a graded return, what would be skipped comes back at the return's share instead.
  const rules = hits.map((i) => {
    const r = i.rules.get(ex.id) ?? i.all;
    return r.action === "skip" && i.returning && !i.returning.stopped ? { action: "light" as const, pct: i.returning.pct } : r;
  });
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
  const note = tr("note.injury", { pct });
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
