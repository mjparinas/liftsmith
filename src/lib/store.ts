"use client";

import { create } from "zustand";

import { forgetAnalytics, track } from "./analytics";
import { signOut } from "./auth";
import { mergeBackup, type Backup } from "./backup";
import { forgetBilling, proMonth } from "./billing";
import { defaultProfile } from "./defaults";
import { derive, setWeekStart, type Stats } from "./derive";
import { registerCustom } from "./exercises";
import { appendEvents, deleteEvents, eraseAll, load, saveRecord } from "./localdb";
import { coolDownHome } from "./sessions";
import { healthSlice, type HealthSlice } from "./store/health";
import { historySlice, type HistorySlice } from "./store/history";
import { injuriesSlice, type InjuriesSlice } from "./store/injuries";
import { planSlice, type PlanSlice } from "./store/plan";
import { routinesSlice, type RoutinesSlice } from "./store/routines";
import { ACTIVE_KEY, persistActive, uid, type Ctx } from "./store/shared";
import { workoutSlice, type Active, type WorkoutSlice } from "./store/workout";
import { lastWeighInKg } from "./tdee";
import { minutesForToday } from "./training";
import type { AppEvent, Gym, Profile, StretchEvent } from "./types";

export { AUTO_END_MS, hrWindow, partNow, REST_PAUSE_SEC, stretching, warmingUp, type Active } from "./store/workout";

// The app's state. Events are the source of truth; `stats` is recomputed from them.
// Each area's state and actions live in its own slice under src/lib/store/ (workout, plan, injuries,
// health, routines, history); this file puts them together and keeps loading, sync, backup and erase.

export interface State extends WorkoutSlice, PlanSlice, InjuriesSlice, HealthSlice, RoutinesSlice, HistorySlice {
  ready: boolean;
  events: AppEvent[];
  profile: Profile;
  gyms: Gym[];
  stats: Stats;
  init(): Promise<void>;
  /** Save imported workouts (importCsv.ts), skipping any already saved. Returns how many events were new. */
  importWorkouts(evs: AppEvent[]): number;
  /** Restores a full backup file (backup.ts): its profile comes back, its gyms and events are added. Returns the events added. */
  restoreBackup(b: Backup): number;
  /** Applies what sync pulled from the lifter's other devices (sync.ts). Written locally without queueing it back. */
  applySynced(p: { events: AppEvent[]; deleted: string[]; profile: Profile | null; gyms: Gym[] | null }): void;
  /** Record a gym buddy check-in. */
  checkin(buddies: string[]): void;
  /** Log this month as a Pro month (once a month, while proMember() says so), for the Pro achievement. */
  notePro(now?: number): void;
  /** Saves a finished stretch routine (Stretch.tsx). */
  logStretch(moment: StretchEvent["moment"], ids: string[], seconds: number): void;
  reset(): Promise<void>;
}

export const useApp = create<State>((set, get) => {
  // `profile.bodyweight` is a copy of the newest weigh-in, for the plan and the tools that read the profile.
  // Weigh-ins arrive by several roads (typed in, Health Connect and Apple Health, cloud apps, a CSV, sync from
  // another device) and the profile syncs separately, last write wins, so another device's older copy could
  // replace it. This puts it back whenever the events or the profile change. Saved on this device only (each
  // device works it out from the same merged weigh-ins), so it never fights over sync.
  const settleBodyweight = () => {
    const { events, profile } = get();
    const kg = lastWeighInKg(events);
    if (kg === undefined || kg === profile.bodyweight) return;
    const next = { ...profile, bodyweight: kg };
    set({ profile: next });
    void saveRecord("profile", next, { remote: true });
  };
  const commit = (evs: AppEvent[]) => {
    registerCustom(evs);
    const events = [...get().events, ...evs];
    set({ events, stats: derive(events, Date.now()) });
    void appendEvents(evs);
    if (evs.some((e) => e.type === "bodyweight")) settleBodyweight();
  };
  const gym = () => get().gyms.find((g) => g.id === get().profile.activeGymId) ?? get().gyms[0];
  const c: Ctx = { set, get, commit, gym };

  return {
    ...workoutSlice(c),
    ...planSlice(c),
    ...injuriesSlice(c),
    ...healthSlice(c),
    ...routinesSlice(c),
    ...historySlice(c),

    ready: false,
    events: [],
    profile: defaultProfile(),
    gyms: [],
    stats: derive([], Date.now()),

    async init() {
      const snap = await load();
      let profile = snap.profile ?? defaultProfile();
      setWeekStart(profile.training?.weekStart);
      // A new day: the length slider goes back to the lifter's default length.
      const minutes = minutesForToday(profile, Date.now());
      if (minutes) {
        profile = { ...profile, minutes };
        void saveRecord("profile", profile);
      }
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
      settleBodyweight();
      if (!get().autoEnd()) get().replan();
      void get()
        .importHealthBody()
        .catch(() => 0);
      void get()
        .importHealthDaily()
        .catch(() => 0);
    },

    importWorkouts(evs) {
      const have = new Set(get().events.map((e) => e.id));
      const fresh = evs.filter((e) => !have.has(e.id));
      if (fresh.length) commit(fresh);
      get().replan();
      return fresh.length;
    },

    restoreBackup(b) {
      const { profile, gyms, fresh } = mergeBackup(get(), b);
      setWeekStart(profile.training?.weekStart);
      set({ profile, gyms });
      void saveRecord("profile", profile);
      void saveRecord("gyms", gyms);
      if (fresh.length) commit(fresh);
      else set({ stats: derive(get().events, Date.now()) });
      settleBodyweight();
      get().replan();
      return fresh.length;
    },

    applySynced({ events: incoming, deleted, profile, gyms }) {
      const have = new Set(get().events.map((e) => e.id));
      const gone = new Set(deleted.filter((id) => have.has(id)));
      const fresh = incoming.filter((e) => !have.has(e.id) && !gone.has(e.id));
      if (fresh.length || gone.size) {
        registerCustom(fresh);
        const events = [...get().events.filter((e) => !gone.has(e.id)), ...fresh].sort((a, b) => a.at - b.at);
        set({ events, stats: derive(events, Date.now()) });
        if (fresh.length) void appendEvents(fresh, { remote: true });
        if (gone.size) void deleteEvents([...gone], { remote: true });
      }
      if (gyms) {
        set({ gyms });
        void saveRecord("gyms", gyms, { remote: true });
      }
      if (profile) {
        setWeekStart(profile.training?.weekStart);
        set({ profile, stats: derive(get().events, Date.now()) });
        void saveRecord("profile", profile, { remote: true });
      }
      settleBodyweight();
      if (fresh.length || gone.size || gyms || profile) get().replan();
    },

    checkin(buddies) {
      commit([{ type: "checkin", id: uid(), at: Date.now(), gymId: get().profile.activeGymId, buddies }]);
      track("feature", { name: "buddy_checkin", detail: String(buddies.length) });
    },

    notePro(now = Date.now()) {
      const month = proMonth(now);
      const id = `pro-${month}`;
      if (get().events.some((e) => e.id === id)) return;
      commit([{ type: "pro", id, at: now, month }]);
    },

    logStretch(moment, ids, seconds) {
      if (!ids.length) return;
      const now = Date.now();
      const secs = Math.round(seconds);
      // A cool-down belongs to the workout it follows (workouts with parts, sessions.ts).
      // A warm-up or cool-down done as a part of the workout in progress belongs to it.
      const live = get().active;
      const sessionId =
        live && (moment === "warm" || moment === "cool")
          ? live.sessionId
          : moment === "cool"
            ? coolDownHome(get().stats.sessions, now, secs)
            : undefined;
      commit([{ type: "stretch", id: uid(), at: now, moment, ids, seconds: secs, ...(sessionId ? { sessionId } : {}) }]);
      track("feature", { name: "stretch", detail: `${moment}:${ids.length}` });
    },

    async reset() {
      // Erasing the device signs it out (the account and its synced copy stay).
      void signOut();
      await eraseAll();
      persistActive(null);
      forgetAnalytics();
      forgetBilling();
      set({ events: [], profile: defaultProfile(), gyms: [], stats: derive([], Date.now()), active: null, preview: null });
    },
  };
});
