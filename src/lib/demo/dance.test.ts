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

  it("lasts about sixteen seconds, played once from start to end", () => {
    const m = danceMotion();
    expect(cycleLength(m.phases)).toBe(DANCE_SECONDS);
    expect(DANCE_SECONDS).toBeGreaterThanOrEqual(14);
    expect(DANCE_SECONDS).toBeLessThanOrEqual(18);
  });

  // the signature moves, each checked where it plays (seconds into the routine)
  const at = (t: number) => jointsAt(danceMotion(), BODIES.male, t / DANCE_SECONDS);
  const tipZ = (J: ReturnType<typeof at>) => J.headDir[2];

  it("rises from a slump", () => {
    const B = BODIES.male;
    expect(at(0.3).shC[1]).toBeLessThan(at(2.0).shC[1] - 0.15);
    expect(at(0.3).handR[1]).toBeLessThan(at(0.3).hipC[1]); // arms hanging
    expect(at(2.0).shC[1]).toBeGreaterThan(B.thigh + B.shin); // upright
  });

  it("walks forward, then comes back to its spot before the end", () => {
    expect(at(4.5).hipC[0] - at(2.0).hipC[0]).toBeGreaterThan(0.2);
    expect(Math.abs(at(11).hipC[0] - at(0).hipC[0])).toBeLessThan(0.08);
  });

  it("snaps the head right and left in the shimmy", () => {
    const tips = Array.from({ length: 40 }, (_, i) => tipZ(at(5 + (i / 40) * 1.4)));
    expect(Math.max(...tips)).toBeGreaterThan(0.2);
    expect(Math.min(...tips)).toBeLessThan(-0.2);
  });

  it("holds the claws up by one side of the head, steps that way, then the other way", () => {
    const right = at(8.0);
    const left = at(9.2);
    for (const J of [right, left]) {
      expect(J.handL[1]).toBeGreaterThan(J.shC[1]); // both hands at head height
      expect(J.handR[1]).toBeGreaterThan(J.shC[1]);
    }
    expect(right.handL[2]).toBeGreaterThan(right.shC[2] - 0.05); // the left hand crosses over to the right
    expect(left.handR[2]).toBeLessThan(left.shC[2] + 0.05);
    expect(right.hipC[2]).toBeGreaterThan(0.2); // stepped right
    expect(left.hipC[2]).toBeLessThan(right.hipC[2] - 0.1); // and back left
  });

  it("swipes the claws from low to high", () => {
    expect(at(10.35).handR[1] - at(9.9).handR[1]).toBeGreaterThan(0.6);
  });

  it("thrusts the hips forward on the beat", () => {
    const xs = Array.from({ length: 40 }, (_, i) => at(11.9 + (i / 40) * 1.4).hipC[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.05);
  });

  it("ends in the group pose: claws raised overhead, one foot forward", () => {
    const J = at(14.8);
    expect(J.handL[1]).toBeGreaterThan(J.head[1]);
    expect(J.handR[1]).toBeGreaterThan(J.head[1]);
    expect(J.ankleR[0] - J.ankleL[0]).toBeGreaterThan(0.2);
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
