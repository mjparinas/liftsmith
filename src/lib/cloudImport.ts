// What connected cloud services send in, as events (docs/decisions/connected-apps.md). Kept apart from the
// store so it can be tested on its own: ids come from the service and the day, so a re-import adds nothing.
import type { CloudCardio, CloudReading } from "./cloud";
import { MANUAL_RIR } from "./dashboard";
import type { AppEvent, BodyweightEvent, HealthEvent, HealthMetric, SessionEndEvent, SessionStartEvent, SetEvent } from "./types";

/** Concept2 machines to the library's cardio exercises (all logged with distance). */
export const C2_EXERCISE: Record<CloudCardio["kind"], string> = {
  rower: "rowing-machine",
  skierg: "ski-erg",
  bike: "stationary-bike",
};

/**
 * Health readings become `health` events (`<source>-<metric>-<day>-<value>`, as before). A scale's weight and
 * body fat for a day become one weigh-in, `<source>-bw-<day>`, like Health's `health-bw-<day>`; body fat
 * without a weight that day is left out, because a weigh-in needs a weight.
 */
export function cloudReadingEvents(source: string, readings: readonly CloudReading[], have: ReadonlySet<string>): AppEvent[] {
  const out: AppEvent[] = [];
  const body = new Map<string, { kg?: number; bodyFat?: number; at: number }>();
  for (const r of readings) {
    if (r.metric === "weight" || r.metric === "bodyFat") {
      const b = body.get(r.day) ?? { at: r.at };
      if (r.metric === "weight") {
        b.kg = r.value;
        b.at = r.at;
      } else b.bodyFat = r.value;
      body.set(r.day, b);
      continue;
    }
    const e: HealthEvent = {
      type: "health",
      id: `${source}-${r.metric}-${r.day}-${Math.round(r.value * 10)}`,
      at: r.at,
      metric: r.metric satisfies HealthMetric,
      day: r.day,
      value: r.value,
    };
    if (!have.has(e.id)) out.push(e);
  }
  for (const [day, b] of body) {
    if (!b.kg) continue;
    const e: BodyweightEvent = {
      type: "bodyweight",
      id: `${source}-bw-${day}`,
      at: b.at,
      kg: b.kg,
      ...(b.bodyFat ? { bodyFat: b.bodyFat } : {}),
    };
    if (!have.has(e.id)) out.push(e);
  }
  return out;
}

/**
 * Each Concept2 session as a finished cardio workout, written like a hand-logged past workout (dashboard.ts):
 * a manual session start, one set (reps are the seconds, with the distance) and an end. Ids `c2-<id>`.
 */
export function cloudCardioEvents(sessions: readonly CloudCardio[], gymId: string, now: number, have: ReadonlySet<string>): AppEvent[] {
  const out: AppEvent[] = [];
  for (const c of sessions) {
    const sessionId = `c2-${c.id}`;
    if (have.has(`${sessionId}-start`) || c.start > now) continue;
    const exerciseId = C2_EXERCISE[c.kind];
    const start: SessionStartEvent = {
      type: "sessionStart",
      id: `${sessionId}-start`,
      at: c.start,
      sessionId,
      gymId,
      minutes: Math.max(1, Math.round(c.seconds / 60)),
      source: "manual",
    };
    const set: SetEvent = {
      type: "set",
      id: `${sessionId}-s0`,
      at: c.start + c.seconds * 1000,
      sessionId,
      exerciseId,
      weight: 0,
      reps: c.seconds,
      targetReps: c.seconds,
      distanceM: c.distanceM,
      rir: MANUAL_RIR,
    };
    const end: SessionEndEvent = {
      type: "sessionEnd",
      id: `${sessionId}-end`,
      at: c.start + c.seconds * 1000,
      sessionId,
      seconds: c.seconds,
    };
    out.push(start, set, end);
  }
  return out;
}
