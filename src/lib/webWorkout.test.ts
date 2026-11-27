// The website's workout generator (docs/decisions/workout-generator.md): the code in its links, the workout the
// engine writes for each choice, the reasons the page shows, and the link that opens it in the app.
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { GEN_EN } from "@/locales/site/tools/gen/en";

import { hashFromLink } from "./appLinks";
import { available, EXERCISE_BY_ID } from "./exercises";
import { generatorHash } from "./genLink";
import { decodeRoutine } from "./routineShare";
import { EQUIPMENT } from "./types";
import {
  decodeGen,
  encodeGen,
  FOCUS_MUSCLES,
  GEN_DEFAULTS,
  GEN_FOCUS,
  GEN_GOALS,
  GEN_KITS,
  GEN_LEVELS,
  generateWeb,
  isTimed,
  kitEquipment,
  kitOf,
  optionsFromQuery,
  type GenOptions,
} from "./webWorkout";
import { genView } from "./webWorkoutView";

const SEED = 20261127;
const options = fc.record({
  equipment: fc.subarray([...EQUIPMENT]),
  minutes: fc.integer({ min: 3, max: 18 }).map((n) => n * 5),
  focus: fc.constantFrom(...GEN_FOCUS),
  goal: fc.constantFrom(...GEN_GOALS),
  level: fc.constantFrom(...GEN_LEVELS),
  pairs: fc.boolean(),
  seed: fc.integer({ min: 0, max: 36 ** 4 - 1 }),
});

describe("the code in a generator link", () => {
  it("gives back every choice", () => {
    fc.assert(
      fc.property(options, (o) => {
        const back = decodeGen(encodeGen(o))!;
        expect(back).toEqual({ ...o, equipment: EQUIPMENT.filter((e) => o.equipment.includes(e)) });
      }),
      { seed: SEED, numRuns: 200 },
    );
  });

  it("never crashes on junk and says no to it", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 60 }), (s) => {
        const o = decodeGen(s);
        if (o) expect(encodeGen(o)).toBe(s);
      }),
      { seed: SEED, numRuns: 300 },
    );
    for (const bad of [
      "",
      "2.1.45.0.0.1.0.1",
      "1.1.47.0.0.1.0.1",
      "1.1.45.99.0.1.0.1",
      "1.1.45.0.0.1.2.1",
      "1.-1.45.0.0.1.0.1",
      "1.zzzzzzzzzzzz.45.0.0.1.0.1",
    ])
      expect(decodeGen(bad), bad).toBeNull();
  });

  it("reads the page's own query too, dropping what it doesn't know", () => {
    const q = new URLSearchParams({
      eq: "dumbbells,bench,laser",
      min: "33",
      focus: "arms",
      goal: "strength",
      level: "new",
      pairs: "1",
      seed: "7",
    });
    expect(optionsFromQuery(q)).toEqual({
      equipment: ["dumbbells", "bench"],
      minutes: 35,
      focus: "arms",
      goal: "strength",
      level: "new",
      pairs: true,
      seed: 7,
    });
    expect(optionsFromQuery(new URLSearchParams({ w: encodeGen(GEN_DEFAULTS) }))).toEqual(GEN_DEFAULTS);
    expect(optionsFromQuery(new URLSearchParams({ w: "nope" }))).toBeNull();
  });

  it("knows the four presets", () => {
    for (const k of GEN_KITS) expect(kitOf(kitEquipment(k))).toBe(k);
    expect(kitOf(["barbell"])).toBeUndefined();
  });
});

describe("the workout", () => {
  it("is the same every time for the same link", () => {
    const a = generateWeb(GEN_DEFAULTS).plan;
    const b = generateWeb(decodeGen(encodeGen(GEN_DEFAULTS))!).plan;
    expect(b.items).toEqual(a.items);
    expect(a.week.deload).toBe(false);
  });

  it("changes with Another workout", () => {
    const ids = (o: GenOptions) => generateWeb(o).plan.items.map((i) => i.exerciseId);
    const seen = new Set([1, 2, 3, 4, 5].map((seed) => ids({ ...GEN_DEFAULTS, seed }).join()));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("uses only the equipment picked, only the area picked, and fits the time", () => {
    fc.assert(
      fc.property(options, (o) => {
        const { plan } = generateWeb(o);
        const can = new Set(available(o.equipment).map((e) => e.id));
        for (const i of plan.items) {
          expect(can.has(i.exerciseId), i.exerciseId).toBe(true);
          if (o.focus !== "full") for (const m of EXERCISE_BY_ID.get(i.exerciseId)!.primary) expect(FOCUS_MUSCLES[o.focus]).toContain(m);
        }
        expect(plan.estMinutes).toBeLessThanOrEqual(o.minutes);
      }),
      { seed: SEED, numRuns: 60 },
    );
  });

  it("writes a real workout for every preset and area", () => {
    for (const k of GEN_KITS)
      for (const focus of GEN_FOCUS) {
        const { plan } = generateWeb({ ...GEN_DEFAULTS, equipment: kitEquipment(k), focus });
        expect(plan.items.length, `${k} ${focus}`).toBeGreaterThan(0);
      }
  });

  it("pairs exercises into supersets when asked", () => {
    const { plan } = generateWeb({ ...GEN_DEFAULTS, pairs: true });
    expect(plan.items.some((i) => i.group)).toBe(true);
    expect(generateWeb(GEN_DEFAULTS).plan.items.some((i) => i.group)).toBe(false);
  });
});

describe("what the page shows", () => {
  it("gives every exercise its sets, rest, effort and a reason", () => {
    for (const focus of GEN_FOCUS) {
      const o = { ...GEN_DEFAULTS, focus };
      const v = genView(o, "en", GEN_EN);
      const plan = generateWeb(o).plan;
      expect(v.items.map((i) => i.id)).toEqual(plan.items.map((i) => i.exerciseId));
      v.items.forEach((it, k) => {
        expect(it.why).not.toMatch(/\{\w+\}/);
        expect(it.why.length).toBeGreaterThan(10);
        expect(it.scheme).toMatch(/^\d+ × \d+( s)?$/);
        expect(it.href).toBe(`/exercises/${it.id}/`);
        // A hold or carry is in seconds and never gets rep wording (AGENTS.md, Action over stats).
        if (isTimed(plan.items[k]!)) {
          expect(it.scheme).toMatch(/ s$/);
          expect(it.effort).toBe(GEN_EN.holdForm);
          expect(it.why).not.toMatch(/\breps?\b/);
        }
      });
    }
  });

  it("names the partner on the first exercise of a superset", () => {
    const v = genView({ ...GEN_DEFAULTS, pairs: true }, "en", GEN_EN);
    const first = v.items.findIndex((i) => i.superset);
    expect(v.items[first]!.why).toContain(`Back to back with ${v.items[first + 1]!.name}`);
    expect(v.items[first + 1]!.superset).toBe(v.items[first]!.superset);
  });

  it("names exercises in the page's language and links translated guides there", () => {
    const v = genView(GEN_DEFAULTS, "es", GEN_EN);
    expect(v.title).toBe("Cuerpo completo · 45 min");
    expect(v.items.some((i) => i.href.startsWith("/es/exercises/") || i.href.startsWith("/exercises/"))).toBe(true);
  });

  it("says so when the equipment can't fill the time", () => {
    const v = genView({ ...GEN_DEFAULTS, equipment: [], focus: "arms", minutes: 90 }, "en", GEN_EN);
    expect(v.short).toMatch(/^About \d+ minutes is all/);
  });

  it("opens the same workout in the app, without weights", () => {
    const v = genView(GEN_DEFAULTS, "en", GEN_EN);
    const code = new URL(v.appUrl).hash.replace("#/routine/", "");
    const r = decodeRoutine(code)!;
    const plan = generateWeb(GEN_DEFAULTS).plan;
    expect(r.name).toBe("Full body · 45 min");
    expect(r.items.map((i) => [i.exerciseId, i.sets])).toEqual(plan.items.map((i) => [i.exerciseId, i.sets]));
    expect(generatorHash(v.code)).toBe(`#/routine/${code}`);
  });
});

describe("a generator link on Android", () => {
  it("opens the workout as a routine, or Today without one", () => {
    const code = encodeGen(GEN_DEFAULTS);
    expect(hashFromLink(`https://www.getliftsmith.com/tools/workout-generator/?w=${code}`)).toBe(generatorHash(code));
    expect(hashFromLink(`https://www.getliftsmith.com/de/tools/workout-generator/?w=${code}`)).toBe(generatorHash(code));
    expect(hashFromLink("https://www.getliftsmith.com/tools/workout-generator/")).toBe("#/today");
    expect(hashFromLink("https://www.getliftsmith.com/tools/workout-generator/?w=junk")).toBe("#/today");
  });
});
