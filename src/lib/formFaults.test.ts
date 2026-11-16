import { describe, expect, it } from "vitest";

import { en } from "@/locales/text/ff";

import { EXERCISES } from "./exercises";
import { faultIdsFor, FAULTS, formCheckId, stretchFaultIds } from "./formFaults";
import { STRETCHES } from "./stretches";

describe("form faults", () => {
  it("give every exercise two or three different mistakes", () => {
    for (const e of EXERCISES) {
      const ids = faultIdsFor(e);
      expect(ids.length, e.id).toBeGreaterThanOrEqual(2);
      expect(ids.length, e.id).toBeLessThanOrEqual(3);
      expect(new Set(ids).size, e.id).toBe(ids.length);
    }
  });

  it("give every stretch two or three mistakes", () => {
    for (const s of STRETCHES) expect(stretchFaultIds(s).length, s.id).toBeGreaterThanOrEqual(2);
  });

  it("use every fault in the library, and every fault has its three lines", () => {
    const used = new Set([...EXERCISES.flatMap((e) => faultIdsFor(e)), ...STRETCHES.flatMap((s) => stretchFaultIds(s))]);
    for (const id of FAULTS) {
      expect(used.has(id), id).toBe(true);
      for (const k of [`ff.${id}`, `ff.${id}.fix`, `ff.${id}.why`]) expect(en[k as keyof typeof en], k).toBeTruthy();
    }
    // No catalogue line for a fault that isn't in the library.
    const ids = new Set<string>(FAULTS);
    for (const k of Object.keys(en)) {
      const id = k.split(".")[1]!;
      if (!["title", "howTo", "watchFor", "check", "checkLine", "setting", "settingHint"].includes(id)) expect(ids.has(id), k).toBe(true);
    }
  });

  it("match the lift: squats, deadlifts, pull-ups, jumps and curls get their own mistakes", () => {
    const of = (id: string) => faultIdsFor(EXERCISES.find((e) => e.id === id)!);
    expect(of("back-squat")).toContain("kneesIn");
    expect(of("deadlift")).toContain("roundBack");
    expect(of("pull-up")).toContain("kip");
    expect(of("box-jump")).toContain("stiffLanding");
    expect(of("barbell-curl")).toContain("swing");
    expect(of("bench-press")).toContain("elbowsFlare");
    expect(of("kb-swing")).toContain("squatSwing");
    // Triceps kickbacks are an arm move; glute kickbacks a hip one.
    expect(of("db-kickback")).not.toContain("kickArch");
    expect(of("cable-kickback")).toContain("kickArch");
    // A barbell hack squat has no pad to peel off.
    expect(of("barbell-hack-squat")).not.toContain("padLift");
  });

  it("rotate the rest timer's form check through the exercise's mistakes, set by set", () => {
    const ex = EXERCISES.find((e) => e.id === "back-squat")!;
    const ids = faultIdsFor(ex);
    expect(formCheckId(ex, 1)).toBe(ids[0]);
    expect(formCheckId(ex, 2)).toBe(ids[1]);
    expect(formCheckId(ex, ids.length + 1)).toBe(ids[0]);
    expect(formCheckId(ex, 0)).toBe(ids[0]);
  });
});
