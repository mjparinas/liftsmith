import { exercise } from "@/lib/exercises";
import type { Plan } from "@/lib/generator";
import { t } from "@/lib/i18n";
import { stepLoad } from "@/lib/loads";
import { TIMED } from "@/lib/progression";
import { dayKey } from "@/lib/random";
import { CALL_TEXT, type Readiness } from "@/lib/readiness";
import { perSide } from "@/lib/sides";
import { afterLog, warmingUp, type Active } from "@/lib/store/workout";
import { startLabel } from "@/lib/timerRun";
import { restAlertOf, restWarnOn } from "@/lib/training";
import type { AppEvent, Gym, Profile } from "@/lib/types";
import { carryStart, type Carry, type CarryItem, type CarryRecord, type CarryStep } from "@/lib/watchWorkout";
import { callWhy } from "@/lib/why";

import { clock, loadText } from "../format";
import { sessionFields } from "./sessionAhead";
import { ladder } from "./watchAdjust";

// Phone-free workouts on the watch (docs/decisions/watch-apps.md "Phone-free workouts"). The phone works out today's
// plan ahead of time, set by set, with the same code as Log set (afterLog), and the watch carries it: every step's
// label, weight and reps, the rest after it, and the words the watch shows, already in the app's language. The watch
// never does training maths. When the lifter runs it on the watch with the phone at home, the watch keeps the sets
// with their times and hands them back later, and the phone replays them through the same code (watchWorkout.ts).

/** The most steps a carried plan holds: more than any planned workout has, warm-ups included. */
export const CARRY_STEPS = 80;
/** Weights each side of an exercise's working weight on its ladder: fewer than during a phone workout, to stay small. */
export const CARRY_LADDER = 6;

/** The exercises a watch can run: lifting, holds and bodyweight moves. Cardio (time and distance) and parts stay on the phone. */
export function carryItems(plan: Plan): Plan["items"] {
  return plan.items.filter((i) => !i.part && !exercise(i.exerciseId).cardio);
}

/** A short, steady id for a carried plan: the same plan on the same day keeps its id, so it isn't sent twice. */
export function carryId(day: string, body: string): string {
  let h = 2166136261;
  for (let k = 0; k < body.length; k++) h = Math.imul(h ^ body.charCodeAt(k), 16777619);
  return `c${day.replaceAll("-", "")}${(h >>> 0).toString(36)}`;
}

/** A timed step's timer (watch-apps.md "Phone-free workouts"): its sides and the Start timer button's words. */
function timedStep(secs: number, sides: 1 | 2): Pick<CarryStep, "m" | "tt"> {
  return { m: sides, tt: startLabel({ target: secs, sides, up: false }, clock) };
}

/** The set timer's words for a phone-free hold, as the workout screen says them. */
function timerWords(): NonNullable<Carry["tl"]> {
  return [t("timer.getSet"), t("timer.left"), t("timer.side1"), t("timer.switch"), t("timer.side2"), t("timer.over")];
}

export interface CarryInput {
  plan: Plan | null;
  profile: Profile;
  gym: Gym | undefined;
  readiness: Readiness | null;
  now: number;
}

/**
 * Today's plan as the watch carries it, and what the phone keeps to replay it, or null when there's nothing a watch can
 * run (a rest day, only cardio). Pure, so it's tested without a watch.
 */
export function buildCarry({ plan, profile, gym, readiness, now }: CarryInput): { carry: Carry; record: CarryRecord } | null {
  if (!plan || !gym) return null;
  const items = carryItems(plan);
  if (!items.length) return null;
  const run: Plan = { ...plan, items };
  const unit = profile.unit;
  const ladders = new Map<number, CarryItem>();
  const itemOf = (e: number): CarryItem => {
    const have = ladders.get(e);
    if (have) return have;
    const item = items[e]!;
    const ex = exercise(item.exerciseId);
    const rs = TIMED.has(ex.id) ? t("wcarry.seconds") : perSide(ex.id) ? t("workout.repsEachSide") : t("workout.reps");
    let kg: number[] = [];
    if (ex.load !== "bodyweight" && !TIMED.has(ex.id)) {
      const l = ladder(item.target.weight, (k, dir) => stepLoad(k, dir, ex, gym), CARRY_LADDER);
      // Warm-ups and a program's ramp sit on the same ladder, so every planned weight is a step of it.
      const all = new Set([...l.kg, ...(item.warmup ?? []).map((w) => w.weight), ...(item.setTargets ?? []).map((s) => s.weight)]);
      kg = [...all].map((x) => Math.round(x * 1000) / 1000).sort((a, b) => a - b);
    }
    const out: CarryItem = {
      n: ex.name,
      rt: t("workout.restTitle", { name: ex.name }),
      q: t("workout.howWas", { name: ex.name }),
      kg,
      w: kg.map((x) => loadText(ex, x, unit)),
      rs,
    };
    ladders.set(e, out);
    return out;
  };
  const steps: CarryStep[] = [];
  let cur = carryStart(run, "carry", now);
  let prev: Active | null = null;
  let evs: AppEvent[] = [];
  for (let k = 0; k < CARRY_STEPS; k++) {
    const f = sessionFields(cur, evs, unit, gym);
    if (!f) break;
    const item = items[cur.index]!;
    const ex = exercise(item.exerciseId);
    const it = itemOf(cur.index);
    const r = afterLog({ ...cur, askFeedback: null }, evs, true, now, () => `carry-${k}`);
    if (!r) break;
    const nearest = it.kg.length ? it.kg.reduce((b, x, i) => (Math.abs(x - cur.weight) < Math.abs(it.kg[b]! - cur.weight) ? i : b), 0) : 0;
    const done = r.next.index >= items.length;
    // The next set of the same exercise keeps what was dialled in on this one, as on the phone (afterLog), unless the
    // plan changes it (a warm-up, a program's ramp).
    const keeps =
      prev !== null &&
      prev.index === cur.index &&
      !warmingUp(prev) &&
      !warmingUp(cur) &&
      !prev.tag &&
      prev.weight === cur.weight &&
      prev.reps === cur.reps;
    steps.push({
      e: cur.index,
      l: f.setLabel,
      t: f.next,
      i: nearest,
      r: Math.max(1, Math.round(cur.reps)),
      s: done || !r.next.restUntil ? 0 : r.next.restTotal,
      ...(r.next.askFeedback ? { f: 1 as const } : {}),
      ...(TIMED.has(ex.id) ? timedStep(cur.reps, perSide(ex.id) ? 2 : 1) : { a: 1 as const }),
      ...(keeps ? { c: 1 as const } : {}),
    });
    evs = [...evs, ...r.evs];
    prev = cur;
    cur = r.next;
    if (done) break;
  }
  if (!steps.length) return null;
  const day = dayKey(now);
  const minutes = plan.estMinutes || plan.minutes;
  const call = plan.program?.fixed ? plan.program.dayName : CALL_TEXT[plan.call].label;
  const why = plan.program?.fixed
    ? plan.program.note
    : plan.challenge
      ? t("td.challenge")
      : readiness
        ? callWhy(readiness, plan.call, plan.week.deload)
        : "";
  const alert = restAlertOf(profile);
  const ex = items.map((_, e) => itemOf(e));
  const body = JSON.stringify({ ex, st: steps, plan: run.items.map((i) => i.exerciseId) });
  const id = carryId(day, body);
  const carry: Carry = {
    v: 1,
    id,
    day,
    title: t("wdg.title", { call, minutes }),
    why,
    vib: alert.vibrate,
    warn: restWarnOn(profile),
    o: [t("workout.tooEasy"), t("workout.aboutRight"), t("workout.tooHard")],
    done: t("workout.notify.allDone"),
    fin: t("wcarry.finishToSave"),
    ...(steps.some((x) => x.m) ? { tl: timerWords() } : {}),
    ex,
    st: steps,
  };
  const record: CarryRecord = {
    id,
    day,
    at: now,
    plan: run,
    ...(readiness ? { readiness: readiness.score } : {}),
  };
  return { carry, record };
}
