"use client";
import { create } from "zustand";
import { defaultProfile, makeGym, type GymPreset } from "./defaults";
import { derive, type Stats } from "./derive";
import { alternatives, generate, injuredTarget, injuryPass, type Plan, type PlanItem, type SetTarget } from "./generator";
import { activeInjuries, effectFor } from "./injury";
import { appendEvents, deleteEvents, eraseAll, load, saveRecord } from "./localdb";
import { target } from "./progression";
import { exercise, registerCustom } from "./exercises";
import { setSeconds } from "./generator";
import { WARMUP_REST, warmupFor } from "./warmup";
import { afterSet, linksOf, toggleLink, withLinks } from "./superset";
import { planFromRoutine, upsertRoutine } from "./routines";
import { planSeconds } from "./generator";
import { gymAt, locate, wantsLocation, type Fix } from "./geo";
import { readiness, type Call, type Readiness } from "./readiness";
import type { AppEvent, BodyPart, Gym, InjuryRuleEvent, LoadKind, Muscle, Profile, Rating, Routine } from "./types";
import { forgetAnalytics, track } from "./analytics";
import { programPlan } from "./programs";

// The app's state. Events are the source of truth; `stats` is recomputed from them.

export interface Active {
  sessionId: string;
  startedAt: number;
  plan: Plan;
  /** Index into plan.items of the exercise on screen. */
  index: number;
  /** Working values for the next set (kg, reps), editable with the steppers. */
  weight: number;
  reps: number;
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
}

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

interface State {
  ready: boolean;
  events: AppEvent[];
  profile: Profile;
  gyms: Gym[];
  stats: Stats;
  active: Active | null;
  /** The plan preview on Today, rebuilt when the length or gym changes. */
  preview: Plan | null;
  /** Today's push / normal / recover call from the lifter's data. */
  readiness: Readiness | null;
  /** The lifter's own call for today, overriding the suggestion. */
  callOverride: Call | null;
  setCall(c: Call | null): void;
  /** Log that a period started on this day (cycle-aware readiness). */
  logPeriod(day: number): void;
  /** A note on an exercise (empty clears it for next time). */
  addNote(exerciseId: string, text: string): void;
  /** How many reps the lifter says they had left on a logged set. */
  rateEffort(setId: string, rir: number): void;
  /** Creates the lifter's own exercise and returns its id. */
  addCustomExercise(e: { name: string; primary: Muscle; load: LoadKind; compound: boolean }): string;
  /** Turn cycle-aware readiness off and erase every logged period. */
  forgetCycle(): Promise<void>;
  /** The gym last picked automatically by location, for the hint on Today. */
  pickedByLocation: string | null;
  /** Supersets picked on Today, as "first>second" exercise pairs, kept when the plan is rebuilt. */
  links: string[];
  /** The saved routine used for today instead of the adaptive plan, if any. */
  routineId: string | null;
  /** Use a saved routine for today, or go back to the adaptive plan (null). */
  pickRoutine(id: string | null): void;
  /** Save a routine (new or edited) on the profile. */
  saveRoutine(r: Routine): void;
  deleteRoutine(id: string): void;
  /** Switches to the gym the lifter is at, if they opted in. `fix` is for tests. */
  pickGymByLocation(fix?: Fix | null): Promise<string | null>;
  /** Injury mode: log a hurt body part (affected exercises are skipped), change what happens, mark healed. */
  logInjury(part: BodyPart): string;
  setInjuryRule(injuryId: string, rule: Pick<InjuryRuleEvent, "exerciseId" | "action" | "pct" | "ack">): void;
  healInjury(injuryId: string): void;
  /** A 0–10 pain rating, optionally tied to this workout and exercise. */
  ratePain(injuryId: string, score: number, ctx?: { sessionId?: string; exerciseId?: string }): void;
  /** Start a graded return (the lifter accepted the risks). */
  startReturn(injuryId: string): void;
  autoEnd(now?: number): boolean;
  init(): Promise<void>;
  setProfile(p: Partial<Profile>): void;
  saveGym(g: Gym): void;
  addGym(preset: GymPreset): string;
  removeGym(id: string): void;
  replan(): void;
  start(): void;
  logSet(): void;
  adjust(weight: number, reps: number): void;
  addRest(sec: number): void;
  skipRest(): void;
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
  /** Use this plan for today instead of the generated one ("same as last time"). Null goes back. */
  setPlan(plan: Plan | null): void;
  /** Log a weigh-in and make it the profile's body weight. */
  logBodyweight(kg: number): void;
  /** Save imported workouts (importCsv.ts), skipping any already saved. Returns how many events were new. */
  importWorkouts(evs: AppEvent[]): number;
  /** Record a gym buddy check-in. */
  checkin(buddies: string[]): void;
  reset(): Promise<void>;
}

const ACTIVE_KEY = "liftsmith.active";

/** Re-applies the supersets picked on Today to a rebuilt plan, where both exercises are still neighbours. */
function relink(plan: Plan, links: readonly string[]): Plan {
  if (!links.length) return plan;
  const want = new Set(links);
  const l = linksOf(plan.items).map((on, i) => on || want.has(`${plan.items[i].exerciseId}>${plan.items[i + 1].exerciseId}`));
  const items = withLinks(plan.items, l);
  return { ...plan, items, estMinutes: Math.round(planSeconds(items) / 60) };
}
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function persistActive(a: Active | null) {
  try {
    if (a) localStorage.setItem(ACTIVE_KEY, JSON.stringify(a));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

function setsDone(events: AppEvent[], sessionId: string, exerciseId: string): number {
  return events.filter((e) => e.type === "set" && e.sessionId === sessionId && e.exerciseId === exerciseId).length;
}

export const useApp = create<State>((set, get) => {
  const commit = (evs: AppEvent[]) => {
    registerCustom(evs);
    const events = [...get().events, ...evs];
    set({ events, stats: derive(events, Date.now()) });
    void appendEvents(evs);
  };
  const gym = () => get().gyms.find((g) => g.id === get().profile.activeGymId) ?? get().gyms[0];
  // An injury change replans Today, and the rest of a workout in progress: exercises not started yet
  // that the injury now skips are swapped for one that avoids it (or dropped), lighter ones re-targeted.
  const afterInjuryChange = () => {
    const a = get().active;
    const g = gym();
    if (a && g) {
      const { events, profile } = get();
      const hurt = activeInjuries(events);
      const now = Date.now();
      const items: PlanItem[] = a.plan.items.slice(0, a.index);
      for (const item of a.plan.items.slice(a.index)) {
        if (setsDone(events, a.sessionId, item.exerciseId) > 0) {
          items.push(item);
          continue;
        }
        let ex = exercise(item.exerciseId);
        if (item.setTargets) {
          // A program's sets: keep its scheme, lighten or swap them in place (once).
          if (item.injuryPct && effectFor(ex, hurt)?.action !== "skip") items.push(item);
          else items.push(...injuryPass({ ...a.plan, items: [item] }, events, profile, g, now).items);
          continue;
        }
        if (effectFor(ex, hurt)?.action === "skip") {
          const alt = alternatives(ex.id, g, [...items, ...a.plan.items].map((i) => i.exerciseId), hurt)[0];
          if (!alt) continue;
          ex = alt;
        }
        const t = injuredTarget(ex, target(ex, events, profile, g, now), hurt, g);
        // Warm-ups follow the new exercise and load.
        const warmed = new Set(items.flatMap((i) => exercise(i.exerciseId).primary));
        const wu = warmupFor(ex, t.target.weight, g, warmed);
        items.push({ ...item, exerciseId: ex.id, target: t.target, injuryPct: t.injuryPct, challenge: t.injuryPct ? undefined : item.challenge, warmup: wu.length ? wu : undefined });
      }
      const next = loadItem({ ...a, plan: { ...a.plan, items } }, Math.min(a.index, items.length));
      set({ active: next });
      persistActive(next);
    }
    get().replan();
  };
  const loadItem = (a: Active, index: number): Active => {
    const item = a.plan.items[index];
    if (!item) return { ...a, index, warm: 0 };
    // Coming back to an exercise that's already started skips its warm-ups.
    const done = setsDone(get().events, a.sessionId, item.exerciseId);
    const started = done > 0;
    const warm = started ? (item.warmup?.length ?? 0) : 0;
    const first = !started && item.warmup?.[0];
    const t = item.setTargets?.[Math.min(done, item.setTargets.length - 1)] ?? item.target;
    return { ...a, index, warm, weight: first ? first.weight : t.weight, reps: first ? first.reps : t.reps };
  };

  return {
    ready: false,
    events: [],
    profile: defaultProfile(),
    gyms: [],
    stats: derive([], Date.now()),
    active: null,
    preview: null,
    readiness: null,
    callOverride: null,
    pickedByLocation: null,
    links: [],
    routineId: null,

    pickRoutine(id) {
      if (get().active) return;
      set({ routineId: id, links: [] });
      if (id) track("feature", { name: "routine", detail: "use" });
      get().replan();
    },

    saveRoutine(r) {
      const fresh = !(get().profile.routines ?? []).some((x) => x.id === r.id);
      get().setProfile({ routines: upsertRoutine(get().profile.routines ?? [], r, Date.now()) });
      track("feature", { name: "routine", detail: fresh ? "save" : "edit" });
      if (get().routineId === r.id) get().replan();
    },

    deleteRoutine(id) {
      get().setProfile({ routines: (get().profile.routines ?? []).filter((x) => x.id !== id) });
      if (get().routineId === id) get().pickRoutine(null);
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
      commit([{ type: "customExercise", id: uid(), at: Date.now(), exercise: { id, name: name.trim().slice(0, 60) || "My exercise", primary: [primary], secondary: [], load, compound } }]);
      return id;
    },

    logPeriod(day) {
      if (get().events.some((e) => e.type === "cycle" && e.day === day)) return;
      commit([{ type: "cycle", id: uid(), at: Date.now(), day }]);
      get().replan();
    },

    async forgetCycle() {
      const ids = get().events.filter((e) => e.type === "cycle").map((e) => e.id);
      const events = get().events.filter((e) => e.type !== "cycle");
      set({ events, stats: derive(events, Date.now()) });
      await deleteEvents(ids);
      get().setProfile({ cycle: undefined });
      get().replan();
    },

    logInjury(part) {
      const injuryId = uid();
      commit([{ type: "injury", id: uid(), at: Date.now(), injuryId, part }]);
      afterInjuryChange();
      return injuryId;
    },

    setInjuryRule(injuryId, rule) {
      commit([{ type: "injuryRule", id: uid(), at: Date.now(), injuryId, ...rule }]);
      afterInjuryChange();
    },

    ratePain(injuryId, score, ctx = {}) {
      commit([{ type: "pain", id: uid(), at: Date.now(), injuryId, score, ...ctx }]);
      afterInjuryChange();
    },

    startReturn(injuryId) {
      commit([{ type: "injuryReturn", id: uid(), at: Date.now(), injuryId, ack: true }]);
      afterInjuryChange();
    },

    healInjury(injuryId) {
      commit([{ type: "injuryHealed", id: uid(), at: Date.now(), injuryId }]);
      afterInjuryChange();
    },

    async pickGymByLocation(fix) {
      const { gyms, active, profile } = get();
      // Never mid-workout, and never ask for location unless a gym opted in.
      if (active || !wantsLocation(gyms)) return null;
      const g = gymAt(gyms, fix === undefined ? await locate() : fix);
      if (!g || g.id === profile.activeGymId) return null;
      get().setProfile({ activeGymId: g.id });
      set({ pickedByLocation: g.id });
      return g.id;
    },

    async init() {
      const snap = await load();
      const profile = snap.profile ?? defaultProfile();
      let active: Active | null = null;
      try {
        const raw = localStorage.getItem(ACTIVE_KEY);
        if (raw) {
          const a = JSON.parse(raw) as Active;
          // Workouts saved by older builds lack the data-capture fields.
          active = { ...a, hrAt: a.hrAt ?? a.hr.map(() => 0), setStart: a.setStart ?? a.startedAt, lastAt: a.lastAt ?? a.startedAt };
        }
      } catch {}
      set({ ready: true, events: snap.events, profile, gyms: snap.gyms, stats: derive(snap.events, Date.now()), active });
      if (!get().autoEnd()) get().replan();
    },

    setProfile(p) {
      const profile = { ...get().profile, ...p, updatedAt: Date.now() };
      set({ profile });
      void saveRecord("profile", profile);
      if ("minutes" in p || "planSource" in p || "activeGymId" in p || "variability" in p || "goal" in p || "experience" in p) get().replan();
    },

    saveGym(g) {
      const gyms = get().gyms.map((x) => (x.id === g.id ? { ...g, updatedAt: Date.now() } : x));
      set({ gyms });
      void saveRecord("gyms", gyms);
      get().replan();
    },

    addGym(preset) {
      const g = makeGym(preset, get().profile.unit);
      const gyms = [...get().gyms, g];
      set({ gyms });
      void saveRecord("gyms", gyms);
      return g.id;
    },

    removeGym(id) {
      const gyms = get().gyms.filter((g) => g.id !== id);
      set({ gyms });
      void saveRecord("gyms", gyms);
      if (get().profile.activeGymId === id && gyms[0]) get().setProfile({ activeGymId: gyms[0].id });
    },

    replan() {
      const g = gym();
      if (!g) return set({ preview: null });
      const { profile, events, callOverride } = get();
      const now = Date.now();
      const r = readiness(events, profile, now, { cycle: !!profile.cycle?.enabled });
      const call = callOverride ?? r.call;
      const src = profile.planSource;
      const programDay = src?.kind === "program" ? programPlan({ src, gym: g, profile, events, now, call, challenge: r.challenge }) : null;
      const fromProgram = programDay?.program?.fixed ? injuryPass(programDay, events, profile, g, now) : programDay;
      let plan = fromProgram ?? generate({ gym: g, profile, events, minutes: profile.minutes, now, call, challenge: r.challenge });
      // A saved routine replaces today's plan (adaptive or program), where this gym can do it.
      const routine = profile.routines?.find((x) => x.id === get().routineId);
      // It isn't a program day, so the program's next day stays next.
      const fromRoutine = routine ? planFromRoutine(plan, routine, events, profile, g, now)?.plan : undefined;
      if (fromRoutine) plan = { ...injuryPass(fromRoutine, events, profile, g, now), program: undefined };
      set({ readiness: r, preview: relink(plan, get().links) });
    },

    setCall(c) {
      set({ callOverride: c });
      get().replan();
    },

    autoEnd(now = Date.now()) {
      const a = get().active;
      if (!a || now - a.lastAt < AUTO_END_MS) return false;
      // End it where the lifter stopped, not hours later, so duration and stats stay true.
      get().finish({ at: Math.min(now, a.lastAt + 60_000), auto: true });
      return true;
    },

    start() {
      const plan = get().preview;
      const g = gym();
      if (!plan || !g || !plan.items.length) return;
      const sessionId = uid();
      const now = Date.now();
      const r = get().readiness;
      const overridden = get().callOverride !== null && get().callOverride !== r?.call;
      const a = loadItem({ sessionId, startedAt: now, plan, index: 0, weight: 0, reps: 0, restUntil: null, restTotal: 0, askFeedback: null, hr: [], hrAt: [], setStart: now, lastAt: now }, 0);
      commit([{ type: "sessionStart", id: uid(), at: now, sessionId, gymId: g.id, minutes: plan.minutes, call: plan.call, readiness: r?.score, callOverridden: get().callOverride !== null && get().callOverride !== r?.call, challenge: plan.challenge, program: plan.program ? { id: plan.program.id, day: plan.program.day } : undefined, routine: plan.routineId }]);
      set({ callOverride: null, links: [], routineId: null });
      set({ active: a });
      persistActive(a);
      track("workout_start", { minutes: plan.minutes, exercises: plan.items.length, call: plan.call ?? "normal", overridden, gymKind: g.equipment.length ? "equipped" : "bodyweight" });
    },

    logSet() {
      const a = get().active;
      if (!a) return;
      const item = a.plan.items[a.index];
      if (!item) return;
      const now = Date.now();
      const ex = exercise(item.exerciseId);
      if (warmingUp(a)) {
        // A warm-up set: its own event, a short rest, then the next warm-up or the working weight.
        commit([{ type: "warmup", id: uid(), at: now, sessionId: a.sessionId, exerciseId: item.exerciseId, weight: a.weight, reps: a.reps }]);
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
          restUntil: now + WARMUP_REST * 1000,
        };
        set({ active: next });
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
      commit([
        {
          type: "set",
          id: uid(),
          at: now,
          sessionId: a.sessionId,
          exerciseId: item.exerciseId,
          weight: a.weight,
          reps: a.reps,
          targetReps: planned.reps,
          rir: planned.amrap ? 0 : item.target.rir,
          targetWeight: planned.weight,
          amrap: planned.amrap,
          slot: item.slot,
          startedAt: a.setStart,
          durationSec: plausible ? Math.round(duration) : undefined,
          restSec: earlyLog && a.restStart ? Math.round((now - a.restStart) / 1000) : a.lastRest,
          ...hrWindow(a, a.setStart, now),
          challenge: item.challenge && already + 1 === item.sets ? true : undefined,
          injuryPct: item.injuryPct,
          superset: item.group,
        },
      ]);
      // Alone, the next set is the same exercise until its sets are done. In a superset it's the
      // next exercise of the round (superset.ts).
      const items = a.plan.items;
      const step = afterSet(items, a.index, (i) => (i === a.index ? already + 1 : setsDone(get().events, a.sessionId, items[i].exerciseId)));
      let next: Active = { ...a, lastAt: now, restStart: now, lastRest: undefined, setStart: now };
      // Programs with a different target for each set (ramps, percentages) load the next one; straight
      // sets keep whatever the lifter dialled in.
      const nextT = item.setTargets?.[already + 1];
      const prevT = item.setTargets?.[already];
      if (step.index === a.index && nextT && prevT && (nextT.weight !== prevT.weight || nextT.reps !== prevT.reps)) next = { ...next, weight: nextT.weight, reps: nextT.reps };
      if (step.finished) next.askFeedback = item.exerciseId; // Exercise finished: ask how it felt.
      if (step.index !== a.index) next = loadItem(next, Math.min(step.index, items.length));
      const last = next.index >= items.length;
      next.restTotal = last ? 0 : step.rest;
      next.restUntil = last ? null : now + step.rest * 1000;
      set({ active: next });
      persistActive(next);
    },

    adjust(weight, reps) {
      const a = get().active;
      if (!a) return;
      const next = { ...a, weight: Math.max(0, weight), reps: Math.max(1, reps), lastAt: Date.now() };
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
      const next: Active = { ...a, warm: item.warmup!.length, weight: item.target.weight, reps: item.target.reps, restUntil: null, setStart: Date.now(), lastAt: Date.now() };
      set({ active: next });
      persistActive(next);
    },

    skipRest() {
      const a = get().active;
      if (!a) return;
      // Rest is over (timer ran out or Skip): the next set's work starts now.
      const now = Date.now();
      const next = { ...a, restUntil: null, setStart: now, lastRest: a.restStart ? Math.round((now - a.restStart) / 1000) : a.lastRest };
      set({ active: next });
      persistActive(next);
    },

    feedback(rating) {
      const a = get().active;
      if (!a?.askFeedback) return;
      if (rating !== 0) commit([{ type: "feedback", id: uid(), at: Date.now(), sessionId: a.sessionId, exerciseId: a.askFeedback, rating }]);
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
      const newItem: PlanItem = { ...item, exerciseId: toId, target: t.target, injuryPct: t.injuryPct, sets: Math.max(1, item.sets - done) };
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
      const next = loadItem({ ...a, plan: { ...a.plan, items } }, a.index);
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
      if (!p) return;
      const items = toggleLink(p.items, index);
      const links = items.slice(0, -1).flatMap((it, i) => (items[i + 1] && it.group && it.group === items[i + 1].group ? [`${it.exerciseId}>${items[i + 1].exerciseId}`] : []));
      track("feature", { name: "superset", detail: links.length > get().links.length ? "link" : "split" });
      set({ links, preview: { ...p, items, estMinutes: Math.round(planSeconds(items) / 60) } });
    },

    goTo(index) {
      const a = get().active;
      if (!a) return;
      const next = loadItem(a, index);
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
      if (hr.length) evs.push({ type: "hrSeries", id: uid(), at, sessionId: a.sessionId, start: a.startedAt, t: a.hrAt.filter((_, i) => inWindow[i]).map((t) => Math.round(t / 1000)), bpm: hr });
      commit(evs);
      // Counts and length only: no weights, reps or heart rate leave the device.
      track("workout_finish", { sets: sets.length, minutes: Math.round((end.type === "sessionEnd" ? end.seconds : 0) / 60), auto: !!opts.auto, exercises: new Set(sets.map((e) => (e.type === "set" ? e.exerciseId : ""))).size, challenge: !!a.plan.challenge });
      set({ active: null });
      persistActive(null);
      get().replan();
      return end;
    },

    discard() {
      const a = get().active;
      if (!a) return;
      const ids = get().events.filter((e) => "sessionId" in e && e.sessionId === a.sessionId).map((e) => e.id);
      track("workout_discard", { sets: get().events.filter((e) => e.type === "set" && e.sessionId === a.sessionId).length });
      const events = get().events.filter((e) => !ids.includes(e.id));
      set({ events, stats: derive(events, Date.now()), active: null });
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

    setPlan(plan) {
      if (get().active) return;
      if (plan) set({ preview: plan });
      else get().replan();
    },

    logBodyweight(kg) {
      if (!(kg > 0)) return;
      commit([{ type: "bodyweight", id: uid(), at: Date.now(), kg }]);
      get().setProfile({ bodyweight: kg });
    },

    importWorkouts(evs) {
      const have = new Set(get().events.map((e) => e.id));
      const fresh = evs.filter((e) => !have.has(e.id));
      if (fresh.length) commit(fresh);
      get().replan();
      return fresh.length;
    },

    checkin(buddies) {
      commit([{ type: "checkin", id: uid(), at: Date.now(), gymId: get().profile.activeGymId, buddies }]);
      track("feature", { name: "buddy_checkin", detail: String(buddies.length) });
    },

    async reset() {
      await eraseAll();
      persistActive(null);
      forgetAnalytics();
      set({ events: [], profile: defaultProfile(), gyms: [], stats: derive([], Date.now()), active: null, preview: null });
    },
  };
});
