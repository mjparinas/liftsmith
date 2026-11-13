import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { chipText, type AheadStep, type SessionState } from "@/lib/sessionNotify";
import { afterLog, warmingUp, type Active } from "@/lib/store/workout";
import type { AppEvent, Gym, Unit } from "@/lib/types";

import { plateText, setText } from "../format";

// What the live workout notification says about the set on screen, and the sets after it. The notification's Log set
// works with the app closed (WorkoutService.java, WorkoutSessionPlugin.swift): the phone can't run the training engine
// then, so the app sends the next sets ahead of time and the notification steps through them, one per tap. The taps
// are kept with their times and logged by the app when it opens (docs/decisions/workout-screen.md).

/** How many sets ahead the notification knows: more than any planned workout has, warm-ups included. */
export const AHEAD_MAX = 60;

type Fields = Pick<SessionState, "setLabel" | "next" | "plates" | "chip"> & { name: string; done: number; total: number };

/** The notification's text for the set on screen in `a`. Null once every planned set is logged. */
export function sessionFields(a: Active, events: readonly AppEvent[], unit: Unit, gym: Gym): Fields | null {
  const item = a.plan.items[a.index];
  if (!item) return null;
  const ex = exercise(item.exerciseId);
  const doneSets = events.filter(
    (e) => e.type === "set" && e.sessionId === a.sessionId && e.exerciseId === item.exerciseId && !e.tag,
  ).length;
  const warming = warmingUp(a);
  const warmTotal = item.warmup?.length ?? 0;
  const warmDone = Math.min(a.warm ?? 0, warmTotal);
  const setLabel = a.tag
    ? t(a.tag === "drop" ? "wk.dropSet" : "wk.restPause")
    : warming
      ? t("workout.warmupOf", { n: warmDone + 1, total: warmTotal })
      : t("workout.setOf", { n: Math.min(doneSets + 1, item.sets), total: item.sets });
  return {
    name: ex.name,
    setLabel,
    next: setText(ex, a.weight, a.reps, unit, a.distanceM),
    plates: plateText(ex, a.weight, gym),
    chip: warming ? chipText(true, warmDone + 1, warmTotal) : chipText(false, Math.min(doneSets + 1, item.sets), item.sets),
    done: events.filter((e) => e.type === "set" && e.sessionId === a.sessionId && !e.tag).length,
    total: a.plan.items.reduce((n, i) => n + i.sets, 0),
  };
}

/**
 * The notification after each of the next Log sets, logged as planned: the first entry is what it shows after one
 * tap, the second after two, and so on, ending with "All sets logged" after the last planned set. Worked out on a
 * copy with the same code as Log set (`afterLog`), so the app logs exactly these sets when it replays the taps.
 */
export function aheadSteps(a: Active, events: readonly AppEvent[], unit: Unit, gym: Gym, autoRest: boolean, max = AHEAD_MAX): AheadStep[] {
  const steps: AheadStep[] = [];
  let cur = a;
  // Only what the steps read: this workout's sets (the counts) and other workouts' cardio distances (the starting
  // distance, startDistance). Copying and scanning the whole history for each of up to 60 steps made every Log set
  // slow for lifters with a long history (2026-11-13).
  let evs = events.filter((e) => e.type === "set" && (e.sessionId === a.sessionId || e.distanceM !== undefined));
  const now = Date.now();
  for (let k = 0; k < max; k++) {
    const r = afterLog(cur, evs, autoRest, now, () => `ahead-${k}`);
    if (!r) break;
    evs = [...evs, ...r.evs];
    cur = r.next;
    const f = sessionFields(cur, evs, unit, gym);
    if (!f) {
      const total = cur.plan.items.reduce((n, i) => n + i.sets, 0);
      const done = evs.filter((e) => e.type === "set" && e.sessionId === cur.sessionId && !e.tag).length;
      steps.push({
        title: t("workout.notify.allDone"),
        setLabel: "",
        next: t("workout.notify.openToFinish"),
        rest: 0,
        done,
        total,
        end: true,
      });
      break;
    }
    const rest = cur.restUntil ? cur.restTotal : 0;
    const { name, ...fields } = f;
    steps.push({ ...fields, title: rest > 0 ? t("workout.restTitle", { name }) : name, rest });
  }
  return steps;
}
