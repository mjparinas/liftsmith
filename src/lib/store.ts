"use client";
import { create } from "zustand";
import { defaultProfile, makeGym, type GymPreset } from "./defaults";
import { derive, type Stats } from "./derive";
import { generate, type Plan, type PlanItem } from "./generator";
import { appendEvents, deleteEvents, eraseAll, load, saveRecord } from "./localdb";
import { target } from "./progression";
import { exercise } from "./exercises";
import type { AppEvent, Gym, Profile, Rating } from "./types";

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
  hr: number[];
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
  feedback(r: Rating): void;
  swap(toId: string, avoid: boolean): void;
  goTo(index: number): void;
  finish(): AppEvent | null;
  discard(): void;
  pushHr(bpm: number): void;
  reset(): Promise<void>;
}

const ACTIVE_KEY = "liftsmith.active";
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
    const events = [...get().events, ...evs];
    set({ events, stats: derive(events, Date.now()) });
    void appendEvents(evs);
  };
  const gym = () => get().gyms.find((g) => g.id === get().profile.activeGymId) ?? get().gyms[0];
  const loadItem = (a: Active, index: number): Active => {
    const item = a.plan.items[index];
    if (!item) return { ...a, index };
    return { ...a, index, weight: item.target.weight, reps: item.target.reps };
  };

  return {
    ready: false,
    events: [],
    profile: defaultProfile(),
    gyms: [],
    stats: derive([], Date.now()),
    active: null,
    preview: null,

    async init() {
      const snap = await load();
      const profile = snap.profile ?? defaultProfile();
      let active: Active | null = null;
      try {
        const raw = localStorage.getItem(ACTIVE_KEY);
        if (raw) active = JSON.parse(raw);
      } catch {}
      set({ ready: true, events: snap.events, profile, gyms: snap.gyms, stats: derive(snap.events, Date.now()), active });
      get().replan();
    },

    setProfile(p) {
      const profile = { ...get().profile, ...p, updatedAt: Date.now() };
      set({ profile });
      void saveRecord("profile", profile);
      if ("minutes" in p || "activeGymId" in p || "variability" in p || "goal" in p || "experience" in p) get().replan();
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
      const { profile, events } = get();
      set({ preview: generate({ gym: g, profile, events, minutes: profile.minutes, now: Date.now() }) });
    },

    start() {
      const plan = get().preview;
      const g = gym();
      if (!plan || !g || !plan.items.length) return;
      const sessionId = uid();
      const a = loadItem({ sessionId, startedAt: Date.now(), plan, index: 0, weight: 0, reps: 0, restUntil: null, restTotal: 0, askFeedback: null, hr: [] }, 0);
      commit([{ type: "sessionStart", id: uid(), at: Date.now(), sessionId, gymId: g.id, minutes: plan.minutes }]);
      set({ active: a });
      persistActive(a);
    },

    logSet() {
      const a = get().active;
      if (!a) return;
      const item = a.plan.items[a.index];
      if (!item) return;
      const now = Date.now();
      commit([{ type: "set", id: uid(), at: now, sessionId: a.sessionId, exerciseId: item.exerciseId, weight: a.weight, reps: a.reps, targetReps: item.target.reps, rir: item.target.rir }]);
      const done = setsDone(get().events, a.sessionId, item.exerciseId);
      let next: Active = { ...a };
      if (done >= item.sets) {
        // Exercise finished: ask how it felt and move on.
        next = loadItem({ ...a, askFeedback: item.exerciseId }, Math.min(a.index + 1, a.plan.items.length));
      }
      const last = next.index >= a.plan.items.length;
      next.restTotal = last ? 0 : item.restSec;
      next.restUntil = last ? null : now + item.restSec * 1000;
      set({ active: next });
      persistActive(next);
    },

    adjust(weight, reps) {
      const a = get().active;
      if (!a) return;
      const next = { ...a, weight: Math.max(0, weight), reps: Math.max(1, reps) };
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

    skipRest() {
      const a = get().active;
      if (!a) return;
      const next = { ...a, restUntil: null };
      set({ active: next });
      persistActive(next);
    },

    feedback(rating) {
      const a = get().active;
      if (!a?.askFeedback) return;
      if (rating !== 0) commit([{ type: "feedback", id: uid(), at: Date.now(), sessionId: a.sessionId, exerciseId: a.askFeedback, rating }]);
      const next = { ...a, askFeedback: null };
      set({ active: next });
      persistActive(next);
    },

    swap(toId, avoid) {
      const a = get().active;
      const g = gym();
      if (!a || !g) return;
      const item = a.plan.items[a.index];
      const t = target(exercise(toId), get().events, get().profile, g, Date.now());
      const done = setsDone(get().events, a.sessionId, item.exerciseId);
      const newItem: PlanItem = { ...item, exerciseId: toId, target: t, sets: Math.max(1, item.sets - done) };
      const items = [...a.plan.items];
      items[a.index] = newItem;
      commit([{ type: "swap", id: uid(), at: Date.now(), sessionId: a.sessionId, from: item.exerciseId, to: toId, avoid }]);
      const next = loadItem({ ...a, plan: { ...a.plan, items } }, a.index);
      set({ active: next });
      persistActive(next);
    },

    goTo(index) {
      const a = get().active;
      if (!a) return;
      const next = loadItem(a, index);
      set({ active: next });
      persistActive(next);
    },

    finish() {
      const a = get().active;
      if (!a) return null;
      const hr = a.hr;
      const end: AppEvent = {
        type: "sessionEnd",
        id: uid(),
        at: Date.now(),
        sessionId: a.sessionId,
        seconds: Math.round((Date.now() - a.startedAt) / 1000),
        avgHr: hr.length ? Math.round(hr.reduce((s, x) => s + x, 0) / hr.length) : undefined,
        maxHr: hr.length ? Math.max(...hr) : undefined,
      };
      commit([end]);
      set({ active: null });
      persistActive(null);
      get().replan();
      return end;
    },

    discard() {
      const a = get().active;
      if (!a) return;
      const ids = get().events.filter((e) => "sessionId" in e && e.sessionId === a.sessionId).map((e) => e.id);
      const events = get().events.filter((e) => !ids.includes(e.id));
      set({ events, stats: derive(events, Date.now()), active: null });
      void deleteEvents(ids);
      persistActive(null);
      get().replan();
    },

    pushHr(bpm) {
      const a = get().active;
      if (!a) return;
      // Keep one sample every few seconds at most; the store re-renders on each.
      const hr = [...a.hr, bpm].slice(-5000);
      set({ active: { ...a, hr } });
    },

    async reset() {
      await eraseAll();
      persistActive(null);
      set({ events: [], profile: defaultProfile(), gyms: [], stats: derive([], Date.now()), active: null, preview: null });
    },
  };
});
