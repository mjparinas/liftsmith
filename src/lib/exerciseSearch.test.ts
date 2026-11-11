// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeTestGym } from "../test/factories";
import { defaultProfile } from "./defaults";
import { exercise } from "./exercises";
import { fold, searchExercises } from "./exerciseSearch";
import { alternatives } from "./generator";
import { setLanguage } from "./i18n";
import { useApp } from "./store";

// The shared exercise browser (Melvin, 2026-11-11: "some kind of search or organization or both").

describe("searching the library", () => {
  afterEach(() => setLanguage("en"));

  it("matches every word against names, muscles and equipment, names starting with the word first", () => {
    const hits = searchExercises({ text: "kettlebell swing" });
    expect(hits.map((e) => e.id)).toContain("kb-swing");
    expect(hits.every((e) => /kettlebell/i.test(e.name + e.needs.join(" ")))).toBe(true);
    const press = searchExercises({ text: "press" });
    expect(press[0]!.name.toLowerCase().startsWith("press")).toBe(press.some((e) => e.name.toLowerCase().startsWith("press")));
    expect(searchExercises({ text: "treadmill" }).map((e) => e.id)).toEqual(expect.arrayContaining(["treadmill-run", "incline-walk"]));
  });

  it("filters by main muscle, by cardio and by what the gym has", () => {
    const glutes = searchExercises({ group: "glutes" });
    expect(glutes.length).toBeGreaterThan(10);
    expect(glutes.every((e) => e.primary.includes("glutes"))).toBe(true);
    const cardio = searchExercises({ group: "cardio" });
    expect(cardio.length).toBeGreaterThanOrEqual(15);
    expect(cardio.every((e) => e.cardio)).toBe(true);
    const bodyweight = searchExercises({ equipment: [] });
    expect(bodyweight.every((e) => e.needs.length === 0)).toBe(true);
    expect(searchExercises({ skip: ["back-squat"] }).some((e) => e.id === "back-squat")).toBe(false);
  });

  it("ignores accents and finds the English name in another language", () => {
    expect(fold("Écarté presión")).toBe("ecarte presion");
    setLanguage("es");
    const name = exercise("bench-press").name;
    expect(name).not.toBe("Barbell bench press");
    expect(searchExercises({ text: fold(name) }).map((e) => e.id)).toContain("bench-press");
    expect(searchExercises({ text: "bench press" }).map((e) => e.id)).toContain("bench-press");
  });

  it("never offers cardio as a swap for strength, or the other way round", () => {
    const gym = makeTestGym("commercial");
    expect(alternatives("back-squat", gym).some((e) => e.cardio)).toBe(false);
    expect(alternatives("treadmill-run", gym).every((e) => e.cardio)).toBe(true);
  });
});

describe("adding an exercise to a workout", () => {
  const T = new Date("2026-11-11T18:00:00").getTime();
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(T - 3 * 86400_000), onboarded: true, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  it("puts it at the end, cardio as one set, and goes to it when everything else is done", () => {
    const s = useApp.getState;
    s().start();
    const n = s().active!.plan.items.length;
    s().addExercise("rowing-machine");
    const items = s().active!.plan.items;
    expect(items).toHaveLength(n + 1);
    expect(items.at(-1)).toMatchObject({ exerciseId: "rowing-machine", sets: 1 });
    expect(s().active!.index).toBe(0);
    useApp.setState({ active: { ...s().active!, index: items.length } });
    s().addExercise("db-curl");
    expect(s().active!.index).toBe(items.length);
    expect(s().active!.plan.items.at(-1)).toMatchObject({ exerciseId: "db-curl", sets: 3 });
  });
});
