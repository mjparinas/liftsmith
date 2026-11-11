import type { AppEvent, SessionNoteEvent, SetEvent } from "./types";

// Fixing a finished workout (Melvin, 2026-11-11: table stakes, "edit or delete a finished workout").
// Events are never changed in place: an edit deletes the old event and writes a new one with a new id,
// so sync stays order-independent (a delete is a tombstone on the server, a new id is a plain insert) and
// every stat, PR and streak is derived again from what's left. Everything here is pure.

export interface EventChange {
  add: AppEvent[];
  remove: string[];
}

const NONE: EventChange = { add: [], remove: [] };

/** Longest workout name and note kept. */
export const NAME_MAX = 60;
export const NOTE_MAX = 1000;

/** The events that belong to one workout: everything carrying its session id, plus the ratings of its sets. */
export function workoutEventIds(events: readonly AppEvent[], sessionId: string): string[] {
  const own = events.filter((e) => "sessionId" in e && e.sessionId === sessionId);
  const setIds = new Set(own.filter((e) => e.type === "set").map((e) => e.id));
  const ratings = events.filter((e) => e.type === "effort" && setIds.has(e.setId));
  return [...own, ...ratings].map((e) => e.id);
}

/**
 * A new weight and reps for one logged set. The set comes back under a new id at the same moment (so it
 * stays in its place in the workout), and its reps-left rating moves with it. Per-side reps are dropped,
 * because the new reps are for both sides. Nothing changes when the numbers are the same.
 */
export function editSet(
  events: readonly AppEvent[],
  setId: string,
  change: { weight: number; reps: number },
  newId: () => string,
): EventChange {
  const old = events.find((e): e is SetEvent => e.type === "set" && e.id === setId);
  if (!old) return NONE;
  const weight = Math.max(0, Math.round(change.weight * 1000) / 1000);
  const reps = Math.max(1, Math.round(change.reps));
  if (weight === old.weight && reps === old.reps) return NONE;
  const fresh: SetEvent = { ...old, id: newId(), weight, reps };
  delete fresh.repsL;
  delete fresh.repsR;
  const ratings = events.filter((e) => e.type === "effort" && e.setId === setId);
  return {
    add: [fresh, ...ratings.map((r) => ({ ...r, id: newId(), setId: fresh.id }))],
    remove: [old.id, ...ratings.map((r) => r.id)],
  };
}

/** Takes one set out of a finished workout. Taking out its last set takes out the whole workout. */
export function removeSet(events: readonly AppEvent[], setId: string): EventChange {
  const old = events.find((e): e is SetEvent => e.type === "set" && e.id === setId);
  if (!old) return NONE;
  const left = events.filter((e) => e.type === "set" && e.sessionId === old.sessionId && e.id !== setId);
  if (!left.length) return { add: [], remove: workoutEventIds(events, old.sessionId) };
  const ratings = events.filter((e) => e.type === "effort" && e.setId === setId).map((e) => e.id);
  return { add: [], remove: [setId, ...ratings] };
}

/** The workout's own name and note, the latest one written (null when there's none). */
export function sessionNoteOf(events: readonly AppEvent[], sessionId: string): SessionNoteEvent | null {
  let best: SessionNoteEvent | null = null;
  for (const e of events) {
    if (e.type !== "sessionNote" || e.sessionId !== sessionId) continue;
    if (!best || e.at > best.at || (e.at === best.at && e.id > best.id)) best = e;
  }
  return best;
}

/**
 * Saves a workout's name and note: the old ones go and one new event holds both. Both empty clears them.
 * Nothing changes when they're the same as what's saved.
 */
export function setSessionNote(
  events: readonly AppEvent[],
  sessionId: string,
  input: { name: string; text: string },
  now: number,
  newId: () => string,
): EventChange {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  const text = input.text.trim().slice(0, NOTE_MAX);
  const cur = sessionNoteOf(events, sessionId);
  if ((cur?.name ?? "") === name && (cur?.text ?? "") === text) return NONE;
  const remove = events.filter((e) => e.type === "sessionNote" && e.sessionId === sessionId).map((e) => e.id);
  if (!name && !text) return { add: [], remove };
  const note: SessionNoteEvent = {
    type: "sessionNote",
    id: newId(),
    at: Math.max(now, (cur?.at ?? 0) + 1),
    sessionId,
    ...(name ? { name } : {}),
    ...(text ? { text } : {}),
  };
  return { add: [note], remove };
}
