import { injuries } from "./injury";
import { sessionPain } from "./partMetrics";
import { phaseItems, PHASES, rehabProgram } from "./rehab";
import type { AppEvent, BodyPart, PainEvent, RehabPlan, Routine, RoutineItem } from "./types";

// Rehab protocols (2026-11-17, from the gap list: "Physio rehab protocols with pain tracking"; docs/decisions/trainer-mode.md
// "Rehab protocols"). A protocol moves through three phases by one pain rule, read from the pain ratings the lifter
// already gives after each exercise and, new, the day after a rehab workout:
//  - Ready to move up: at least PHASE_MIN_SESSIONS sessions in this phase, pain PAIN_EASY or less after each of the
//    last three rated ones, and no flare the next day.
//  - Back a phase: pain PAIN_HIGH or more after two of the last three, or a flare the next day (PAIN_HIGH or more, or
//    FLARE points above how it felt going in).
// It's the same kind of pain-monitoring rule physios use, written as plain numbers so both sides see why. The physio
// moves the phase (Coaching, one tap); the lifter moves it only when the physio allowed it. Nothing is stored: it's
// read from the events every time.

/** Sessions in a phase before it can move up (about two weeks at three times a week). */
export const PHASE_MIN_SESSIONS = 6;
/** Pain this low after a session counts as easy. */
export const PAIN_EASY = 2;
/** Pain this high after a session, or the next day, is too much for the phase (the same 5 that stops a graded return). */
export const PAIN_HIGH = 5;
/** A next-day rating this far above how it felt going in is a flare. */
export const FLARE = 2;
/** The latest rated sessions the rule reads. */
export const PHASE_LOOK = 3;

const DAY = 86_400_000;

export type PhaseStatus =
  /** Fewer sessions in this phase than the rule needs. */
  | "early"
  /** Enough sessions, but fewer than three with a pain rating. */
  | "unrated"
  /** Pain easy and steady: ready for the next phase. */
  | "ready"
  /** The same in the last phase: the physio decides when they're done. */
  | "last"
  /** Pain too high or a flare the next day: back a phase. */
  | "back"
  /** Neither: stay in this phase. */
  | "hold";

export interface PhaseCheck {
  phase: number;
  of: number;
  /** Sessions done in this phase. */
  sessions: number;
  need: number;
  /** Pain after the latest rated sessions (the worst of the area's injuries in each), oldest first, at most three. */
  recent: number[];
  /** A flare the day after one of those sessions. */
  flare: boolean;
  status: PhaseStatus;
}

export interface RehabSession {
  sessionId: string;
  start: number;
}

/** The workouts a rehab routine was done in, as a whole workout or as a part beside the lifting, oldest first. */
export function rehabSessions(events: readonly AppEvent[], routineId: string): RehabSession[] {
  const out: RehabSession[] = [];
  for (const e of events) {
    if (e.type === "sessionStart" && e.routine === routineId) out.push({ sessionId: e.sessionId, start: e.at });
    else if (e.type === "sessionEnd" && (e.parts ?? []).some((p) => p.kind === "rehab" && p.ref === routineId)) {
      const start = (e.parts ?? []).find((p) => p.kind === "rehab" && p.ref === routineId)!.start;
      if (!out.some((s) => s.sessionId === e.sessionId)) out.push({ sessionId: e.sessionId, start });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Day-after ratings by the session they follow. */
function nextDayRatings(events: readonly AppEvent[]): Map<string, PainEvent[]> {
  const out = new Map<string, PainEvent[]>();
  for (const e of events) if (e.type === "pain" && e.nextDay) out.set(e.nextDay, [...(out.get(e.nextDay) ?? []), e]);
  return out;
}

/** Where a phase stands by the pain rule: the sessions done in it and the injuries it's for. */
export function phaseCheck(
  events: readonly AppEvent[],
  sessions: readonly RehabSession[],
  injuryIds: ReadonlySet<string>,
  phase: number,
): PhaseCheck {
  const after = nextDayRatings(events);
  const rated: { after: number; flare: boolean }[] = [];
  for (const s of sessions) {
    const pains = sessionPain(events, s.sessionId, s.start).filter((p) => injuryIds.has(p.injuryId));
    if (!pains.length) continue;
    const worst = Math.max(...pains.map((p) => p.after));
    const flare = (after.get(s.sessionId) ?? []).some((n) => {
      if (!injuryIds.has(n.injuryId)) return false;
      const base = pains.find((p) => p.injuryId === n.injuryId);
      const from = base?.before ?? base?.after ?? 0;
      return n.score >= PAIN_HIGH || n.score - from >= FLARE;
    });
    rated.push({ after: worst, flare });
  }
  const last = rated.slice(-PHASE_LOOK);
  const recent = last.map((r) => r.after);
  const flare = last.some((r) => r.flare);
  const base = { phase, of: PHASES, sessions: sessions.length, need: PHASE_MIN_SESSIONS, recent, flare };
  const high = recent.filter((n) => n >= PAIN_HIGH).length;
  let status: PhaseStatus;
  if (phase > 1 && (high >= 2 || flare)) status = "back";
  else if (sessions.length < PHASE_MIN_SESSIONS) status = "early";
  else if (recent.length < PHASE_LOOK) status = "unrated";
  else if (!flare && recent.every((n) => n <= PAIN_EASY)) status = phase < PHASES ? "ready" : "last";
  else status = "hold";
  return { ...base, status };
}

/** The phase a check points to: the next one when ready, the one before when it says back, else none. */
export function phaseTo(check: PhaseCheck): number | undefined {
  if (check.status === "ready") return check.phase + 1;
  if (check.status === "back") return check.phase - 1;
  return undefined;
}

/** The active injuries a routine is for (its area, or all of them), by id. */
export function areaInjuries(events: readonly AppEvent[], part: BodyPart | undefined, now: number): Set<string> {
  return new Set(
    injuries(events, now)
      .filter((i) => i.healedAt === undefined && (!part || i.part === part))
      .map((i) => i.id),
  );
}

/** The lifter's own check of their rehab routine's phase, when it follows a protocol and an injury it's for is active. */
export function routinePhase(
  events: readonly AppEvent[],
  routine: Pick<Routine, "id" | "rehabPart" | "rehabPlan">,
  now: number,
): PhaseCheck | undefined {
  const plan = routine.rehabPlan;
  if (!plan || !rehabProgram(plan.id)) return undefined;
  const hurt = areaInjuries(events, routine.rehabPart, now);
  if (!hurt.size) return undefined;
  const since = plan.since ?? 0;
  const sessions = rehabSessions(events, routine.id).filter((s) => s.start >= since && s.start <= now);
  return phaseCheck(events, sessions, hurt, plan.phase);
}

/** The routine moved to another phase of its protocol: that phase's exercises and name, starting now. */
export function movePhase(routine: Routine, phase: number, name: string, now: number): Routine {
  const p = rehabProgram(routine.rehabPlan?.id);
  if (!p || !routine.rehabPlan) return routine;
  const to = Math.min(PHASES, Math.max(1, phase));
  return {
    ...routine,
    name,
    items: phaseItems(p, to),
    rehabPlan: { ...routine.rehabPlan, phase: to, since: now },
    updatedAt: now,
  };
}

/**
 * The rehab workout the day-after check asks about: the newest one, when it was done yesterday (by the calendar),
 * had a pain rating for an injury that's still active, and has no day-after rating yet. Undefined otherwise.
 */
export function nextDayDue(
  events: readonly AppEvent[],
  routine: Pick<Routine, "id" | "rehabPart">,
  now: number,
): { sessionId: string; injuryIds: string[] } | undefined {
  const last = rehabSessions(events, routine.id).at(-1);
  if (!last) return undefined;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const t0 = today.getTime();
  if (last.start >= t0 || last.start < t0 - DAY) return undefined;
  const hurt = areaInjuries(events, routine.rehabPart, now);
  const rated = sessionPain(events, last.sessionId, last.start)
    .map((p) => p.injuryId)
    .filter((id) => hurt.has(id));
  if (!rated.length) return undefined;
  const done = new Set((nextDayRatings(events).get(last.sessionId) ?? []).map((p) => p.injuryId));
  const left = rated.filter((id) => !done.has(id));
  return left.length ? { sessionId: last.sessionId, injuryIds: left } : undefined;
}

/**
 * For a physio: which phase of a protocol each of the client's workouts followed (60%+ of that phase's exercises,
 * the same match as an assigned routine), so a client who moved on their own is still followed.
 */
export function sessionPhase(protocol: RehabPlan["id"], exercises: readonly string[]): number | undefined {
  const p = rehabProgram(protocol);
  if (!p) return undefined;
  const did = new Set(exercises);
  let best: { phase: number; share: number } | undefined;
  p.phases.forEach((items: readonly RoutineItem[], i) => {
    const want = new Set(items.map((x) => x.exerciseId));
    const share = [...want].filter((id) => did.has(id)).length / want.size;
    if (share >= 0.6 && (!best || share > best.share)) best = { phase: i + 1, share };
  });
  return best?.phase;
}
