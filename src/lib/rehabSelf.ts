import { activeInjuries } from "./injury";
import type { AppEvent, BodyPart, Routine } from "./types";

// Rehab without a physio (2026-11-22): a free starting routine for an injury the lifter already logged, when no rehab
// program covers that area. It never says what's wrong or what will fix it. The offer is derived every time.

const DAY = 86_400_000;

export interface RehabSelfOffer {
  /** The injury the offer is about. */
  id: string;
  part: BodyPart;
  /** When it was logged. */
  since: number;
  /** Whole days it has been active. */
  days: number;
}

/**
 * Active injuries that have no saved rehab routine for that area. One per area (the oldest injury there). Empty when
 * every logged area already has a program, or nothing is active.
 */
export function rehabSelfOffer(
  events: readonly AppEvent[],
  routines: readonly Pick<Routine, "rehab" | "rehabPart">[] | undefined,
  now = Date.now(),
): RehabSelfOffer[] {
  const covered = new Set((routines ?? []).filter((r) => r.rehab && r.rehabPart).map((r) => r.rehabPart));
  const seen = new Set<BodyPart>();
  const out: RehabSelfOffer[] = [];
  const oldestFirst = activeInjuries(events, now)
    .slice()
    .sort((a, b) => a.since - b.since);
  for (const inj of oldestFirst) {
    if (covered.has(inj.part) || seen.has(inj.part)) continue;
    seen.add(inj.part);
    out.push({ id: inj.id, part: inj.part, since: inj.since, days: Math.max(0, Math.floor((now - inj.since) / DAY)) });
  }
  return out;
}

/** The oldest unmatched injury that has been active for at least `minDays` (the coach's note). */
export function rehabSelfNote(
  events: readonly AppEvent[],
  routines: readonly Pick<Routine, "rehab" | "rehabPart">[] | undefined,
  now = Date.now(),
  minDays = 7,
): RehabSelfOffer | undefined {
  const open = rehabSelfOffer(events, routines, now).filter((o) => o.days >= minDays);
  return open.reduce<RehabSelfOffer | undefined>((best, o) => (!best || o.since < best.since ? o : best), undefined);
}
