import { track } from "../analytics";
import { rehabInjuries } from "../partExtras";
import { phaseRoutineName, rehabProgram } from "../rehab";
import { movePhase } from "../rehabPhases";
import { upsertRoutine } from "../routines";
import type { Routine } from "../types";
import type { Ctx } from "./shared";

// Saved routines (routines.ts): pick one for today, save, delete.
// One slice of the app's state (store.ts puts them together).

export interface RoutinesSlice {
  /** The saved routine used for today instead of the adaptive plan, if any. */
  routineId: string | null;
  /** Use a saved routine for today, or go back to the adaptive plan (null). */
  pickRoutine(id: string | null): void;
  /** Save a routine (new or edited) on the profile. */
  saveRoutine(r: Routine): void;
  deleteRoutine(id: string): void;
  /**
   * Saves a routine someone shared or a coach sent. A rehab program for an area with no active injury there also logs
   * that injury (unless `logInjury` is false), so its pain checks, Today's offer and the physio's report have it
   * (2026-11-15). Returns the injury id it logged, if any.
   */
  saveShared(r: Routine, logInjury?: boolean): string | undefined;
  /**
   * Moves a rehab routine to another phase of its protocol (2026-11-17): that phase's exercises and name, counted from
   * now. The lifter does this only when their physio allowed it and the pain rule says so (rehabPhases.ts).
   */
  moveRehabPhase(routineId: string, phase: number): void;
}

export function routinesSlice(c: Ctx): RoutinesSlice {
  const { set, get } = c;
  return {
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

    saveShared(r, logInjury = true) {
      // A new phase of a protocol already saved replaces it in place, so Today, reminders and the rehab history carry on.
      const same = r.rehabPlan ? (get().profile.routines ?? []).find((x) => x.rehab && x.rehabPlan?.id === r.rehabPlan!.id) : undefined;
      const now = Date.now();
      const plan = r.rehabPlan ? { ...r.rehabPlan, since: now } : undefined;
      const fresh = plan ? { ...r, rehabPlan: plan } : r;
      get().saveRoutine(same ? { ...fresh, id: same.id, createdAt: same.createdAt } : fresh);
      if (same) track("feature", { name: "trainer", detail: "rehabPhaseSaved" });
      const part = r.rehab ? r.rehabPart : undefined;
      if (!part || !logInjury || rehabInjuries(get().events, r).length) return undefined;
      track("feature", { name: "trainer", detail: "rehabInjury" });
      return get().logInjury(part);
    },

    moveRehabPhase(routineId, phase) {
      const r = (get().profile.routines ?? []).find((x) => x.id === routineId);
      const p = rehabProgram(r?.rehabPlan?.id);
      if (!r || !p) return;
      get().saveRoutine(movePhase(r, phase, phaseRoutineName(p, phase), Date.now()));
      track("feature", { name: "trainer", detail: "rehabPhaseSelf" });
    },

    deleteRoutine(id) {
      get().setProfile({ routines: (get().profile.routines ?? []).filter((x) => x.id !== id) });
      if (get().routineId === id) get().pickRoutine(null);
    },
  };
}
