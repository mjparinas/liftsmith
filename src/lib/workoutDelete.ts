// What deleting a finished workout does outside the event log (Melvin, 2026-11-19: "can I delete them and have my
// stats recalculate?"). The stats need nothing here: every number is derived from the events again (derive.ts), and
// the deletes sync as tombstones. Two copies live elsewhere and go too, once the Undo has had its chance:
// - the workout saved to Health Connect or Apple Health (our HealthWorkout plugin finds it by the session id), and
// - the lifter's Friends post of it (the server's `unpost`, by the workout id). A post that can't be taken down
//   now (offline, a gym with no reception) is kept in a short list and tried again after the next good sync.
// Decision record: docs/decisions/workout-history.md "Deleting a workout".

/** How long Undo stays on screen after a workout is deleted, and how long the copies elsewhere wait. */
export const UNDO_MS = 8000;

const KEY = "liftsmith.unpost";
/** The workout's time, so this app's own calories and heart rate records inside it go too. */
export type Span = { start: number; end: number };
const pending = new Map<string, { timer: ReturnType<typeof setTimeout>; span?: Span }>();

const readList = (): string[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-50) : [];
  } catch {
    return [];
  }
};
const writeList = (ids: string[]) => {
  try {
    if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: the post stays up; the lifter can still delete it from Friends.
  }
};

async function unpost(sessionId: string): Promise<boolean> {
  try {
    const { readAccount } = await import("./auth");
    if (!readAccount()) return true;
    const { social } = await import("./social");
    await social("unpost", { workoutId: sessionId });
    return true;
  } catch {
    return false;
  }
}

async function cleanUp(sessionId: string, span?: Span): Promise<void> {
  pending.delete(sessionId);
  try {
    const { removeWorkout } = await import("./health");
    await removeWorkout(sessionId, span);
  } catch {
    // Health isn't there (the web, an older app build): nothing to remove.
  }
  if (!(await unpost(sessionId))) writeList([...new Set([...readList(), sessionId])]);
}

/** After a delete: the Health copy and the Friends post go once Undo is over (or at once when the app is put away). */
export function afterDelete(sessionId: string, span?: Span, ms = UNDO_MS): void {
  cancelDelete(sessionId);
  pending.set(sessionId, { timer: setTimeout(() => void cleanUp(sessionId, span), ms), span });
  if (typeof document !== "undefined" && pending.size === 1) document.addEventListener("visibilitychange", flushOnHide);
}

/** Undo: the workout is back, so its Health copy and post stay. */
export function cancelDelete(sessionId: string): void {
  const p = pending.get(sessionId);
  if (p) clearTimeout(p.timer);
  pending.delete(sessionId);
}

/** Runs what's waiting now (the app went to the background, so a timer may never fire). */
export function flushDeletes(): Promise<void[]> {
  const all = [...pending.entries()];
  for (const [id] of all) cancelDelete(id);
  return Promise.all(all.map(([id, p]) => cleanUp(id, p.span)));
}

function flushOnHide() {
  if (document.visibilityState !== "hidden") return;
  document.removeEventListener("visibilitychange", flushOnHide);
  void flushDeletes();
}

/** Posts of deleted workouts that couldn't be taken down yet; tried again after each good sync. */
export async function retryUnposts(): Promise<void> {
  const ids = readList();
  if (!ids.length) return;
  const left: string[] = [];
  for (const id of ids) if (!(await unpost(id))) left.push(id);
  writeList(left);
}
