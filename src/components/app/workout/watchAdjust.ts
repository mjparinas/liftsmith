import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { stepLoad } from "@/lib/loads";
import { TIMED } from "@/lib/progression";
import type { SessionPayload, WatchAdj, WatchAsk } from "@/lib/sessionNotify";
import { perSide } from "@/lib/sides";
import { useApp } from "@/lib/store";
import type { Active } from "@/lib/store/workout";
import type { AppEvent, Gym, Rating, Unit } from "@/lib/types";

import { loadText } from "../format";

// Adjust and rate a set on the watch (docs/decisions/watch-apps.md "Adjust and rate a set"). The phone sends the
// watch a short ladder of weights around the set's own (worked out with the same steps as the workout screen's − / +,
// so a dumbbell rack, a machine stack and the plates you own all step the way they do on the phone) and the reps.
// The watch moves along it with its crown, bezel or − / + and sends back the weight and reps it settled on, with
// Log set or on its own a moment after the last turn. After an exercise's last set it asks how it felt, with the same
// three answers as the rest card, and the answer feeds the next weight like a tap on the phone.

/** Weights each side of the set's own on the ladder: enough to cover a bad day or a good one without the phone. */
export const LADDER_STEPS = 8;
/** The most reps (or seconds) the watch may send, and the fewest. */
export const REPS_MAX = 100;

/**
 * Which set the watch is looking at: the workout, how many sets it has logged so far (drop sets included), and where
 * the workout is (the exercise, the warm-ups done, a bonus set), since a warm-up moves on without a set of its own.
 * Each Log set changes it, so a step the notification shows with the app closed gets the same key the app works out
 * when it replays the taps.
 */
export function setKey(a: Active, events: readonly AppEvent[]): string {
  const sets = events.filter((e) => e.type === "set" && e.sessionId === a.sessionId).length;
  return `${a.sessionId}:${sets}:${a.index}:${a.warm ?? 0}:${a.tag ?? ""}`;
}

/** Weights from `steps` (LADDER_STEPS) lighter to `steps` heavier than `kg`, each once, lightest first, and where `kg` is. */
export function ladder(kg: number, step: (kg: number, dir: 1 | -1) => number, steps = LADDER_STEPS): { kg: number[]; i: number } {
  const down: number[] = [];
  const up: number[] = [];
  let cur = kg;
  for (let k = 0; k < steps; k++) {
    const n = step(cur, -1);
    if (!(n < cur - 1e-6) || n < 0) break;
    down.unshift(n);
    cur = n;
  }
  cur = kg;
  for (let k = 0; k < steps; k++) {
    const n = step(cur, 1);
    if (!(n > cur + 1e-6)) break;
    up.push(n);
    cur = n;
  }
  return { kg: [...down, kg, ...up].map((x) => Math.round(x * 1000) / 1000), i: down.length };
}

/**
 * What the watch can change on the set in `a`, or undefined when it can't: a cardio set (time and distance), a timed
 * hold (the set timer runs it), a set whose two sides differ, or one already logged in full.
 */
export function watchAdj(a: Active, events: readonly AppEvent[], unit: Unit, gym: Gym): WatchAdj | undefined {
  const item = a.plan.items[a.index];
  if (!item || a.repsR !== undefined) return undefined;
  const ex = exercise(item.exerciseId);
  if (ex.cardio || TIMED.has(ex.id)) return undefined;
  const reps = Math.min(REPS_MAX, Math.max(1, Math.round(a.reps)));
  const repsWord = perSide(ex.id) ? t("workout.repsEachSide") : t("workout.reps");
  const base = { key: setKey(a, events), reps, rs: repsWord };
  if (ex.load === "bodyweight") return { ...base, kg: [], w: [], i: 0 };
  const l = ladder(a.weight, (kg, dir) => stepLoad(kg, dir, ex, gym));
  return { ...base, kg: l.kg, w: l.kg.map((x) => loadText(ex, x, unit)), i: l.i };
}

/** "How did Bench press feel?" with the rest card's three answers, while the phone is asking. */
export function watchAsk(a: Active): WatchAsk | undefined {
  if (!a.askFeedback) return undefined;
  return {
    ex: a.askFeedback,
    q: t("workout.howWas", { name: exercise(a.askFeedback).name }),
    o: [t("workout.tooEasy"), t("workout.aboutRight"), t("workout.tooHard")],
    v: [1, 0, -1],
  };
}

/** A weight and reps the watch sent, if they're believable for this set: its key, a weight on 0 to 1,000 kg, whole reps. */
export function watchValues(
  p: { key?: unknown; kg?: unknown; reps?: unknown } | undefined,
  key: string,
): { kg?: number; reps: number } | null {
  if (!p || p.key !== key) return null;
  const reps = typeof p.reps === "number" && Number.isInteger(p.reps) && p.reps >= 1 && p.reps <= REPS_MAX ? p.reps : null;
  if (reps === null) return null;
  if (p.kg === undefined || p.kg === null) return { reps };
  const kg = typeof p.kg === "number" && Number.isFinite(p.kg) && p.kg >= 0 && p.kg <= 1000 ? p.kg : null;
  // Garmin sends a 32-bit float, so 102.06 can arrive as 102.0599975: back to the ladder's own three places.
  return kg === null ? null : { kg: Math.round(kg * 1000) / 1000, reps };
}

/** A rating the watch sent, if it's one of the three answers for the exercise the phone is asking about. */
export function watchRating(p: { ex?: unknown; v?: unknown } | undefined, asking: string | null): Rating | null {
  if (!p || !asking || p.ex !== asking) return null;
  return p.v === 1 || p.v === 0 || p.v === -1 ? p.v : null;
}

/**
 * A watch's tap with what it carried. Log set with a weight and reps sets them on the set first (when they're for the
 * set on screen), so a set changed on the wrist is logged as changed, with the app open or replayed when it opens;
 * adjust changes them without logging; rate answers "How did it feel?". Anything else is a plain shortcut.
 * Returns true when it handled the tap, false to hand it to runShortcut (a tap with nothing carried, as before).
 */
export function runWatchTap(action: string, at: number | undefined, data: SessionPayload | undefined): boolean {
  const s = useApp.getState();
  if (action !== "rate" && action !== "adjust" && !data) return false;
  if (!s.ready || !s.profile.onboarded) return true;
  if (action === "rate") {
    const a = s.active;
    const r = watchRating(data, a?.askFeedback ?? null);
    if (a && r !== null) s.feedback(r);
    return true;
  }
  if (action !== "log" && action !== "adjust") return false;
  const a = s.active;
  if (!a) return action === "adjust";
  const v = watchValues(data, setKey(a, s.events));
  if (v) s.adjust(v.kg ?? a.weight, v.reps);
  if (action === "log") s.logSet(at);
  return true;
}
