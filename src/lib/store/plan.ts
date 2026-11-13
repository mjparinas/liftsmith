import { track } from "../analytics";
import { weekStart } from "../block";
import { makeGym, type GymPreset } from "../defaults";
import { derive, setWeekStart } from "../derive";
import { can } from "../entitlements";
import { freeAdaptiveLeft } from "../freeAdaptive";
import { generate, injuryPass, type Plan } from "../generator";
import { gymAt, locate, wantsLocation, type Fix } from "../geo";
import type { GymKit } from "../gymShare";
import { saveRecord } from "../localdb";
import { withSettings, type Setting } from "../machineSettings";
import { applyFixes, startFix, type FixKind, type Plateau } from "../plateau";
import { freeProgramFor, pickProgram, PROGRAM_BY_ID, programPlan } from "../programs";
import { readiness, todayFeel, type Call, type Readiness } from "../readiness";
import { applyOrder } from "../reorder";
import { planFromRoutine } from "../routines";
import { healthExternal } from "../twin";
import type { FeelEvent, Gym, Profile } from "../types";
import { relink, uid, type Ctx } from "./shared";

// The profile, gyms and Today's plan: settings, the push/easy call, superset links, plateau fixes and deloads.
// One slice of the app's state (store.ts puts them together).

export interface PlanSlice {
  /** The plan preview on Today, rebuilt when the length or gym changes. */
  preview: Plan | null;
  /** Today's push / normal / recover call from the lifter's data. */
  readiness: Readiness | null;
  /** The lifter's own call for today, overriding the suggestion. */
  callOverride: Call | null;
  setCall(c: Call | null): void;
  /** Without Pro: today's plan is this week's one free adaptive workout instead of the free program (freeAdaptive.ts). */
  tryAdaptive: boolean;
  setTryAdaptive(on: boolean): void;
  /**
   * The pre-workout check-in on Today: merges the change into today's answer, saves it as a new "feel"
   * event (the newest one today counts) and rebuilds the plan, so the call follows.
   */
  feel(change: Partial<Pick<FeelEvent, "energy" | "sore" | "unwell">>): void;
  /** The gym last picked automatically by location, for the hint on Today. */
  pickedByLocation: string | null;
  /**
   * Superset choices made on Today, kept when the plan is rebuilt: "first>second" links a pair, and
   * "!first>second" splits a pair the plan itself linked (a routine or "Same as last time").
   */
  links: string[];
  /** An order chosen on Today by dragging (exercise ids), kept when the plan is rebuilt with the same exercises. */
  order: string[];
  /** Switches to the gym the lifter is at, if they opted in. `fix` is for tests. */
  pickGymByLocation(fix?: Fix | null): Promise<string | null>;
  setProfile(p: Partial<Profile>): void;
  saveGym(g: Gym): void;
  addGym(preset: GymPreset): string;
  /** Adds a gym someone shared (gymShare.ts), or a real gym from the finder (`placeId`), and returns its id. */
  importGym(kit: GymKit, placeId?: string): string;
  removeGym(id: string): void;
  replan(): void;
  /** Keeps the plan source in step with Pro: free lifters follow a free fixed program, and Pro brings back what they had. */
  applyAccess(): void;
  /** Saves machine settings for an exercise at the active workout's (or active) gym. */
  setMachineSettings(exerciseId: string, list: Setting[], gymId?: string): void;
  /** Starts a three-week plateau fix (plateau.ts). */
  fixPlateau(p: Plateau, kind: FixKind): void;
  /** Use this plan for today instead of the generated one ("same as last time"). Null goes back. */
  setPlan(plan: Plan | null): void;
  /**
   * When the lifter last asked for another workout today (Today's "Train again", or picking a plan). Today shows
   * "Done for today" after a workout that started later than this, and the plan otherwise. Not saved.
   */
  againAt: number;
  trainAgain(): void;
  /** Make the current week the deload week (a coach's note action). The next block starts after it. */
  startDeload(): void;
}

export function planSlice(c: Ctx): PlanSlice {
  const { set, get, gym, commit } = c;
  return {
    preview: null,
    readiness: null,
    callOverride: null,
    tryAdaptive: false,
    pickedByLocation: null,
    links: [],
    order: [],
    againAt: 0,
    trainAgain() {
      set({ againAt: Date.now() });
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

    setProfile(p) {
      const profile = { ...get().profile, ...p, updatedAt: Date.now() };
      set({ profile });
      void saveRecord("profile", profile);
      if ("training" in p) {
        setWeekStart(profile.training?.weekStart);
        set({ stats: derive(get().events, Date.now()) });
      }
      if (
        "minutes" in p ||
        "training" in p ||
        "planSource" in p ||
        "activeGymId" in p ||
        "variability" in p ||
        "goal" in p ||
        "experience" in p
      )
        get().replan();
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

    importGym(kit, placeId) {
      const g: Gym = { ...kit, ...(placeId ? { placeId } : {}), id: crypto.randomUUID(), updatedAt: Date.now() };
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
      // Health signals (sleep, HRV, resting HR, breathing rate) move the call for Pro only (AGENTS.md "Health twin").
      const r = readiness(events, profile, now, {
        cycle: !!profile.cycle?.enabled,
        ...(can("healthReadiness") ? healthExternal(events, now) : {}),
      });
      const call = callOverride ?? r.call;
      // This week's free adaptive workout replaces the free program's day (Melvin, 2026-11-12).
      const trying = get().tryAdaptive && !can("adaptive") && freeAdaptiveLeft(events, now);
      const src = trying ? undefined : profile.planSource;
      const programDay = src?.kind === "program" ? programPlan({ src, gym: g, profile, events, now, call, challenge: r.challenge }) : null;
      const fromProgram = programDay?.program?.fixed ? injuryPass(programDay, events, profile, g, now) : programDay;
      let plan = fromProgram ?? generate({ gym: g, profile, events, minutes: profile.minutes, now, call, challenge: r.challenge });
      // A saved routine replaces today's plan (adaptive or program), where this gym can do it.
      const routine = profile.routines?.find((x) => x.id === get().routineId);
      // It isn't a program day, so the program's next day stays next.
      const fromRoutine = routine ? planFromRoutine(plan, routine, events, profile, g, now)?.plan : undefined;
      // A rehab routine from the lifter's physio stays as written: it's meant for the injured area (trainer-mode.md).
      if (fromRoutine)
        plan = routine?.rehab
          ? { ...fromRoutine, program: undefined, rehab: true }
          : { ...injuryPass(fromRoutine, events, profile, g, now), program: undefined };
      // Plateau fixes adjust the adaptive plan only; programs and routines stay as written.
      if (!fromProgram && !fromRoutine) plan = applyFixes(plan, profile.plateauFixes, events, profile, g, now);
      set({ readiness: r, preview: relink({ ...plan, items: applyOrder(plan.items, get().order) }, get().links) });
    },

    applyAccess() {
      const { profile, events, ready } = get();
      const g = gym();
      if (!ready || !profile.onboarded || !g) return;
      const src = profile.planSource ?? { kind: "adaptive" as const };
      const free = src.kind === "program" && PROGRAM_BY_ID.get(src.id)?.tier === "free";
      if (!can("adaptive")) {
        // Adaptive plans and splits are Pro: keep what they had, and plan the free classic 5x5 meanwhile.
        // The free program fits the gym (freeProgramFor): the 5×5 with a barbell, dumbbell full body, or bodyweight skills.
        if (!free && src.kind !== "routine")
          get().setProfile({ proPlan: src, planSource: pickProgram(freeProgramFor(g), { profile, gym: g, events, now: Date.now() }) });
      } else if (profile.proPlan) {
        // Pro again (a purchase, a restore, a renewal the phone just heard about): back to their own plan.
        get().setProfile({ planSource: profile.proPlan, proPlan: undefined });
      }
    },

    setCall(c) {
      set({ callOverride: c });
      get().replan();
    },

    setTryAdaptive(on) {
      if (get().active) return;
      set({ tryAdaptive: on });
      track("feature", { name: "free_adaptive", detail: on ? "on" : "off" });
      get().replan();
    },

    feel(change) {
      const now = Date.now();
      const was = todayFeel(get().events, now);
      const next: FeelEvent = {
        type: "feel",
        id: uid(),
        at: now,
        energy: change.energy ?? was?.energy ?? 0,
        sore: change.sore ?? was?.sore,
        unwell: change.unwell ?? was?.unwell,
      };
      commit([next]);
      // Only that the check-in was used: how the lifter feels stays out of usage stats.
      track("feature", { name: "feel_checkin" });
      get().replan();
    },

    setMachineSettings(exerciseId, list, gymId) {
      const id = gymId ?? get().active?.plan.gymId ?? get().profile.activeGymId;
      const g = get().gyms.find((x) => x.id === id);
      if (!g) return;
      const next = withSettings(g, exerciseId, list);
      const gyms = get().gyms.map((x) => (x.id === g.id ? { ...next, updatedAt: Date.now() } : x));
      set({ gyms });
      void saveRecord("gyms", gyms);
    },

    fixPlateau(p, kind) {
      const now = Date.now();
      const fixes = (get().profile.plateauFixes ?? []).filter((f) => f.exerciseId !== p.exerciseId || f.until < now - 90 * 86400_000);
      get().setProfile({ plateauFixes: [...fixes, startFix(p, kind, gym() ?? null, now)] });
      track("feature", { name: "plateau_fix", detail: kind });
      get().replan();
    },

    setPlan(plan) {
      if (get().active) return;
      if (plan) set({ preview: plan, againAt: Date.now() });
      else get().replan();
    },

    startDeload() {
      const p = get().profile;
      const now = Date.now();
      const build = Math.min(6, Math.max(3, p.blockWeeks));
      get().setProfile({ blockStart: weekStart(p, now) - build * 7 * 86_400_000 });
      get().replan();
    },
  };
}
