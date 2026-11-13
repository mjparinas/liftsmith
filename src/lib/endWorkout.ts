import { queueStrava, stravaWorkout } from "./connections";
import { saveWorkout } from "./health";
import { cardioActivity } from "./partExtras";
import { stopSession } from "./sessionNotify";
import { useApp } from "./store";

/**
 * Ends the workout in progress and saves it everywhere it goes: Health Connect or Apple Health (with its parts as
 * segments or workout activities) and Strava. Used by Finish on the workout screen and by the cool-down part's
 * last screen (workouts with parts). `skip`: the part on now was skipped. Returns false when nothing was running.
 */
export function endWorkout(opts: { skip?: boolean } = {}): boolean {
  const s = useApp.getState();
  const active = s.active;
  if (!active) return false;
  const ev = s.finish({ skip: opts.skip });
  if (ev?.type === "sessionEnd") {
    const { events, profile } = useApp.getState();
    // The same title and sets Strava gets, as the workout's title and notes in Health Connect or Apple Health.
    const summary = stravaWorkout(events, ev.sessionId, profile.unit);
    void saveWorkout({
      id: ev.sessionId,
      start: active.startedAt,
      end: ev.at,
      bodyweightKg: profile.bodyweight,
      avgHr: ev.avgHr,
      title: summary?.name,
      notes: summary?.description,
      segments: ev.parts?.map((p) => ({
        kind: p.kind,
        start: p.start,
        end: p.end,
        // A cardio part says what it was (a bike, a rower...), so Health files it as that.
        ...(p.kind === "cardio" ? { activity: cardioActivity(p.ref) } : {}),
      })),
    });
    queueStrava(ev.sessionId);
  }
  void stopSession();
  return true;
}
