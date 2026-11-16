// @vitest-environment jsdom
// Program pages (docs/decisions/public-pages-and-seo.md "Program pages"): every program's real workouts from the
// engine, its own text in every language, the words around it in every language, and every page in the sitemap.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "@/lib/defaults";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { ogFile, PROGRAM_FIGURE } from "@/lib/ogImages";
import { programDays, PROGRAMS } from "@/lib/programs";
import { siteRoutes } from "@/lib/seo";
import { localPath, SITE_LANGS } from "@/lib/siteLang";
import { programLine } from "@/locales/site/fromApp";
import { PROGRAM_TEXT } from "@/locales/site/program";

import { programPath, ProgramsIndexView, programText, ProgramView, scheme } from "./ProgramView";

afterEach(cleanup);

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const strings = (o: unknown, path = ""): [string, string][] =>
  typeof o === "string"
    ? [[path, o]]
    : o && typeof o === "object"
      ? Object.entries(o).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
      : [];
const NOW = Date.UTC(2026, 0, 5);
const CTX = { profile: defaultProfile(NOW), gym: makeGym("commercial", "kg", "t"), events: [], now: NOW };

describe("program pages", () => {
  it("draws every fixed program's workouts from the engine, and none for the splits", () => {
    for (const p of PROGRAMS) {
      const days = programDays(p.id, CTX);
      if (p.kind === "split") expect(days, p.id).toBeNull();
      else {
        expect(days?.length, p.id).toBeGreaterThan(0);
        for (const d of days!) expect(d.items.length, p.id).toBeGreaterThan(0);
      }
    }
  });

  it("writes sets and reps the same way in every language", () => {
    const item = {
      exerciseId: "back-squat",
      sets: 5,
      restSec: 180,
      focus: "quads" as const,
      target: { weight: 60, reps: 5, rir: 2, note: "" },
    };
    expect(scheme("de", item)).toBe("5 × 5");
    const amrap = {
      ...item,
      setTargets: [3, 3, 3, 3].map((reps) => ({ weight: 60, reps })).concat([{ weight: 60, reps: 3, amrap: true } as never]),
    };
    expect(scheme("ja", amrap)).toBe("5 × 3+");
  });

  it("has every program's own text in every language", () => {
    for (const lang of SITE_LANGS)
      for (const p of PROGRAMS) {
        const w = programText(lang, p);
        expect(w.name, `${lang} ${p.id}`).not.toBe("");
        expect(w.summary, `${lang} ${p.id}`).not.toBe("");
        expect(w.how.every(Boolean), `${lang} ${p.id}`).toBe(true);
      }
    expect(programLine("es", "Workout A")).not.toBeNull();
  });

  it("has every line in every language, with English's placeholders", () => {
    const en = new Map(strings(PROGRAM_TEXT.en));
    for (const lang of SITE_LANGS) {
      const local = new Map(strings(PROGRAM_TEXT[lang]));
      expect([...local.keys()].sort(), lang).toEqual([...en.keys()].sort());
      for (const [k, v] of local) {
        if (k !== "englishLinks") expect(v.trim(), `${lang} ${k}`).not.toBe("");
        expect(holes(v), `${lang} ${k}`).toEqual(holes(en.get(k)!));
      }
    }
  });

  it("puts every copy in the sitemap with all ten languages, with a lift's card", () => {
    const routes = new Map(siteRoutes().map((r) => [r.path, r]));
    for (const path of ["/programs/", ...PROGRAMS.map((p) => programPath(p.id))])
      for (const lang of SITE_LANGS) {
        const r = routes.get(localPath(lang, path));
        expect(r && Object.keys(r.languages ?? {}).length, `${lang} ${path}`).toBe(11);
      }
    for (const id of Object.values(PROGRAM_FIGURE)) expect(EXERCISE_BY_ID.has(id!), id).toBe(true);
    expect(ogFile("/fr/programs/classic-5x5/")).toBe("exercises/back-squat.jpg");
  });

  it("draws a program with its workouts, what it trains and its questions", () => {
    render(<ProgramView lang="en" id="classic-5x5" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Classic 5×5");
    expect(screen.getByRole("heading", { name: "Workout A" })).toBeTruthy();
    expect(screen.getAllByText("Back squat").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "What it trains most" })).toBeTruthy();
  });

  // One test per language, so ten languages stay well inside the 20 s limit under coverage.
  it.each(SITE_LANGS)("draws every program in %s without a missing line", (lang) => {
    for (const p of PROGRAMS) {
      const { container } = render(<ProgramView lang={lang} id={p.id} />);
      expect(container.textContent, `${lang} ${p.id}`).not.toMatch(/\{\w+\}|undefined|NaN/);
      cleanup();
    }
  });

  it("draws the programs index", () => {
    render(<ProgramsIndexView lang="ja" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PROGRAM_TEXT.ja.index.h1);
  });
});
