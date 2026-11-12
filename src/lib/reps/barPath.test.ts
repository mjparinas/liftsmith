import { describe, expect, it } from "vitest";

import { assessPath, BarPath, pathFits, pathFrame, type PathFrame } from "./barPath";
import type { Keypoint } from "./pose";
import { posePoints } from "./simulate";
import type { Rep } from "./types";

/** Side-on, facing the image's right (or left when `facing` is -1), the bar point `dx` ahead of the mid-foot. */
function side(dx: number, facing = 1, bar: "shoulder" | "wrist" = "shoulder"): Keypoint[] {
  const at = (x: number) => 0.5 + (x - 0.5) * facing;
  const barPt: [number, number] = [at(0.52 + dx), 0.3];
  const kps = posePoints(
    {
      Lankle: [at(0.5), 0.9],
      Lknee: [at(0.52), 0.7],
      Lhip: [at(0.5), 0.5],
      ...(bar === "shoulder" ? { Lshoulder: barPt } : { Lwrist: barPt }),
    },
    "R",
  );
  kps[29] = { x: at(0.48), y: 0.92, visibility: 0.9 }; // heel
  kps[31] = { x: at(0.56), y: 0.92, visibility: 0.9 }; // toe
  return kps;
}

function rep(i: number, over: Partial<Rep> = {}): Rep {
  const start = i * 3000;
  return {
    index: i,
    kind: "full",
    start,
    turn: start + 1200,
    end: start + 2400,
    rom: 100,
    depth: 1,
    concentricMs: 1000,
    eccentricMs: 1200,
    speed: 0.5,
    speedIsMetres: true,
    velocityLoss: 0,
    grinder: false,
    sticking: false,
    ...over,
  };
}

/** Frames through each rep, the bar drifting by up to `drift(r)` and peaking at `peak` (0 start, 0.5 the turnaround, 1 the end). */
function frames(reps: Rep[], drift: (r: Rep) => number, peak = 0.5, facing = 1): PathFrame[] {
  const out: PathFrame[] = [];
  for (const r of reps)
    for (let t = r.start; t <= r.end; t += 50) {
      const u = (t - r.start) / (r.end - r.start);
      const f = Math.max(0, 1 - Math.abs(u - peak) / 0.5);
      out.push(pathFrame(t, side(drift(r) * f, facing), 1, "squat"));
    }
  return out;
}

describe("reading the bar from a pose", () => {
  it("measures the bar ahead of the mid-foot the way the lifter faces, mirrored or not", () => {
    expect(pathFrame(0, side(0.05), 1, "squat").dx).toBeCloseTo(0.05);
    expect(pathFrame(0, side(0.05, -1), 1, "squat").dx).toBeCloseTo(0.05);
    expect(pathFrame(0, side(-0.03), 1, "squat").dx).toBeCloseTo(-0.03);
  });

  it("follows the shoulders on a squat and the hands on a hinge or a press", () => {
    expect(pathFrame(0, side(0.05, 1, "wrist"), 1, "hinge").dx).toBeCloseTo(0.05);
    expect(pathFrame(0, side(0.05, 1, "wrist"), 1, "squat").bar).toBeUndefined();
  });

  it("reads nothing from an empty frame", () => {
    expect(pathFrame(0, undefined, 1, "squat")).toEqual({ t: 0, kps: [] });
  });

  it("fits lifts whose bar should go straight up and down", () => {
    expect(pathFits("squat")).toBe(true);
    expect(pathFits("hinge")).toBe(true);
    expect(pathFits("vpush")).toBe(true);
    expect(pathFits("hpush")).toBe(false);
    expect(pathFits("isolation")).toBe(false);
  });
});

describe("judging a set's bar path", () => {
  const reps = [0, 1, 2, 3].map((i) => rep(i));

  it("says nothing is wrong when the bar stays over the mid-foot", () => {
    const r = assessPath(
      reps,
      frames(reps, () => 0.005),
    );
    expect(r.issue).toBeUndefined();
    expect(r.reps).toBe(4);
    expect(r.maxCm).toBeLessThan(3);
    expect(r.replay?.frames.length).toBeGreaterThan(10);
  });

  it("flags a bar that drifts forward at the bottom, in centimetres of the lifter's height", () => {
    const r = assessPath(
      reps,
      frames(reps, (x) => (x.index < 2 ? 0.05 : 0)),
      1.8,
    );
    expect(r.issue).toMatchObject({ kind: "forwardBottom", hit: 2, of: 4 });
    // 0.05 of a 0.4 leg is 0.05 / (0.4 / 0.491) of height: about 11 cm at 1.80 m.
    expect(r.issue?.cm).toBeGreaterThanOrEqual(9);
    expect(r.issue?.cm).toBeLessThanOrEqual(12);
    // The replay is a rep with the drift.
    expect(r.replay?.frames[0]!.t).toBeLessThan(6000);
  });

  it("tells a forward drift on the way up from one at the bottom, and a drift back from both", () => {
    expect(
      assessPath(
        reps,
        frames(reps, () => 0.05, 0.85),
      ).issue?.kind,
    ).toBe("forwardUp");
    expect(
      assessPath(
        reps,
        frames(reps, () => -0.05),
      ).issue?.kind,
    ).toBe("back");
  });

  it("leans towards saying nothing: one rep in five isn't enough, and failed reps aren't judged", () => {
    const five = [0, 1, 2, 3, 4].map((i) => rep(i, { kind: i === 4 ? "failed" : "full" }));
    expect(
      assessPath(
        five,
        frames(five, (x) => (x.index === 4 ? 0.08 : 0)),
      ).issue,
    ).toBeUndefined();
    const many = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rep(i));
    expect(
      assessPath(
        many,
        frames(many, (x) => (x.index === 0 ? 0.08 : 0)),
      ).issue,
    ).toBeUndefined();
  });

  it("needs the leg in view for a scale", () => {
    const noLeg = frames(reps, () => 0.05).map((f) => ({ ...f, leg: undefined }));
    expect(assessPath(reps, noLeg)).toEqual({ reps: 4, maxCm: 0 });
  });
});

describe("collecting a set", () => {
  it("keeps frames across a tracker restart and starts clean after reset", () => {
    const reps = [0, 1].map((i) => rep(i));
    const path = new BarPath("squat");
    for (const r of reps)
      for (let t = r.start; t <= r.end; t += 50) {
        const u = (t - r.start) / (r.end - r.start);
        path.push(t, side(0.06 * Math.max(0, 1 - Math.abs(u - 0.5) / 0.5)), 1);
      }
    path.keep([reps[0]!]);
    expect(path.report([reps[1]!]).issue).toMatchObject({ kind: "forwardBottom", hit: 2, of: 2 });
    path.reset();
    expect(path.report([]).reps).toBe(0);
  });

  it("drops frames where the bar can't be seen", () => {
    const path = new BarPath("squat");
    path.push(0, undefined, 1);
    path.push(10, posePoints({}), 1);
    expect(assessPath([rep(0)], [])).toEqual({ reps: 1, maxCm: 0 });
    expect(path.report([rep(0)])).toEqual({ reps: 1, maxCm: 0 });
  });
});
