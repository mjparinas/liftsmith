import { describe, expect, it } from "vitest";

import { setLanguage } from "../i18n";
import { demoId, searchStretches, STRETCHES } from "../stretches";
import { MUSCLES } from "../types";
import { jointsAt, placement, placeVec } from "./mesh";
import { BODIES, cycleLength, len, sub, type BodyKey, type Vec } from "./rig";
import { hasStretchMotion, stretchMotion } from "./stretchMotions";

const BODY_KEYS: BodyKey[] = ["male", "female"];
const PHASES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const JOINTS = [
  "hipC",
  "shC",
  "neck",
  "head",
  "hipL",
  "kneeL",
  "ankleL",
  "shL",
  "elbowL",
  "handL",
  "hipR",
  "kneeR",
  "ankleR",
  "shR",
  "elbowR",
  "handR",
];

describe("stretch library", () => {
  it("has a warm-up move and a cool-down hold for every muscle", () => {
    for (const m of MUSCLES) {
      expect(
        STRETCHES.some((s) => s.kind === "warm" && s.for.includes(m)),
        `warm ${m}`,
      ).toBe(true);
      expect(
        STRETCHES.some((s) => s.kind === "cool" && s.for.includes(m)),
        `cool ${m}`,
      ).toBe(true);
    }
  });

  it("has unique ids, a name and how-to text, and a 3D motion for every stretch", () => {
    expect(new Set(STRETCHES.map((s) => s.id)).size).toBe(STRETCHES.length);
    for (const s of STRETCHES) {
      expect(s.name, s.id).not.toMatch(/^(str|warm)\./);
      expect(s.how, s.id).not.toMatch(/^(str|warm)\./);
      expect(hasStretchMotion(s.id), s.id).toBe(true);
      expect(s.seconds > 0 || (s.reps ?? 0) > 0, s.id).toBe(true);
    }
  });

  it("leaves exercise ids alone", () => {
    expect(stretchMotion("back-squat")).toBeNull();
    expect(stretchMotion(null)).toBeNull();
  });
});

describe("stretch demos", () => {
  for (const s of STRETCHES) {
    it(`${s.id}: limbs keep their length on both bodies and nothing goes through the floor`, () => {
      const m = stretchMotion(demoId(s.id))!;
      expect(cycleLength(m.phases)).toBeGreaterThan(0.5);
      for (const bk of BODY_KEYS) {
        const B = BODIES[bk];
        const pl = placement(m, B);
        for (const d of PHASES) {
          const pose = m.pose(B, d);
          const J = jointsAt(m, B, d) as unknown as Record<string, Vec>;
          for (const k of JOINTS) for (const v of J[k]) expect(Number.isFinite(v), `${bk} ${k} at ${d}`).toBe(true);
          expect(Math.abs(len(sub(pose.sh, pose.hip)) - B.torso), `${bk} torso at ${d}`).toBeLessThan(0.02);
          for (const side of ["L", "R"]) {
            expect(len(sub(J["hand" + side], J["sh" + side])), `${bk} ${side} arm at ${d}`).toBeLessThan(B.upper + B.fore + 0.03);
            expect(len(sub(J["ankle" + side], J["hip" + side])), `${bk} ${side} leg at ${d}`).toBeLessThan(B.thigh + B.shin + 0.03);
            expect(Math.abs(len(sub(J["elbow" + side], J["sh" + side])) - B.upper), `${bk} ${side} upper arm at ${d}`).toBeLessThan(0.005);
            expect(Math.abs(len(sub(J["knee" + side], J["hip" + side])) - B.thigh), `${bk} ${side} thigh at ${d}`).toBeLessThan(0.005);
          }
          for (const k of JOINTS) {
            const p = placeVec(J[k], pl.roll(d), pl.lift, pl.shiftZ);
            expect(p[1], `${bk} ${k} at ${d} is under the floor`).toBeGreaterThan(-0.03);
          }
        }
      }
    });
  }
});

describe("searchStretches", () => {
  it("matches every word against the name, in the app's language or English, and the muscles", () => {
    expect(searchStretches({ text: "pigeon" }).map((s) => s.id)).toEqual(["pigeon"]);
    expect(searchStretches({ text: "quads", kind: "cool" }).every((s) => s.for.includes("quads") || /quad/i.test(s.name))).toBe(true);
    setLanguage("es");
    try {
      // Accents don't matter, and the English name still finds it.
      expect(searchStretches({ text: "pigeon" }).map((s) => s.id)).toEqual(["pigeon"]);
      expect(searchStretches({ text: "paloma" }).map((s) => s.id)).toEqual(["pigeon"]);
      expect(searchStretches({ text: "gluteos" }).every((s) => s.for.includes("glutes"))).toBe(true);
      expect(searchStretches({ text: "gluteos" }).length).toBeGreaterThan(3);
    } finally {
      setLanguage("en");
    }
  });
});
