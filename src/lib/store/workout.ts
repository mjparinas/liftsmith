import { track } from "../analytics";
import { startDistance } from "../cardio";
import { derive } from "../derive";
import { exercise } from "../exercises";
import { injuredTarget, planSeconds, setSeconds, type Plan, type PlanItem, type SetTarget } from "../generator";
import { activeInjuries } from "../injury";
import { roundLoad } from "../loads";
import { deleteEvents } from "../localdb";
import { target } from "../progression";
import { moveItem } from "../reorder";
import { doLater, fitToTime } from "../replan";
import { implementsFor } from "../sides";
import type { State } from "../store";
import { afterSet, linksOf, toggleLink } from "../superset";
import type { AppEvent, LoadKind, Muscle, Rating, SetTag } from "../types";
import { WARMUP_REST, warmupFor } from "../warmup";
import { persistActive, setsDone, uid, type Ctx } from "./shared";

// The workout in progress: start, log sets, rest, swaps, supersets, finish. Kept in localStorage too,
// so killing the app mid-set loses nothing.
// One slice of the app's state (store.ts puts them together).

export interface Active {
  sessionId: string;
  startedAt: number;
  plan: Plan;
  /** Index into plan.items of the exercise on screen. */
  index: number;
  /** Working values for the next set (kg, reps), editable with the steppers. */
  weight: number;
  reps: number;
  /**
   * Per-side exercises (sides.ts) when the sides differ: the right side's reps, with `reps` then the
   * left. Unset means both sides did `reps`, which keeps logging to one tap.
   */
  repsR?: number;
  /** Cardio logged with distance: metres for the next set, editable with a stepper. */
  distanceM?: number;
  restUntil: number | null;
  restTotal: number;
  /** Exercise whose feedback chip is showing. */
  askFeedback: string | null;
  /** Heart rate samples (bpm) and when each arrived (ms after startedAt), at most one a second. */
  hr: number[];
  hrAt: number[];
  /** When the current set's work started: the end of the last rest, or the start of the workout. */
  setStart: number;
  /** Seconds rested before the current set, recorded when the rest ends. */
  lastRest?: number;
  /** When the last rest began (the previous Log set). */
  restStart?: number;
  /** Last time the lifter did anything; a workout idle for AUTO_END_MS ends itself. */
  lastAt: number;
  /** Warm-up sets done for the exercise on screen (warmup.ts). Missing in workouts saved before warm-ups. */
  warm?: number;
  /** Rest auto-start is off: the rest (seconds) waiting for a tap on Start rest. */
  restReady?: number;
  /**
   * The set on screen is a bonus drop or rest-pause set (extraSet), and the weight and reps to go back to
   * afterwards when the exercise has planned sets left.
   */
  tag?: SetTag;
  tagReturn?: { weight: number; reps: number };
  /** The plan position the lifter had moved on to before a bonus set took them back (for Cancel). */
  tagFrom?: number;
}

/** The pause before a rest-pause set. */
export const REST_PAUSE_SEC = 15;

/** True while the exercise on screen still has warm-up sets to do. */
export function warmingUp(a: Pick<Active, "plan" | "index" | "warm">): boolean {
  const w = a.plan.items[a.index]?.warmup?.length ?? 0;
  return (a.warm ?? 0) < w;
}

/** A workout left running ends itself this long after the last activity (Melvin, 2026-11-09). */
export const AUTO_END_MS = 3 * 3600_000;

/** Stats for the heart rate samples between two moments. */
export function hrWindow(a: Pick<Active, "hr" | "hrAt" | "startedAt">, from: number, to: number) {
  const xs = a.hr.filter((_, i) => a.startedAt + a.hrAt[i] >= from && a.startedAt + a.hrAt[i] <= to);
  if (!xs.length) return {};
  return { hrAvg: Math.round(xs.reduce((s, x) => s + x, 0) / xs.length), hrMax: Math.max(...xs), hrEnd: xs[xs.length - 1] };
}

/** Puts the plan item at `index` on screen: its warm-ups (unless started) and its first set's weight and reps. */
export function loadItem(get: () => State, a: Active, index: number): Active {
  const item = a.plan.items[index];
  if (!item) return { ...a, index, warm: 0 };
  // Coming back to an exercise that's already started skips its warm-ups.
  const done = setsDone(get().events, a.sessionId, item.exerciseId);
  const started = done > 0;
  const warm = started ? (item.warmup?.length ?? 0) : 0;
  const first = !started && item.warmup?.[0];
  const t = item.setTargets?.[Math.min(done, item.setTargets.length - 1)] ?? item.target;
  const distanceM = startDistance(exercise(item.exerciseId), get().events);
  return { ...a, index, warm, weight: first ? first.weight : t.weight, reps: first ? first.reps : t.reps, distanceM };
}

/** How long Undo stays offered after Log set when there's no rest to wait through. */
export const UNDO_MS = 10_000;

export interface WorkoutSlice {
  active: Active | null;
  /**
   * The last Log set, for Undo: the workout as it was before it and the events it wrote. Offered until
   * the rest after it ends (or UNDO_MS with no rest), or the next set is logged. Not saved: a reload drops it.
   */
  undoable: { prev: Active; ids: string[]; until: number } | null;
  /** Takes back the last Log set: its set (or warm-up) is deleted and the set card shows its numbers again. */
  undoLast(): void;
  /** Moves exercise `from` to `to` (indexes into the plan), on Today's plan or among those still to come mid-workout. */
  moveExercise(from: number, to: number): void;
  /** A note on an exercise (empty clears it for next time). */
  addNote(exerciseId: string, text: string): void;
  /** How many reps the lifter says they had left on a logged set. */
  rateEffort(setId: string, rir: number): void;
  /** Creates the lifter's own exercise and returns its id. */
  addCustomExercise(e: { name: string; primary: Muscle; load: LoadKind; compound: boolean }): string;
  autoEnd(now?: number): boolean;
  /** Starts today's plan, or the plan given (a shared workout). */
  start(plan?: Plan): void;
  /** Fits the rest of the workout into this many minutes; returns what changed. */
  shortOnTime(minutes: number): string[];
  /** Moves the current exercise after the next one (equipment busy). */
  later(): void;
  logSet(): void;
  /**
   * Between sets: a bonus drop set (about 75% of the set just logged, no rest) or rest-pause set (same
   * weight after a 15 s pause) of the exercise just done. Undefined cancels one that's on screen.
   */
  extraSet(kind: SetTag | undefined): void;
  adjust(weight: number, reps: number): void;
  /** Right side's reps on a per-side exercise; undefined goes back to "both sides the same". */
  adjustRight(reps: number | undefined): void;
  /** Sets the next cardio set's distance (metres). */
  adjustDistance(m: number): void;
  addRest(sec: number): void;
  skipRest(): void;
  /** Starts the rest timer by hand (when auto-start is off in Workout preferences). */
  startRest(): void;
  /** Skip the rest of the warm-ups and go to the working weight. */
  skipWarmup(): void;
  feedback(r: Rating): void;
  swap(toId: string, avoid: boolean): void;
  goTo(index: number): void;
  /** Link exercise `index` with the next one as a superset, or split them. Works on Today's plan and mid-workout. */
  toggleSuperset(index: number): void;
  finish(opts?: { at?: number; auto?: boolean }): AppEvent | null;
  discard(): void;
  pushHr(bpm: number): void;
}

export function workoutSlice(c: Ctx): WorkoutSlice {
  const { set, get, commit, gym } = c;
  return {
    active: null,
    undoable: null,

    undoLast() {
      const u = get().undoable;
      const a = get().active;
      if (!u || !a || a.sessionId !== u.prev.sessionId || Date.now() > u.until) {
        set({ undoable: null });
        return;
      }
      // The set's own reps-left rating goes with it.
      const ids = [
        ...u.ids,
        ...get()
          .events.filter((e) => e.type === "effort" && u.ids.includes(e.setId))
          .map((e) => e.id),
      ];
      const events = get().events.filter((e) => !ids.includes(e.id));
      const now = Date.now();
      const next: Active = { ...u.prev, lastAt: now, restUntil: null, restReady: undefined };
      set({ events, stats: derive(events, now), active: next, undoable: null });
      void deleteEvents(ids);
      persistActive(next);
      track("feature", { name: "undo_set" });
    },

    moveExercise(from, to) {
      const a = get().active;
      if (a) {
        // Only what's still to come: the exercise on screen and the ones done stay where they are.
        if (from <= a.index || to <= a.index) return;
        const next = { ...a, plan: { ...a.plan, items: moveItem(a.plan.items, from, to) }, lastAt: Date.now() };
        set({ active: next });
        persistActive(next);
        track("feature", { name: "reorder", detail: "workout" });
        return;
      }
      const p = get().preview;
      if (!p) return;
      const items = moveItem(p.items, from, to);
      // The order and every pair's link are kept, so a rebuild of the same plan comes back as it was left.
      const links = linksOf(items).map((on, i) => `${on ? "" : "!"}${items[i].exerciseId}>${items[i + 1].exerciseId}`);
      set({ order: items.map((i) => i.exerciseId), links, preview: { ...p, items, estMinutes: Math.round(planSeconds(items) / 60) } });
      track("feature", { name: "reorder", detail: "today" });
    },

    addNote(exerciseId, text) {
      const a = get().active;
      commit([{ type: "note", id: uid(), at: Date.now(), sessionId: a?.sessionId ?? "", exerciseId, text: text.trim().slice(0, 500) }]);
    },

    rateEffort(setId, rir) {
      if (get().events.some((e) => e.type === "effort" && e.setId === setId)) return;
      commit([{ type: "effort", id: uid(), at: Date.now(), setId, rir: Math.max(0, Math.min(4, Math.round(rir))) }]);
    },

    addCustomExercise({ name, primary, load, compound }) {
      const id = `custom-${uid().slice(0, 12)}`;
      commit([
        {
          type: "customExercise",
          id: uid(),
          at: Date.now(),
          exercise: { id, name: name.trim().slice(0, 60) || "My exercise", primary: [primary], secondary: [], load, compound },
        },
      ]);
      return id;
    },

    autoEnd(now = Date.now()) {
      const a = get().active;
      if (!a || now - a.lastAt < AUTO_END_MS) return false;
      // End it where the lifter stopped, not hours later, so duration and stats stay true.
      get().finish({ at: Math.min(now, a.lastAt + 60_000), auto: true });
      return true;
    },

    shortOnTime(minutes) {
      const a = get().active;
      if (!a) return [];
      const item = a.plan.items[a.index];
      const done = item ? setsDone(get().events, a.sessionId, item.exerciseId) : 0;
      const fit = fitToTime(a.plan.items, a.index, done, minutes);
      const next = { ...a, plan: { ...a.plan, items: fit.items }, lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
      track("feature", { name: "replan", detail: "time" });
      return fit.changes;
    },

    later() {
      const a = get().active;
      if (!a) return;
      const item = a.plan.items[a.index];
      // Only before its first set: once started, finishing it is quicker than coming back.
      if (!item || setsDone(get().events, a.sessionId, item.exerciseId) > 0) return;
      const next = loadItem(get, { ...a, plan: { ...a.plan, items: doLater(a.plan.items, a.index) }, lastAt: Date.now() }, a.index);
      set({ active: next });
      persistActive(next);
      track("feature", { name: "replan", detail: "later" });
    },

    start(given) {
      const plan = given ?? get().preview;
      const g = gym();
      if (!plan || !g || !plan.items.length) return;
      const sessionId = uid();
      const now = Date.now();
      const r = get().readiness;
      const overridden = get().callOverride !== null && get().callOverride !== r?.call;
      const a = loadItem(
        get,
        {
          sessionId,
          startedAt: now,
          plan,
          index: 0,
          weight: 0,
          reps: 0,
          restUntil: null,
          restTotal: 0,
          askFeedback: null,
          hr: [],
          hrAt: [],
          setStart: now,
          lastAt: now,
        },
        0,
      );
      commit([
        {
          type: "sessionStart",
          id: uid(),
          at: now,
          sessionId,
          gymId: g.id,
          minutes: plan.minutes,
          call: plan.call,
          readiness: r?.score,
          callOverridden: get().callOverride !== null && get().callOverride !== r?.call,
          challenge: plan.challenge,
          program: plan.program ? { id: plan.program.id, day: plan.program.day } : undefined,
          routine: plan.routineId,
        },
      ]);
      set({ callOverride: null, links: [], order: [], routineId: null, undoable: null });
      set({ active: a });
      persistActive(a);
      track("workout_start", {
        minutes: plan.minutes,
        exercises: plan.items.length,
        call: plan.call ?? "normal",
        overridden,
        gymKind: g.equipment.length ? "equipped" : "bodyweight",
      });
    },

    logSet() {
      const a = get().active;
      if (!a) return;
      const item = a.plan.items[a.index];
      if (!item) return;
      const now = Date.now();
      const ex = exercise(item.exerciseId);
      const autoRest = get().profile.training?.autoRest !== false;
      if (warmingUp(a)) {
        // A warm-up set: its own event, a short rest, then the next warm-up or the working weight.
        const wid = uid();
        commit([{ type: "warmup", id: wid, at: now, sessionId: a.sessionId, exerciseId: item.exerciseId, weight: a.weight, reps: a.reps }]);
        const warm = (a.warm ?? 0) + 1;
        const nextWarm = item.warmup![warm];
        const next: Active = {
          ...a,
          warm,
          weight: nextWarm ? nextWarm.weight : item.target.weight,
          reps: nextWarm ? nextWarm.reps : item.target.reps,
          lastAt: now,
          restStart: now,
          lastRest: undefined,
          setStart: now,
          restTotal: WARMUP_REST,
          restUntil: autoRest ? now + WARMUP_REST * 1000 : null,
          restReady: autoRest ? undefined : WARMUP_REST,
        };
        set({ active: next, undoable: { prev: a, ids: [wid], until: Math.max(now + UNDO_MS, next.restUntil ?? 0) } });
        persistActive(next);
        return;
      }
      const already = setsDone(get().events, a.sessionId, item.exerciseId);
      const planned: SetTarget = item.setTargets?.[Math.min(already, item.setTargets.length - 1)] ?? item.target;
      // A set takes seconds to a couple of minutes; a longer gap means the lifter rested past the
      // timer, so the duration is left out rather than guessed.
      const duration = (now - a.setStart) / 1000;
      // Logged before the rest timer ran out: the set started at some unknown point during the rest.
      const earlyLog = !!a.restUntil && a.restUntil > now;
      const plausible = !earlyLog && duration >= 3 && duration <= Math.max(180, 3 * setSeconds(ex, a.reps));
      const sid = uid();
      commit([
        {
          type: "set",
          id: sid,
          at: now,
          sessionId: a.sessionId,
          exerciseId: item.exerciseId,
          weight: a.weight,
          reps: a.repsR !== undefined ? Math.min(a.reps, a.repsR) : a.reps,
          ...(a.repsR !== undefined && a.repsR !== a.reps ? { repsL: a.reps, repsR: a.repsR } : {}),
          implements: ex.load === "dumbbell" || ex.load === "kettlebell" ? implementsFor(ex) : undefined,
          targetReps: planned.reps,
          ...(ex.cardio === "distance" && a.distanceM !== undefined ? { distanceM: a.distanceM } : {}),
          rir: planned.amrap ? 0 : item.target.rir,
          targetWeight: planned.weight,
          amrap: planned.amrap,
          comeback: planned.comeback,
          slot: item.slot,
          startedAt: a.setStart,
          durationSec: plausible ? Math.round(duration) : undefined,
          restSec: earlyLog && a.restStart ? Math.round((now - a.restStart) / 1000) : a.lastRest,
          ...hrWindow(a, a.setStart, now),
          challenge: item.challenge && already + 1 === item.sets ? true : undefined,
          injuryPct: item.injuryPct,
          superset: item.group,
          tag: a.tag,
        },
      ]);
      // Alone, the next set is the same exercise until its sets are done. In a superset it's the
      // next exercise of the round (superset.ts).
      const items = a.plan.items;
      // A bonus set doesn't move the plan on: the planned set count stays where it was.
      const step = afterSet(items, a.index, (i) =>
        i === a.index ? already + (a.tag ? 0 : 1) : setsDone(get().events, a.sessionId, items[i].exerciseId),
      );
      let next: Active = {
        ...a,
        repsR: undefined,
        lastAt: now,
        restStart: now,
        lastRest: undefined,
        setStart: now,
        restReady: undefined,
        tag: undefined,
        tagReturn: undefined,
        tagFrom: undefined,
      };
      if (a.tag && a.tagReturn) next = { ...next, ...a.tagReturn };
      // Programs with a different target for each set (ramps, percentages) load the next one; straight
      // sets keep whatever the lifter dialled in.
      const nextT = item.setTargets?.[already + 1];
      const prevT = item.setTargets?.[already];
      if (!a.tag && step.index === a.index && nextT && prevT && (nextT.weight !== prevT.weight || nextT.reps !== prevT.reps))
        next = { ...next, weight: nextT.weight, reps: nextT.reps };
      if (step.finished && !a.tag) next.askFeedback = item.exerciseId; // Exercise finished: ask how it felt.
      if (step.index !== a.index) next = loadItem(get, next, Math.min(step.index, items.length));
      const last = next.index >= items.length;
      next.restTotal = last ? 0 : step.rest;
      next.restUntil = last || !autoRest ? null : now + step.rest * 1000;
      // Auto-start off: the rest waits for Start rest. The set's clock still runs from Log set.
      if (!last && !autoRest && step.rest > 0) next.restReady = step.rest;
      set({ active: next, undoable: { prev: a, ids: [sid], until: Math.max(now + UNDO_MS, next.restUntil ?? 0) } });
      persistActive(next);
    },

    extraSet(kind) {
      const a = get().active;
      if (!a) return;
      const now = Date.now();
      if (!kind) {
        if (!a.tag) return;
        const next: Active = { ...a, ...(a.tagReturn ?? {}), tag: undefined, tagReturn: undefined, lastAt: now };
        // Back to where the plan was: the exercise after the one the bonus set was for, if that one's done.
        const back = a.tagFrom !== undefined ? loadItem(get, { ...next, index: a.tagFrom }, a.tagFrom) : next;
        set({ active: { ...back, tagFrom: undefined } });
        persistActive({ ...back, tagFrom: undefined });
        return;
      }
      const last = [...get().events].reverse().find((e) => e.type === "set" && e.sessionId === a.sessionId);
      if (last?.type !== "set") return;
      const index = a.plan.items.findIndex((i) => i.exerciseId === last.exerciseId);
      if (index < 0) return;
      const ex = exercise(last.exerciseId);
      const g = gym();
      const lighter = last.weight * 0.75;
      const weight = kind === "drop" && ex.load !== "bodyweight" ? (g ? roundLoad(lighter, ex, g).kg : Math.round(lighter)) : last.weight;
      const reps = kind === "drop" ? Math.max(1, last.targetReps) : Math.max(2, Math.round(last.reps / 3));
      const pause = kind === "restPause" ? REST_PAUSE_SEC : 0;
      const next: Active = {
        ...a,
        index,
        warm: a.plan.items[index]?.warmup?.length ?? 0,
        weight,
        reps,
        repsR: undefined,
        tag: kind,
        // Coming back to the same exercise keeps what was dialled in for its next planned set.
        tagReturn:
          index === a.index
            ? { weight: a.tag ? (a.tagReturn?.weight ?? a.weight) : a.weight, reps: a.tag ? (a.tagReturn?.reps ?? a.reps) : a.reps }
            : undefined,
        tagFrom: index === a.index ? undefined : (a.tagFrom ?? a.index),
        askFeedback: null,
        restTotal: pause,
        restUntil: pause ? now + pause * 1000 : null,
        restStart: now,
        restReady: undefined,
        setStart: pause ? now + pause * 1000 : now,
        lastAt: now,
      };
      set({ active: next });
      persistActive(next);
      track("feature", { name: "set_tag", detail: kind });
    },

    adjust(weight, reps) {
      const a = get().active;
      if (!a) return;
      const next = { ...a, weight: Math.max(0, weight), reps: Math.max(1, reps), lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
    },

    adjustDistance(m) {
      const a = get().active;
      if (!a) return;
      const next = { ...a, distanceM: Math.max(0, Math.round(m)), lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
    },

    adjustRight(reps) {
      const a = get().active;
      if (!a) return;
      const next = { ...a, repsR: reps === undefined ? undefined : Math.max(0, reps), lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
    },

    addRest(sec) {
      const a = get().active;
      if (!a?.restUntil) return;
      const next = { ...a, restUntil: a.restUntil + sec * 1000, restTotal: a.restTotal + sec };
      set({ active: next });
      persistActive(next);
    },

    skipWarmup() {
      const a = get().active;
      if (!a || !warmingUp(a)) return;
      const item = a.plan.items[a.index];
      const next: Active = {
        ...a,
        warm: item.warmup!.length,
        weight: item.target.weight,
        reps: item.target.reps,
        restUntil: null,
        setStart: Date.now(),
        lastAt: Date.now(),
      };
      set({ active: next });
      persistActive(next);
    },

    skipRest() {
      const a = get().active;
      if (!a) return;
      // Rest is over (timer ran out or Skip): the next set's work starts now.
      const now = Date.now();
      const next = {
        ...a,
        restUntil: null,
        restReady: undefined,
        setStart: now,
        lastRest: a.restStart ? Math.round((now - a.restStart) / 1000) : a.lastRest,
      };
      set({ active: next });
      persistActive(next);
    },

    startRest() {
      const a = get().active;
      if (!a?.restReady) return;
      const now = Date.now();
      // The rest counts from Log set (restStart), so a late tap still records the real rest taken.
      const next: Active = { ...a, restUntil: now + a.restReady * 1000, restTotal: a.restReady, restReady: undefined, lastAt: now };
      set({ active: next });
      persistActive(next);
    },

    feedback(rating) {
      const a = get().active;
      if (!a?.askFeedback) return;
      if (rating !== 0)
        commit([{ type: "feedback", id: uid(), at: Date.now(), sessionId: a.sessionId, exerciseId: a.askFeedback, rating }]);
      const next = { ...a, askFeedback: null, lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
    },

    swap(toId, avoid) {
      const a = get().active;
      const g = gym();
      if (!a || !g) return;
      const item = a.plan.items[a.index];
      const to = exercise(toId);
      const t = injuredTarget(to, target(to, get().events, get().profile, g, Date.now()), activeInjuries(get().events), g);
      const done = setsDone(get().events, a.sessionId, item.exerciseId);
      const newItem: PlanItem = {
        ...item,
        exerciseId: toId,
        target: t.target,
        injuryPct: t.injuryPct,
        sets: Math.max(1, item.sets - done),
      };
      // A program keeps its sets and reps (and the lift the sets count for); only the weight changes,
      // to what the new exercise usually takes. A ladder step keeps bodyweight.
      if (item.setTargets) {
        const rest = item.setTargets.slice(Math.min(done, item.setTargets.length - 1));
        newItem.setTargets = rest.map((x) => ({ ...x, weight: t.target.weight }));
        newItem.target = { ...t.target, reps: rest[0].reps, note: item.target.note };
        newItem.sets = rest.length;
      }
      // The new exercise gets its own warm-ups, unless working sets were already done.
      const warmed = new Set(a.plan.items.slice(0, a.index).flatMap((i) => exercise(i.exerciseId).primary));
      const wu = done ? [] : warmupFor(exercise(toId), t.target.weight, g, warmed);
      newItem.warmup = wu.length ? wu : undefined;
      const items = [...a.plan.items];
      items[a.index] = newItem;
      commit([{ type: "swap", id: uid(), at: Date.now(), sessionId: a.sessionId, from: item.exerciseId, to: toId, avoid }]);
      track("feature", { name: "swap", detail: avoid ? "not available here" : "swap" });
      const next = loadItem(get, { ...a, plan: { ...a.plan, items } }, a.index);
      set({ active: next });
      persistActive(next);
    },

    toggleSuperset(index) {
      const a = get().active;
      if (a) {
        const items = toggleLink(a.plan.items, index);
        const next = { ...a, plan: { ...a.plan, items }, lastAt: Date.now() };
        set({ active: next });
        persistActive(next);
        return;
      }
      const p = get().preview;
      if (!p || index < 0 || index >= p.items.length - 1) return;
      const items = toggleLink(p.items, index);
      // Remember this pair's choice only; other pairs keep theirs.
      const key = `${items[index].exerciseId}>${items[index + 1].exerciseId}`;
      const on = linksOf(items)[index];
      const links = [...get().links.filter((k) => k !== key && k !== `!${key}`), on ? key : `!${key}`];
      track("feature", { name: "superset", detail: on ? "link" : "split" });
      set({ links, preview: { ...p, items, estMinutes: Math.round(planSeconds(items) / 60) } });
    },

    goTo(index) {
      const a = get().active;
      if (!a) return;
      const next = loadItem(get, a, index);
      set({ active: next });
      persistActive(next);
    },

    finish(opts = {}) {
      const a = get().active;
      if (!a) return null;
      const at = opts.at ?? Date.now();
      const inWindow = a.hrAt.map((t) => a.startedAt + t <= at);
      const hr = a.hr.filter((_, i) => inWindow[i]);
      const sets = get().events.filter((e) => e.type === "set" && e.sessionId === a.sessionId);
      const sum = (k: "durationSec" | "restSec") => sets.reduce((s, e) => s + ((e.type === "set" && e[k]) || 0), 0);
      const end: AppEvent = {
        type: "sessionEnd",
        id: uid(),
        at,
        sessionId: a.sessionId,
        seconds: Math.max(0, Math.round((at - a.startedAt) / 1000)),
        avgHr: hr.length ? Math.round(hr.reduce((s, x) => s + x, 0) / hr.length) : undefined,
        maxHr: hr.length ? Math.max(...hr) : undefined,
        minHr: hr.length ? Math.min(...hr) : undefined,
        workSec: sets.length ? sum("durationSec") : undefined,
        restSec: sets.length ? sum("restSec") : undefined,
        auto: opts.auto || undefined,
      };
      const evs: AppEvent[] = [end];
      if (hr.length)
        evs.push({
          type: "hrSeries",
          id: uid(),
          at,
          sessionId: a.sessionId,
          start: a.startedAt,
          t: a.hrAt.filter((_, i) => inWindow[i]).map((t) => Math.round(t / 1000)),
          bpm: hr,
        });
      commit(evs);
      // Counts and length only: no weights, reps or heart rate leave the device.
      track("workout_finish", {
        sets: sets.length,
        minutes: Math.round((end.type === "sessionEnd" ? end.seconds : 0) / 60),
        auto: !!opts.auto,
        exercises: new Set(sets.map((e) => (e.type === "set" ? e.exerciseId : ""))).size,
        challenge: !!a.plan.challenge,
      });
      set({ active: null, undoable: null });
      persistActive(null);
      get().replan();
      return end;
    },

    discard() {
      const a = get().active;
      if (!a) return;
      const ids = get()
        .events.filter((e) => "sessionId" in e && e.sessionId === a.sessionId)
        .map((e) => e.id);
      track("workout_discard", { sets: get().events.filter((e) => e.type === "set" && e.sessionId === a.sessionId).length });
      const events = get().events.filter((e) => !ids.includes(e.id));
      set({ events, stats: derive(events, Date.now()), active: null, undoable: null });
      void deleteEvents(ids);
      persistActive(null);
      get().replan();
    },

    pushHr(bpm) {
      const a = get().active;
      if (!a) return;
      // At most one sample a second (straps send about one), kept for the whole workout.
      const t = Date.now() - a.startedAt;
      const last = a.hrAt.length - 1;
      const same = last >= 0 && t - a.hrAt[last] < 1000;
      const hr = same ? [...a.hr.slice(0, -1), bpm] : [...a.hr, bpm];
      const hrAt = same ? [...a.hrAt.slice(0, -1), t] : [...a.hrAt, t];
      const next = { ...a, hr, hrAt };
      set({ active: next });
      // Saved every 15 samples so a crash or a killed app keeps the stream.
      if (!same && hr.length % 15 === 0) persistActive(next);
    },
  };
}
