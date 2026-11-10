import { defaultProfile, makeGym, type GymPreset } from "@/lib/defaults";
import type { Gym, Profile, SessionEndEvent, SessionStartEvent, SetEvent, Unit } from "@/lib/types";

// Typed test data. Each factory fills every required field with a plain, readable default and takes
// overrides for what the test is about, so a new required field is added here once instead of in
// every test file. Ids count up, so the data is the same on every run (no randomness).

export const DAY = 24 * 3600_000;
/** A fixed "now" for tests that don't care which day it is: Monday 2 November 2026, 12:00 UTC. */
export const NOW = Date.UTC(2026, 10, 2, 12);

let n = 0;
/** A fresh id: `${prefix}1`, `${prefix}2`, … */
export const nextId = (prefix = "e") => `${prefix}${++n}`;

/** One working set: 60 kg × 8 on the bench at `NOW`, hit as planned at 2 reps in reserve. */
export function makeSet(over: Partial<SetEvent> = {}): SetEvent {
  const reps = over.reps ?? 8;
  return {
    type: "set",
    id: nextId("set"),
    at: NOW,
    sessionId: "s1",
    exerciseId: "bench-press",
    weight: 60,
    reps,
    targetReps: reps,
    rir: 2,
    ...over,
  };
}

/** `count` sets of the same exercise a minute apart, starting at `over.at`. */
export function makeSets(count: number, over: Partial<SetEvent> = {}): SetEvent[] {
  const at = over.at ?? NOW;
  return Array.from({ length: count }, (_, i) => makeSet({ ...over, at: at + i * 60_000 }));
}

export function makeSessionStart(over: Partial<SessionStartEvent> = {}): SessionStartEvent {
  return { type: "sessionStart", id: nextId("start"), at: NOW, sessionId: "s1", gymId: "g1", minutes: 45, ...over };
}

export function makeSessionEnd(over: Partial<SessionEndEvent> = {}): SessionEndEvent {
  return { type: "sessionEnd", id: nextId("end"), at: NOW + 45 * 60_000, sessionId: "s1", seconds: 45 * 60, ...over };
}

/** A whole workout: start, `sets`, end. The sets take the session's id and are spread a minute apart. */
export function makeWorkout(sessionId: string, at: number, sets: Partial<SetEvent>[]) {
  const logged = sets.map((s, i) => makeSet({ ...s, sessionId, at: at + (i + 1) * 60_000 }));
  return [
    makeSessionStart({ sessionId, at }),
    ...logged,
    makeSessionEnd({ sessionId, at: at + (sets.length + 1) * 60_000, seconds: (sets.length + 1) * 60 }),
  ];
}

/** The profile a new install starts with, onboarded, plus overrides. */
export function makeProfile(over: Partial<Profile> = {}): Profile {
  return { ...defaultProfile(NOW), onboarded: true, ...over };
}

/** A gym from one of the setup presets (a full commercial gym by default). */
export function makeTestGym(preset: GymPreset = "commercial", unit: Unit = "kg", over: Partial<Gym> = {}): Gym {
  return { ...makeGym(preset, unit, over.id ?? "g1"), ...over };
}
