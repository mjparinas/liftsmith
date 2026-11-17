import { describe, expect, it } from "vitest";

import { ARTICLES } from "@/content/articles";

import { alternativesMeta, articlesLinking, exerciseFaq, exerciseMeta, fit, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "./exerciseMeta";
import { EXERCISE_BY_ID, EXERCISES } from "./exercises";

const ex = (id: string) => EXERCISE_BY_ID.get(id)!;

describe("exercise page titles for search", () => {
  it("fit search-result length on every exercise and alternatives page", () => {
    for (const e of EXERCISES) {
      const m = exerciseMeta(e);
      const a = alternativesMeta(e);
      expect(m.title.length, e.id).toBeLessThanOrEqual(SEO_TITLE_MAX);
      expect(m.description.length, e.id).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
      expect(a.title.length, e.id).toBeLessThanOrEqual(SEO_TITLE_MAX);
      expect(a.description.length, e.id).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
    }
  });

  it("say what the searcher is after: how to, muscles, alternatives", () => {
    expect(exerciseMeta(ex("box-squat")).title).toBe("Box squat: how to do it, muscles worked, 12 alternatives");
    expect(exerciseMeta(ex("db-row")).title).toMatch(/^One-arm dumbbell row: how to.*sets and reps$/);
    expect(exerciseMeta(ex("towel-row")).description).toMatch(/works the upper back and lats/);
    expect(exerciseMeta(ex("towel-row")).description).toMatch(/No equipment needed/);
  });

  it("name the best swaps in the alternatives description", () => {
    const m = alternativesMeta(ex("db-row"));
    expect(m.title).toMatch(/best one-arm dumbbell row alternatives/);
    expect(m.description).toMatch(/^Can't do the one-arm dumbbell row\? Try the /);
  });

  it("picks the first candidate that fits, else the shortest", () => {
    expect(fit(["a long one", "short"], 6)).toBe("short");
    expect(fit(["toolong", "tooolong"], 3)).toBe("toolong");
  });
});

describe("exercise questions", () => {
  it("answer muscles, equipment and swaps from the exercise's data", () => {
    const faq = exerciseFaq(ex("towel-row"));
    expect(faq.map(([q]) => q)).toEqual([
      "What muscles does the doorway towel row work?",
      "What equipment do you need for the doorway towel row?",
      "What can I do instead of the doorway towel row?",
    ]);
    expect(faq[1]![1]).toMatch(/^None/);
    expect(exerciseFaq(ex("box-squat"))[1]![1]).not.toMatch(/^None/);
  });

  it("find the articles that link to an exercise", () => {
    const path = "/exercises/back-squat/";
    const found = articlesLinking(path, 50);
    expect(found.length).toBeGreaterThan(0);
    for (const a of found) expect(JSON.stringify(a.body)).toContain(`(${path})`);
    expect(found.length).toBe(ARTICLES.filter((a) => JSON.stringify(a.body).includes(`(${path})`)).length);
  });
});
