import { track } from "../analytics";
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

    deleteRoutine(id) {
      get().setProfile({ routines: (get().profile.routines ?? []).filter((x) => x.id !== id) });
      if (get().routineId === id) get().pickRoutine(null);
    },
  };
}
