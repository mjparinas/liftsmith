// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProfile, makeGym, switchGymUnit } from "./defaults";
import { derive, setWeekStart, weekOf } from "./derive";
import { exercise } from "./exercises";
import { alternatives, generate, restFor } from "./generator";
import { repRange, target } from "./progression";
import { dayKey } from "./random";
import { useApp } from "./store";
import {
  effortAim,
  effortChoices,
  effortLabel,
  MAX_PRIORITIES,
  minutesForToday,
  restAlertOf,
  rpeOf,
  toggleFavourite,
  togglePriority,
  withExercisePrefs,
} from "./training";
import type { Profile, SetEvent, TrainingPrefs } from "./types";

// Workout preferences (Melvin, 2026-11-09): rest times, rep ranges and set counts, RIR or RPE, the
// rest timer, favourites, muscle priorities, the default length, the first day of the week, kg/lb.

const NOW = new Date("2026-11-11T18:00:00").getTime(); // a Wednesday
const D = 86400_000;
const gym = makeGym("commercial", "kg", "g1");
const profile = (training?: TrainingPrefs): Profile => ({ ...defaultProfile(NOW), onboarded: true, activeGymId: "g1", training });
const plan = (training?: TrainingPrefs, minutes = 60) => generate({ gym, profile: profile(training), events: [], minutes, now: NOW });

describe("rest times", () => {
  const squat = exercise("back-squat");
  const curl = exercise("db-curl");
  it("uses the goal's default when nothing is set", () => {
    expect(restFor(squat, "strength")).toBe(180);
    expect(restFor(curl, "muscle")).toBe(75);
  });
  it("uses the compound or isolation default, then the exercise's own", () => {
    const t: TrainingPrefs = { rest: { compound: 240, isolation: 45 } };
    expect(restFor(squat, "muscle", t)).toBe(240);
    expect(restFor(curl, "muscle", t)).toBe(45);
    expect(restFor(squat, "muscle", withExercisePrefs(t, "back-squat", { rest: 300 }))).toBe(300);
  });
  it("puts the rest into the plan", () => {
    const p = plan({ rest: { compound: 150, isolation: 60 } });
    for (const i of p.items) expect(i.restSec).toBe(exercise(i.exerciseId).compound ? 150 : 60);
  });
});

describe("rep ranges", () => {
  it("prefers the exercise's own range, then the type's, then the goal's", () => {
    const squat = exercise("back-squat");
    expect(repRange(squat, "muscle")).toEqual([6, 10]);
    expect(repRange(squat, "muscle", { reps: { compound: [3, 5] } })).toEqual([3, 5]);
    expect(repRange(squat, "muscle", { reps: { compound: [3, 5] }, exercises: { "back-squat": { reps: [5, 8] } } })).toEqual([5, 8]);
  });
  it("leaves bodyweight work and holds alone", () => {
    expect(repRange(exercise("push-up"), "muscle", { reps: { compound: [3, 5] } })).toEqual([6, 15]);
    expect(repRange(exercise("plank"), "muscle", { exercises: { plank: { reps: [5, 8] } } })).toEqual([20, 45]);
  });
  it("drives the first target and progression", () => {
    const p = profile({ reps: { compound: [3, 5] } });
    expect(target(exercise("back-squat"), [], p, gym, NOW).reps).toBe(3);
    // Every set at the top of the custom range: weight goes up, reps back to the bottom.
    const sets: SetEvent[] = [0, 1, 2].map((i) => ({ type: "set", id: `s${i}`, at: NOW - D + i, sessionId: "a", exerciseId: "back-squat", weight: 100, reps: 5, targetReps: 5, rir: 2 }));
    const t = target(exercise("back-squat"), sets, p, gym, NOW);
    expect(t.reps).toBe(3);
    expect(t.weight).toBeGreaterThan(100);
  });
});

describe("set counts", () => {
  it("uses the lifter's set count and adds no filler sets", () => {
    const p = plan({ sets: 2 }, 90);
    expect(p.items.length).toBeGreaterThan(0);
    for (const i of p.items) expect(i.sets).toBe(2);
  });
  it("lets one exercise have its own count", () => {
    const auto = plan(undefined, 60);
    const first = auto.items[0].exerciseId;
    const p = plan({ exercises: { [first]: { sets: 5 } } }, 60);
    expect(p.items.find((i) => i.exerciseId === first)?.sets).toBe(5);
  });
});

describe("favourites and priorities", () => {
  it("plans a favourite that fits the day", () => {
    const auto = plan(undefined, 60);
    const used = new Set(auto.items.map((i) => i.exerciseId));
    const focus = auto.items[0].focus;
    // Another exercise for the same muscle at this gym, not in today's plan.
    const first = exercise(auto.items[0].exerciseId);
    const alt = alternatives(first.id, gym).find((e) => !used.has(e.id) && e.primary.every((m) => first.primary.includes(m)) && e.primary.includes(focus))?.id;
    expect(alt, `an alternative for ${focus}`).toBeDefined();
    const p = plan({ favourites: [alt!] }, 60);
    expect(p.items.map((i) => i.exerciseId)).toContain(alt);
  });
  it("gives priority muscles more sets", () => {
    const sets = (t?: TrainingPrefs) => plan(t, 60).items.filter((i) => exercise(i.exerciseId).primary.includes("calves")).reduce((n, i) => n + i.sets, 0);
    expect(sets({ priorities: ["calves"] })).toBeGreaterThan(sets());
  });
  it("keeps at most three priorities and toggles favourites", () => {
    let t: TrainingPrefs | undefined;
    for (const m of ["chest", "lats", "quads", "calves"] as const) t = togglePriority(t, m);
    expect(t!.priorities).toHaveLength(MAX_PRIORITIES);
    expect(t!.priorities).not.toContain("chest");
    expect(togglePriority(t, "lats").priorities).toEqual(["quads", "calves"]);
    const f = toggleFavourite(undefined, "back-squat");
    expect(f.favourites).toEqual(["back-squat"]);
    expect(toggleFavourite(f, "back-squat").favourites).toEqual([]);
  });
  it("removes an exercise's overrides when all are cleared", () => {
    const t = withExercisePrefs(undefined, "back-squat", { rest: 120, sets: 4 });
    expect(t.exercises?.["back-squat"]).toEqual({ rest: 120, sets: 4 });
    expect(withExercisePrefs(t, "back-squat", { rest: undefined, sets: undefined }).exercises).toEqual({});
  });
});

describe("effort scale", () => {
  it("shows RIR or RPE", () => {
    expect(rpeOf(2)).toBe(8);
    expect(effortLabel(2, "rir")).toBe("RIR 2");
    expect(effortLabel(2, "rpe")).toBe("RPE 8");
    expect(effortAim(1, undefined)).toBe("Leave 1 rep in the tank");
    expect(effortAim(0, "rpe")).toBe("Aim for RPE 10");
    expect(effortChoices("rpe").map((c) => c.label)).toEqual(["10", "9", "8", "7", "≤6"]);
    expect(effortChoices("rpe").map((c) => c.rir)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("rest-over alert", () => {
  it("follows Sounds and Vibration until the lifter picks", () => {
    expect(restAlertOf({ restSounds: false, haptics: true })).toEqual({ sound: false, vibrate: true });
    expect(restAlertOf({ restSounds: false, haptics: false, training: { restAlert: "both" } })).toEqual({ sound: true, vibrate: true });
    expect(restAlertOf({ restSounds: true, training: { restAlert: "vibrate" } })).toEqual({ sound: false, vibrate: true });
    expect(restAlertOf({ restSounds: true, training: { restAlert: "silent" } })).toEqual({ sound: false, vibrate: false });
  });
});

describe("default workout length", () => {
  it("comes back on a new day, not after the slider moved today", () => {
    const p = { minutes: 30, training: { minutes: 60 } };
    expect(minutesForToday({ ...p, minutesDay: dayKey(NOW - D) }, NOW)).toBe(60);
    expect(minutesForToday({ ...p, minutesDay: dayKey(NOW) }, NOW)).toBeUndefined();
    expect(minutesForToday({ minutes: 30 }, NOW)).toBeUndefined();
  });
});

describe("first day of the week", () => {
  afterEach(() => setWeekStart(1));
  it("starts weeks on Monday by default and on Sunday when picked", () => {
    expect(new Date(weekOf(NOW)).getDay()).toBe(1);
    setWeekStart(0);
    expect(new Date(weekOf(NOW)).getDay()).toBe(0);
  });
  it("changes which workouts share a week in the streak", () => {
    // Sunday then Monday: two Monday-start weeks, one Sunday-start week.
    const sun = new Date("2026-11-08T10:00:00").getTime();
    const mon = sun + D;
    const ev: SetEvent[] = [sun, mon].map((at, i) => ({ type: "set", id: `w${i}`, at, sessionId: `w${i}`, exerciseId: "back-squat", weight: 100, reps: 5, targetReps: 5, rir: 2 }));
    expect(derive(ev, mon + 1000).weekStreak).toBe(2);
    setWeekStart(0);
    expect(derive(ev, mon + 1000).weekStreak).toBe(1);
  });
});

describe("kg and lb gyms", () => {
  it("swaps the kit for the other unit and keeps the rest", () => {
    const lb = switchGymUnit({ ...gym, place: { lat: 1, lon: 2, radiusM: 100 } }, "lb");
    expect(lb.unit).toBe("lb");
    expect(lb.plates.some((p) => p.weight === 45)).toBe(true);
    expect(lb.bars[0].weight).toBe(45);
    expect(lb.equipment).toEqual(gym.equipment);
    expect(lb.place).toEqual({ lat: 1, lon: 2, radiusM: 100 });
    expect(switchGymUnit(lb, "lb")).toBe(lb);
  });
});

describe("rest timer auto-start", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...profile(), activeGymId: id });
  });
  afterEach(() => vi.useRealTimers());

  it("starts by itself by default", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    s().logSet();
    expect(s().active!.restUntil).toBeGreaterThan(NOW);
    expect(s().active!.restReady).toBeUndefined();
  });

  it("waits for Start rest when auto-start is off, and still counts rest from Log set", () => {
    const s = useApp.getState;
    s().setProfile({ training: { autoRest: false } });
    s().start();
    s().skipWarmup();
    vi.setSystemTime(NOW + 30_000);
    s().logSet();
    const rest = s().active!.plan.items[0].restSec;
    expect(s().active!.restUntil).toBeNull();
    expect(s().active!.restReady).toBe(rest);
    vi.setSystemTime(NOW + 40_000);
    s().startRest();
    expect(s().active!.restUntil).toBe(NOW + 40_000 + rest * 1000);
    expect(s().active!.restReady).toBeUndefined();
    vi.setSystemTime(NOW + 40_000 + rest * 1000);
    s().skipRest();
    vi.setSystemTime(NOW + 70_000 + rest * 1000);
    s().logSet();
    const second = s().events.filter((e): e is SetEvent => e.type === "set")[1];
    expect(second.restSec).toBe(rest + 10);
  });
});
