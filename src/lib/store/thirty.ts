import { derive } from "../derive";
import { deleteEvents } from "../localdb";
import { activeThirty, calendarDay, THIRTY_BY_ID, THIRTY_MAX_ACTIVE, thirtyRuns, thirtyToday, type ThirtyLevel } from "../thirtyDay";
import { uid, type Ctx } from "./shared";

// 30-day challenges (thirtyDay.ts, docs/decisions/thirty-day-challenges.md): joining one, logging a day, undoing
// today's day and leaving. Everything else is derived from these events. One slice of the app's state.

export interface ThirtySlice {
  /**
   * Joins a challenge at a level, or changes the level of the one already running. False when the challenge isn't
   * known, or three are already running.
   */
  joinThirty(challenge: string, level: ThirtyLevel): boolean;
  /** Logs today's day of a running challenge with what was done. Returns the day logged, or null when none is due. */
  logThirtyDay(joinId: string, amount: number, now?: number): number | null;
  /** Takes back the day logged today (Undo). */
  undoThirtyDay(joinId: string, now?: number): boolean;
  /** Leaves a running challenge; the days done stay. */
  leaveThirty(joinId: string): void;
}

export function thirtySlice(c: Ctx): ThirtySlice {
  const { set, get, commit } = c;
  const run = (joinId: string) => thirtyRuns(get().events).find((r) => r.id === joinId);
  return {
    joinThirty(challenge, level) {
      if (!THIRTY_BY_ID.has(challenge)) return false;
      const active = activeThirty(get().events);
      const running = active.find((r) => r.challenge.id === challenge);
      if (running?.level === level) return true;
      if (!running && active.length >= THIRTY_MAX_ACTIVE) return false;
      commit([{ type: "thirtyJoin", id: uid(), at: Date.now(), challenge, level }]);
      return true;
    },

    logThirtyDay(joinId, amount, now = Date.now()) {
      const r = run(joinId);
      if (!r) return null;
      const today = thirtyToday(r, now);
      if (today.state !== "due" || !(amount > 0)) return null;
      commit([{ type: "thirtyDay", id: uid(), at: now, joinId, day: today.day, amount: Math.round(amount) }]);
      return today.day;
    },

    undoThirtyDay(joinId, now = Date.now()) {
      const r = run(joinId);
      if (!r) return false;
      const today = thirtyToday(r, now);
      const last = r.done[r.done.length - 1];
      // Today's day only, the last day included (taking it back reopens the challenge).
      const lastToday = !!last && calendarDay(last.at) === calendarDay(now);
      const id = today.state === "doneToday" || (today.state === "finished" && lastToday) ? last?.id : undefined;
      if (!id) return false;
      const events = get().events.filter((e) => e.id !== id);
      set({ events, stats: derive(events, now) });
      void deleteEvents([id]);
      return true;
    },

    leaveThirty(joinId) {
      const r = run(joinId);
      if (!r || r.leftAt || r.finishedAt) return;
      commit([{ type: "thirtyLeave", id: uid(), at: Date.now(), joinId }]);
    },
  };
}
