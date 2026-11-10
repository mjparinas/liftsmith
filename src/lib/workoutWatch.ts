import { stopSession } from "./sessionNotify";
import { AUTO_END_MS, type Active } from "./store/workout";
import { onVisibility } from "./visibility";

interface WorkoutStore {
  getState(): { active: Active | null; autoEnd(now?: number): boolean };
  subscribe(cb: (s: { active: Active | null }, prev: { active: Active | null }) => void): () => void;
}

/**
 * Watches the workout in progress for the whole app (docs/decisions/battery.md):
 * - a workout left running ends itself AUTO_END_MS after the last activity, from one timer set for that
 *   moment (moved whenever the lifter does something) and a check on each return to the app, never a
 *   once-a-minute poll;
 * - however a workout ends (Finish, Discard, that automatic end, a sync from another device), the live
 *   notification stops, so nothing keeps running once it's over.
 * `onAutoEnd` runs after an automatic end (the app leaves the workout screen). Returns a stop function.
 */
export function watchWorkout(store: WorkoutStore, onAutoEnd: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    if (store.getState().autoEnd()) onAutoEnd();
  };
  const arm = (a: Active | null) => {
    clearTimeout(timer);
    timer = undefined;
    // A little past the deadline, so autoEnd's own `>=` test is sure to pass when it fires.
    if (a) timer = setTimeout(check, Math.max(0, a.lastAt + AUTO_END_MS - Date.now()) + 1_000);
  };
  const unsub = store.subscribe((s, prev) => {
    if (s.active === prev.active) return;
    // The heart rate monitor is let go by hrLink's own watcher on the same change (Workout.tsx).
    if (!s.active && prev.active) void stopSession();
    if (s.active?.lastAt !== prev.active?.lastAt || !s.active !== !prev.active) arm(s.active);
  });
  const off = onVisibility((visible) => visible && check());
  check();
  arm(store.getState().active);
  return () => {
    unsub();
    off();
    clearTimeout(timer);
  };
}
