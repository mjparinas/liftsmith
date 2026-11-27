import { describe, expect, it } from "vitest";

import { en as ff } from "@/locales/text/ff";

import { hasMotion } from "./demo/motions";
import { ENGLISH_ROWS } from "./exercises";
import { STAPLE } from "./pickWeights";
import { BOARDS, PIN_LIMITS, pinContent, pinOrder } from "./pinContent";

describe("Pinterest pin words", () => {
  const order = pinOrder(hasMotion);

  it("covers hundreds of exercises, each within Pinterest's limits", () => {
    expect(order.length).toBeGreaterThan(900);
    for (const id of order) {
      const p = pinContent(id)!;
      expect(p.cues).toHaveLength(3);
      expect(p.title.length).toBeLessThanOrEqual(PIN_LIMITS.title);
      expect(p.description.length).toBeLessThanOrEqual(PIN_LIMITS.description);
      expect(p.alt.length).toBeLessThanOrEqual(PIN_LIMITS.alt);
      expect(BOARDS[p.board]).toBeDefined();
    }
  });

  it("puts the well-known lifts first", () => {
    const staples = order.filter((id) => STAPLE.has(id)).length;
    expect(order.slice(0, staples).every((id) => STAPLE.has(id))).toBe(true);
  });

  it("links to the exercise page with tags the Traffic tab counts", () => {
    const p = pinContent("bench-press", "video")!;
    expect(p.link).toBe("https://www.getliftsmith.com/exercises/bench-press/?utm_source=pinterest&utm_medium=social&utm_campaign=pin-clip");
    expect(pinContent("bench-press")!.link).toContain("utm_campaign=pin");
    expect(p.shown).toBe("getliftsmith.com/exercises/bench-press");
    expect(p.title).toBe("Barbell bench press: 3 form cues");
    expect(p.board).toBe("Chest");
    expect(p.description).toContain("1. Grip just outside shoulder width.");
  });

  it("tops two cues up with the fix for a common mistake", () => {
    const fixes = new Set(
      Object.entries(ff)
        .filter(([k]) => k.endsWith(".fix"))
        .map(([, v]) => v.replace(/\.$/, "")),
    );
    const twos = ENGLISH_ROWS.filter((r) => r.cues.length === 2);
    expect(twos.length).toBeGreaterThan(100);
    for (const r of twos) {
      const c = pinContent(r.id)!.cues;
      expect(c.slice(0, 2)).toEqual(r.cues.map((x) => x.replace(/\.$/, "")));
      expect(fixes.has(c[2])).toBe(true);
    }
  });

  it("says nothing for an unknown exercise", () => {
    expect(pinContent("no-such-lift")).toBeNull();
  });

  it("only uses exercises that have a 3D motion of their own", () => {
    expect(pinOrder(() => false)).toEqual([]);
  });
});
