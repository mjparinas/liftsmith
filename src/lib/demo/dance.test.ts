import { describe, expect, it } from "vitest";

import { DANCE_SECONDS, DANCE_TAP_GAP_MS, DANCE_TAPS, danceMotion, tapStreak } from "./dance";
import { jointsAt } from "./mesh";
import { motionFor } from "./motions";
import { BODIES, cycleLength, len, sub, type BodyKey, type Vec } from "./rig";

const BODY_KEYS: BodyKey[] = ["male", "female"];
const steps = Array.from({ length: 101 }, (_, i) => i / 100);

describe("dance easter egg", () => {
  it("starts on the fifth quick tap", () => {
    let taps: number[] = [];
    for (let i = 0; i < DANCE_TAPS - 1; i++) {
      const r = tapStreak(taps, 1000 + i * 300);
      expect(r.dance).toBe(false);
      taps = r.taps;
    }
    const r = tapStreak(taps, 1000 + (DANCE_TAPS - 1) * 300);
    expect(r.dance).toBe(true);
    expect(r.taps).toEqual([]);
  });

  it("starts counting again after a pause between taps", () => {
    let taps: number[] = [];
    for (let i = 0; i < DANCE_TAPS - 1; i++) taps = tapStreak(taps, i * 300).taps;
    const r = tapStreak(taps, (DANCE_TAPS - 2) * 300 + DANCE_TAP_GAP_MS + 1);
    expect(r.dance).toBe(false);
    expect(r.taps).toHaveLength(1);
  });

  it("lasts about ten seconds, played once from start to end", () => {
    const m = danceMotion();
    expect(cycleLength(m.phases)).toBe(DANCE_SECONDS);
    expect(DANCE_SECONDS).toBeGreaterThanOrEqual(8);
    expect(DANCE_SECONDS).toBeLessThanOrEqual(12);
  });

  it("keeps every limb in one piece and the feet on or above the floor, on both bodies", () => {
    const m = danceMotion();
    for (const key of BODY_KEYS) {
      const B = BODIES[key];
      for (const d of steps) {
        const J = jointsAt(m, B, d);
        for (const s of ["L", "R"] as const) {
          const j = J as unknown as Record<string, Vec>;
          expect(len(sub(j["hand" + s]!, j["sh" + s]!)), `${key} ${s} arm at ${d}`).toBeLessThanOrEqual(B.upper + B.fore + 1e-3);
          expect(len(sub(j["ankle" + s]!, j["hip" + s]!)), `${key} ${s} leg at ${d}`).toBeLessThanOrEqual(B.thigh + B.shin + 1e-3);
          expect(j["ankle" + s]![1], `${key} ${s} ankle at ${d}`).toBeGreaterThanOrEqual(0.07);
          for (const v of j["hand" + s]!) expect(Number.isFinite(v)).toBe(true);
        }
      }
    }
  });

  it("moves: the hands travel well beyond a squat's", () => {
    const B = BODIES.male;
    const m = danceMotion();
    const ys = steps.map((d) => jointsAt(m, B, d).handR[1]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.8); // from hanging to overhead
  });

  it("ends on the back squat's first frame, so the squat picks up without a jump", () => {
    for (const key of BODY_KEYS) {
      const B = BODIES[key];
      const end = jointsAt(danceMotion(), B, 1);
      const squat = jointsAt(motionFor("back-squat"), B, 0);
      for (const k of ["hipC", "shC", "handL", "handR", "ankleL", "ankleR", "kneeL", "kneeR"] as const)
        expect(len(sub(end[k], squat[k])), `${key} ${k}`).toBeLessThan(0.01);
    }
  });
});
