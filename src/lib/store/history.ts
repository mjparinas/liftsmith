import { track } from "../analytics";
import { derive } from "../derive";
import { editSet, removeSet, setSessionNote, workoutEventIds, type EventChange } from "../editHistory";
import { repeatPlan } from "../ghost";
import { appendEvents, deleteEvents } from "../localdb";
import { uid, type Ctx } from "./shared";

// Finished workouts: fixing a set, taking one out, deleting a whole workout, naming it and writing a note
// on it, and doing it again (Melvin, 2026-11-11: table stakes). The rules are in editHistory.ts.
// One slice of the app's state (store.ts puts them together).

export interface HistorySlice {
  /** A new weight (kg) and reps for a set of a finished workout. */
  editPastSet(setId: string, change: { weight: number; reps: number }): void;
  /** Takes a set out of a finished workout (its last set takes the whole workout). */
  removePastSet(setId: string): void;
  /** Deletes a finished workout and everything logged with it. */
  deleteWorkout(sessionId: string): void;
  /** The workout's own name and note (both empty clears them). */
  noteWorkout(sessionId: string, input: { name: string; text: string }): void;
  /** Today's plan becomes this past workout's exercises and set counts. False when nothing in it can be done here. */
  repeatWorkout(sessionId: string): boolean;
}

export function historySlice(c: Ctx): HistorySlice {
  const { set, get, gym } = c;
  // Deletes and adds in one step, so the stats are derived once.
  const apply = (ch: EventChange) => {
    if (!ch.add.length && !ch.remove.length) return false;
    const gone = new Set(ch.remove);
    const events = [...get().events.filter((e) => !gone.has(e.id)), ...ch.add].sort((a, b) => a.at - b.at);
    set({ events, stats: derive(events, Date.now()) });
    if (ch.remove.length) void deleteEvents(ch.remove);
    if (ch.add.length) void appendEvents(ch.add);
    return true;
  };
  // A finished workout only: the one running now changes through the workout screen.
  const finished = (sessionId: string) => get().active?.sessionId !== sessionId;
  const sessionOf = (setId: string) => {
    const e = get().events.find((x) => x.id === setId);
    return e?.type === "set" ? e.sessionId : undefined;
  };
  return {
    editPastSet(setId, change) {
      const s = sessionOf(setId);
      if (!s || !finished(s)) return;
      if (apply(editSet(get().events, setId, change, uid))) {
        track("feature", { name: "edit_set" });
        get().replan();
      }
    },

    removePastSet(setId) {
      const s = sessionOf(setId);
      if (!s || !finished(s)) return;
      if (apply(removeSet(get().events, setId))) {
        track("feature", { name: "remove_set" });
        get().replan();
      }
    },

    deleteWorkout(sessionId) {
      if (!finished(sessionId)) return;
      if (apply({ add: [], remove: workoutEventIds(get().events, sessionId) })) {
        track("feature", { name: "delete_workout" });
        get().replan();
      }
    },

    noteWorkout(sessionId, input) {
      if (apply(setSessionNote(get().events, sessionId, input, Date.now(), uid))) track("feature", { name: "note_workout" });
    },

    repeatWorkout(sessionId) {
      const base = get().preview;
      const g = gym();
      if (!base || !g || get().active) return false;
      const plan = repeatPlan(base, get().events, get().profile, g, Date.now(), sessionId);
      if (!plan) return false;
      get().setPlan(plan);
      track("feature", { name: "repeat_workout" });
      return true;
    },
  };
}
