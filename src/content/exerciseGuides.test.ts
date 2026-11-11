import { describe, expect, it } from "vitest";

import { exerciseMeta } from "@/lib/exerciseMeta";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { siteRoutes } from "@/lib/seo";
import { hasStartTable, startTable } from "@/lib/startTable";

import { COMPETITORS } from "./compare";
import { EXERCISE_GUIDES } from "./exerciseGuides";

const guides = Object.entries(EXERCISE_GUIDES);
const paths = new Set(siteRoutes().map((r) => r.path));

describe("exercise guides", () => {
  it("are for exercises in the library", () => {
    for (const [id] of guides) expect(EXERCISE_BY_ID.has(id), id).toBe(true);
  });

  it("each have an intro, three mistakes, sets and reps, variations and two questions", () => {
    for (const [id, g] of guides) {
      expect(g.intro.length, id).toBeGreaterThan(80);
      expect(g.mistakes.length, id).toBeGreaterThanOrEqual(3);
      expect(g.sets.length, id).toBeGreaterThanOrEqual(1);
      expect(g.variations.length, id).toBeGreaterThanOrEqual(2);
      expect(g.faq.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("name only other exercises in the library as variations", () => {
    for (const [id, g] of guides)
      for (const [v] of g.variations) {
        expect(EXERCISE_BY_ID.has(v), `${id} → ${v}`).toBe(true);
        expect(v, id).not.toBe(id);
      }
  });

  it("link only to pages that exist", () => {
    for (const [id, g] of guides)
      for (const m of JSON.stringify(g).matchAll(/\]\((\/[^)#]*)/g)) expect(paths.has(m[1]!), `${id} → ${m[1]}`).toBe(true);
  });

  it("never name another app or a trademarked program, and use Canadian spelling", () => {
    for (const [id, g] of guides) {
      const text = JSON.stringify(g);
      for (const c of COMPETITORS) expect(new RegExp(`\\b${c.name}\\b`).test(text), `${id} names ${c.name}`).toBe(false);
      expect(/stronglifts|starting strength|5\/3\/1|wendler/i.test(text), id).toBe(false);
      expect(/\b(color|favorite|center|meter|leveled|canceled|gray)s?\b/i.test(text), id).toBe(false);
    }
  });

  it("keep page titles and descriptions to search-result length", () => {
    for (const [id] of guides) {
      const m = exerciseMeta(EXERCISE_BY_ID.get(id)!);
      expect(m.title.length, id).toBeLessThanOrEqual(65);
      expect(m.description.length, id).toBeLessThanOrEqual(160);
    }
  });
});

describe("starting weights", () => {
  const ex = (id: string) => EXERCISE_BY_ID.get(id)!;

  it("are shown for loaded lifts, not bodyweight moves or carries", () => {
    expect(hasStartTable(ex("back-squat"))).toBe(true);
    expect(hasStartTable(ex("db-curl"))).toBe(true);
    expect(hasStartTable(ex("push-up"))).toBe(false);
    expect(hasStartTable(ex("farmers-carry"))).toBe(false);
  });

  it("rise with experience and are lighter for the example woman", () => {
    const [newer, some] = startTable(ex("back-squat"));
    const kg = (c: unknown) => (c as { kg: number }).kg;
    expect(kg(some!.men)).toBeGreaterThan(kg(newer!.men));
    expect(kg(newer!.women)).toBeLessThan(kg(newer!.men));
  });

  it("round to plates and dumbbells you can actually load", () => {
    for (const [id] of guides) {
      const e = ex(id);
      if (!hasStartTable(e)) continue;
      for (const row of startTable(e))
        for (const c of [row.women, row.men]) {
          if (c === "bar") continue;
          const step = e.load === "dumbbell" || e.load === "kettlebell" ? (c.kg < 10 ? 1 : 2) : 2.5;
          expect(Math.abs(c.kg / step - Math.round(c.kg / step)), `${id} ${c.kg}`).toBeLessThan(1e-9);
          expect(c.lb % 1, id).toBe(0);
        }
    }
  });

  it("say the empty bar when a barbell start is under 20 kg", () => {
    expect(startTable(ex("barbell-curl"))[0]!.women).toBe("bar");
  });
});
