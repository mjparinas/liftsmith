import { afterEach, describe, expect, it } from "vitest";

import { en } from "@/locales/en";

import { defaultBars, PRESETS } from "./defaults";
import { MOTION_IDS, motionFor } from "./demo/motions";
import { OWN_MOTIONS, stretchMotion } from "./demo/stretchMotions";
import { phaseKey, phaseWord, splitPhase } from "./demoPhase";
import { barName, gymName } from "./gymNames";
import { setLanguage } from "./i18n";

// Every word the app shows comes in the lifter's language, including the move names in the exercise demos
// and the names the app gives a new gym (Melvin, 2026-11-15: "this is the japanese page but the labels are
// still in english").
const labels = () => {
  const out = new Set<string>();
  const add = (phases: [number, number, number, string, number][] | undefined) =>
    phases?.forEach((p) => p[3] && out.add(splitPhase(p[3])[0]));
  for (const id of MOTION_IDS) add(motionFor(id).phases);
  for (const id of OWN_MOTIONS) add(stretchMotion(id)?.phases);
  add(motionFor(null).phases);
  out.add("Pause");
  return out;
};

afterEach(() => setLanguage("system"));

describe("demo move names", () => {
  it("has every language's words for every label a motion shows", () => {
    const missing = [...labels()].filter((l) => !(phaseKey(l) in en));
    expect(missing).toEqual([]);
  });

  it("shows them in the app's language and keeps the seconds", () => {
    setLanguage("ja");
    expect(phaseWord("Lower · 2s")).toBe("下ろす · 2s");
    setLanguage("de");
    expect(phaseWord("Hips back")).toBe("Hüfte zurück");
    expect(phaseWord("")).toBe("");
    expect(phaseWord("Something new")).toBe("Something new");
  });
});

describe("gym and bar names the app gives", () => {
  it("translates the presets and default bars, and leaves the lifter's own names alone", () => {
    setLanguage("ja");
    expect(gymName("Commercial gym")).toBe("一般のジム");
    expect(gymName("Iron Temple")).toBe("Iron Temple");
    expect(barName({ name: "Olympic bar" })).toBe("オリンピックバー");
    setLanguage("es");
    for (const p of PRESETS) expect(gymName(p.name)).not.toBe(p.name);
    for (const b of defaultBars("lb")) expect(barName(b)).not.toBe(b.name);
  });
});
