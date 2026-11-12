import { describe, expect, it } from "vitest";

import { EXERCISES } from "../exercises";
import { MUSCLES } from "../types";
import { bounds, evalPart, jointsAt, PARTS, partWeights, placement, placeVec, REGIONS, SKEL_MAX, skeletonSegments } from "./mesh";
import { missingMotions, motionFor, targetsFor } from "./motions";
import { BODIES, cycleLength, ik, len, sample, solve, sub, V, type BodyKey, type Vec } from "./rig";

const BODY_KEYS: BodyKey[] = ["male", "female"];
const PHASES = [0, 0.25, 0.5, 0.75, 1];
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
] as const;

describe("exercise demos", () => {
  it("has a motion for every exercise in the library", () => {
    expect(missingMotions()).toEqual([]);
  });

  it("paints every app muscle somewhere on the body", () => {
    for (const m of MUSCLES)
      expect(
        REGIONS.some((r) => r.id === m),
        m,
      ).toBe(true);
  });

  it("lights primary muscles fully and secondary ones at half", () => {
    const t = targetsFor("back-squat");
    expect(t.quads).toBe(1);
    expect(t.glutes).toBe(1);
    expect(t.adductors).toBe(0.5);
    expect(targetsFor(null)).toEqual({});
    expect(targetsFor("anything", { chest: 0.7 })).toEqual({ chest: 0.7 });
  });

  for (const e of EXERCISES) {
    it(`${e.id}: limbs reach their targets on both bodies and nothing goes through the floor`, () => {
      const m = motionFor(e.id);
      expect(cycleLength(m.phases)).toBeGreaterThan(0.5);
      for (const bk of BODY_KEYS) {
        const B = BODIES[bk];
        const pl = placement(m, B);
        // Every phase's start, middle and end too, so multi-step moves (burpees, the get-up) are checked all the way.
        const ds = [...new Set([...PHASES, ...m.phases.flatMap(([, a, b]) => [a, (a + b) / 2, b])])];
        for (const d of ds) {
          const pose = m.pose(B, d);
          const J = jointsAt(m, B, d) as unknown as Record<string, Vec>;
          for (const k of JOINTS) for (const v of J[k]) expect(Number.isFinite(v), `${bk} ${k} at ${d}`).toBe(true);
          // the torso keeps its length
          expect(Math.abs(len(sub(pose.sh, pose.hip)) - B.torso), `${bk} torso at ${d}`).toBeLessThan(0.02);
          for (const s of ["L", "R"]) {
            // hands and feet get to where the pose puts them (within 3 cm): grips stay on the bar
            expect(len(sub(J["hand" + s], J["sh" + s])), `${bk} ${s} arm at ${d}`).toBeLessThan(B.upper + B.fore + 0.03);
            expect(len(sub(J["ankle" + s], J["hip" + s])), `${bk} ${s} leg at ${d}`).toBeLessThan(B.thigh + B.shin + 0.03);
            expect(Math.abs(len(sub(J["elbow" + s], J["sh" + s])) - B.upper), `${bk} ${s} upper arm at ${d}`).toBeLessThan(0.005);
            expect(Math.abs(len(sub(J["knee" + s], J["hip" + s])) - B.thigh), `${bk} ${s} thigh at ${d}`).toBeLessThan(0.005);
          }
          for (const k of JOINTS) {
            const p = placeVec(J[k], pl.roll(d), pl.lift, pl.shiftZ);
            expect(p[1], `${bk} ${k} at ${d} is under the floor`).toBeGreaterThan(-0.03);
          }
        }
      }
    });
  }

  it("builds the mesh, the muscle paint and the skeleton for a pose", () => {
    const B = BODIES.female;
    const m = motionFor("deadlift");
    const J = jointsAt(m, B, 0.5);
    let painted = 0;
    for (const P of PARTS) {
      const pos = new Float32Array(P.NT * P.M * 3),
        meta = new Float32Array(P.NT * P.M * 2),
        w = new Float32Array(P.NT * P.M);
      evalPart(P, J, B, pos, meta);
      expect(pos.every(Number.isFinite), P.name).toBe(true);
      partWeights(P, meta, targetsFor("deadlift"), w);
      painted += w.filter((x) => x > 0.5).length;
    }
    expect(painted).toBeGreaterThan(100);
    const n = skeletonSegments(J, B, new Float32Array(SKEL_MAX * 6));
    expect(n).toBeGreaterThan(100);
    expect(n).toBeLessThanOrEqual(SKEL_MAX);
  });

  it("frames the whole figure, including rolled side planks", () => {
    for (const id of ["back-squat", "bench-press", "side-plank", "pull-up"]) {
      const m = motionFor(id);
      const b = bounds(m, BODIES.male, placement(m, BODIES.male));
      expect(b.size, id).toBeGreaterThan(1.1);
      expect(b.size, id).toBeLessThan(3);
    }
  });

  it("samples tempo phases with eased values and wraps around", () => {
    const m = motionFor("back-squat");
    const total = cycleLength(m.phases);
    expect(sample(m.phases, 0).d).toBe(0);
    expect(sample(m.phases, total + 0.1).d).toBeCloseTo(sample(m.phases, 0.1).d);
    const bottom = sample(m.phases, 0.6 + 1.8 + 0.1);
    expect(bottom.d).toBe(1);
  });

  it("solves a two-bone chain to exact bone lengths", () => {
    const k = ik(V(0, 1), V(0.3, 0.2), 0.45, 0.45, V(1, 0, 0));
    expect(len(sub(k, V(0, 1)))).toBeCloseTo(0.45);
    expect(len(sub(k, V(0.3, 0.2)))).toBeCloseTo(0.45);
    expect(k[0]).toBeGreaterThan(0.15); // bends towards the pole
  });

  it("gives male and female figures the same motion with their own proportions", () => {
    const m = motionFor("overhead-press");
    const a = solve(m.pose(BODIES.male, 0), BODIES.male, { stance: 0.13, grip: 0.27 });
    const b = solve(m.pose(BODIES.female, 0), BODIES.female, { stance: 0.13, grip: 0.27 });
    expect(a.head[1]).toBeGreaterThan(b.head[1]);
    expect(a.handR[1]).toBeGreaterThan(a.head[1]); // locked out overhead on both
    expect(b.handR[1]).toBeGreaterThan(b.head[1]);
  });
  it("keeps behind-the-neck and behind-the-back bars behind the body", () => {
    for (const bk of BODY_KEYS) {
      const B = BODIES[bk];
      for (let d = 0; d <= 1; d += 0.05) {
        // behind-the-neck press: below the top of the head, the bar passes behind it (Melvin, 2026-11-12)
        const J = jointsAt(motionFor("behind-neck-press"), B, d);
        if (J.bar![1] < J.head[1] + B.head[1]) expect(J.bar![0], `${bk} press at ${d}`).toBeLessThan(J.head[0] - B.head[0]);
        const F = jointsAt(motionFor("overhead-press"), B, d);
        if (F.bar![1] < F.head[1]) expect(F.bar![0], `${bk} front press at ${d}`).toBeGreaterThan(F.head[0]);
        for (const id of ["behind-back-shrug", "behind-back-wrist-curl"]) {
          const K = jointsAt(motionFor(id), B, d);
          expect(K.bar![0], `${bk} ${id} at ${d}`).toBeLessThan(K.hipC[0] - 0.12);
        }
        const C = jointsAt(motionFor("behind-body-cable-curl"), B, d);
        expect(C.elbowR[0], `${bk} cable curl elbow at ${d}`).toBeLessThan(C.shC[0] - 0.05);
      }
    }
  });
  it("draws the bar on barbell carries, in the right place", () => {
    for (const bk of BODY_KEYS) {
      const B = BODIES[bk];
      for (const d of [0, 0.25, 0.5, 0.75]) {
        // Bar-in-elbows carry: the bar sits in the crook of the elbows, in front of the body (Melvin, 2026-11-12)
        const Z = jointsAt(motionFor("zercher-carry"), B, d);
        expect(Z.bar, `${bk} zercher at ${d}`).toBeDefined();
        expect(Math.hypot(Z.bar![0] - Z.elbowR[0], Z.bar![1] - Z.elbowR[1]), `${bk} zercher bar to elbow`).toBeLessThan(0.08);
        expect(Z.bar![0]).toBeGreaterThan(Z.shC[0] + 0.05);
        expect(Z.handR[1]).toBeGreaterThan(Z.elbowR[1]);
        const O = jointsAt(motionFor("overhead-barbell-carry"), B, d);
        expect(O.bar![1], `${bk} overhead carry`).toBeGreaterThan(O.head[1]);
        const F = jointsAt(motionFor("front-rack-barbell-carry"), B, d);
        expect(F.bar![0], `${bk} front rack carry`).toBeGreaterThan(F.shC[0]);
      }
    }
  });
  it("keeps the female figure's hips and glutes in athletic proportion", () => {
    const F = BODIES.female,
      M = BODIES.male;
    const widest = (tab: number[][], from: number, to: number) =>
      Math.max(...tab.filter((r) => r[0]! >= from && r[0]! <= to).map((r) => r[1]!));
    const glutes = (B: typeof F) => Math.max(...B.torsoSide.filter((r) => r[0]! <= 0.2).map((r) => r[2]!));
    // hips no wider than the chest and shoulders (Melvin, 2026-11-11: the glutes were too big)
    expect(widest(F.torsoFront, -0.12, 0.2)).toBeLessThanOrEqual(widest(F.torsoFront, 0.7, 1));
    // glutes stick out no further, for her size, than the male figure's
    expect(glutes(F) / F.s).toBeLessThanOrEqual(glutes(M));
    // the hip joints sit no wider apart than the male figure's
    expect(F.hipW).toBeLessThanOrEqual(M.hipW);
  });
});
