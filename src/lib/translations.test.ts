import { afterEach, describe, expect, it } from "vitest";

import { en } from "@/locales/text/ex";

import { defaultProfile, makeGym } from "./defaults";
import { ENGLISH_ROWS, englishName, exercise, EXERCISES } from "./exercises";
import { alternatives, generate } from "./generator";
import { setLanguage } from "./i18n";

// Text that lives outside the catalogues' usual path. The exercise library's text follows the app's language (src/locales/text/ex.ts), while the rows in
// exercises.ts stay the English source and anything that must not depend on the language reads them.

const NOW = new Date("2026-11-11T18:00:00").getTime();
afterEach(() => setLanguage("system"));

describe("exercise text", () => {
  it("the English catalogue matches the library's rows exactly", () => {
    const fromRows: Record<string, string> = {};
    for (const r of ENGLISH_ROWS) {
      fromRows[`ex.${r.id}`] = r.name;
      fromRows[`ex.${r.id}.setup`] = r.setup;
      r.cues.forEach((c, i) => (fromRows[`ex.${r.id}.cue${i + 1}`] = c));
    }
    expect(en).toEqual(fromRows);
  });

  it("names, setup and cues follow the language, and English stays the source", () => {
    setLanguage("es");
    expect(exercise("bench-press").name).toBe("Press de banca con barra");
    expect(exercise("deadlift").cues[0]).toBe("Empuja el suelo");
    expect(englishName(exercise("bench-press"))).toBe("Barbell bench press");
    setLanguage("fr");
    expect(exercise("back-squat").name).toBe("Squat arrière");
    expect(exercise("back-squat").setup).toContain("Barre sur le haut du dos");
    setLanguage("en");
    expect(exercise("bench-press").name).toBe("Barbell bench press");
  });

  it("every built-in exercise has a Spanish and French name different enough to be real text", () => {
    for (const lang of ["es", "fr"] as const) {
      setLanguage(lang);
      for (const e of EXERCISES) {
        expect(e.name.length, e.id).toBeGreaterThan(2);
        expect(e.cues.length, e.id).toBe(ENGLISH_ROWS.find((r) => r.id === e.id)!.cues.length);
      }
    }
  });

  it("plans and swaps are the same in every language", () => {
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), onboarded: true, activeGymId: "g" };
    const run = () => ({
      plan: generate({ gym, profile, events: [], minutes: 60, now: NOW }).items.map((i) => i.exerciseId),
      swaps: alternatives("bench-press", gym).map((e) => e.id),
    });
    setLanguage("en");
    const english = run();
    for (const lang of ["es", "fr"] as const) {
      setLanguage(lang);
      expect(run(), lang).toEqual(english);
    }
  });
});

describe("shared components' words", () => {
  // The demo and the plate graphic are shared with the website, which keeps English in the component;
  // the app passes the catalogue's words. The two English copies must stay the same.
  it("the demo's and the plate graphic's English match their catalogues", async () => {
    const { DEMO_WORDS } = await import("@/components/demo/LiftDemoCore");
    const { PLATE_WORDS } = await import("@/components/PlateBar");
    const demo = await import("@/locales/text/demo");
    const plate = await import("@/locales/text/plate");
    expect(Object.fromEntries(Object.entries(DEMO_WORDS).map(([k, v]) => [`demo.${k}`, v]))).toEqual(demo.en);
    expect(Object.fromEntries(Object.entries(PLATE_WORDS).map(([k, v]) => [`plate.${k}`, v]))).toEqual(plate.en);
  });
});

describe("achievement units", () => {
  it("every unit an achievement counts in has its own words", async () => {
    const { ACHIEVEMENTS } = await import("./achievements");
    const { en: catalogue } = await import("@/locales/en");
    for (const a of ACHIEVEMENTS) if (a.unit) expect(catalogue, a.id).toHaveProperty(`awards.u.${a.unit === "×" ? "x" : a.unit}`);
  });
});
