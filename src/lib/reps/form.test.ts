import { describe, expect, it } from "vitest";

import { assessForm, checksFor, FormCheck, formFrame, LEAN_DEG, mainIssue, type FormFrame } from "./form";
import { PoseSignal, type Keypoint } from "./pose";
import { profileFor } from "./profiles";
import { posePoints as pose, sideSquat } from "./simulate";
import { RepTracker } from "./tracker";
import type { Rep } from "./types";

const SQUAT = profileFor("back-squat", "squat")!;
const rad = (d: number) => (d * Math.PI) / 180;

/** Facing the camera (not mirrored, so the lifter's left is on the image's right), shoulders tipped `leanDeg`
 *  towards the lifter's right. */
function frontStand(leanDeg: number): Keypoint[] {
  const hy = 0.55;
  const dx = Math.tan(rad(leanDeg)) * 0.3;
  return pose({
    Lhip: [0.55, hy],
    Rhip: [0.45, hy],
    Lknee: [0.56, 0.72],
    Rknee: [0.44, 0.72],
    Lshoulder: [0.6 - dx, hy - 0.3],
    Rshoulder: [0.4 - dx, hy - 0.3],
  });
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

/** Frames through each rep: `depth` and `lean` at the bottom, standing tall at the ends. */
function frames(reps: Rep[], at: (r: Rep) => { depth?: number; lean?: number }): FormFrame[] {
  const out: FormFrame[] = [];
  for (const r of reps)
    for (let t = r.start; t <= r.end; t += 100) {
      const f = 1 - Math.abs(t - r.turn) / (r.turn - r.start);
      const v = at(r);
      out.push({
        t,
        depth: v.depth === undefined ? undefined : -1 + f * (v.depth + 1),
        lean: v.lean === undefined ? undefined : v.lean * f,
      });
    }
  return out;
}

describe("reading form from a pose", () => {
  it("puts the hip above the knee standing and below it at the bottom of a deep squat", () => {
    expect(formFrame(0, sideSquat(0, 120), 1).depth).toBeLessThan(-0.5);
    expect(formFrame(0, sideSquat(1, 120), 1).depth).toBeGreaterThan(0);
    expect(formFrame(0, sideSquat(1, 70), 1).depth).toBeLessThan(-0.2);
  });

  it("reads no lean from the side, and a lean towards the lifter's own side when facing the camera", () => {
    expect(formFrame(0, sideSquat(0.5, 100), 1).lean).toBeUndefined();
    expect(formFrame(0, frontStand(0), 1).lean).toBeCloseTo(0, 5);
    expect(formFrame(0, frontStand(10), 1).lean).toBeCloseTo(10, 0);
    expect(formFrame(0, frontStand(-10), 1).lean).toBeCloseTo(-10, 0);
  });

  it("gives the same side whether the image is mirrored or not", () => {
    const mirrored = frontStand(10).map((p) => ({ ...p, x: 1 - p.x }));
    expect(formFrame(0, mirrored, 1).lean).toBeCloseTo(10, 0);
  });

  it("says nothing without a pose", () => {
    expect(formFrame(5, undefined, 1)).toEqual({ t: 5 });
  });
});

describe("judging a set", () => {
  const five = [0, 1, 2, 3, 4].map((i) => rep(i));

  it("finds squats that stop above parallel, and how far down they got", () => {
    const r = assessForm(
      five,
      frames(five, (x) => ({ depth: x.index < 3 ? -0.3 : 0.1 })),
      checksFor("squat"),
    );
    expect(r.issues).toEqual([expect.objectContaining({ kind: "depth", hit: 3, of: 5 })]);
    expect(r.issues[0]?.reach).toBeCloseTo(100 / 110, 1);
  });

  it("lets a hip level with the knee pass, and doesn't check depth on lifts that aren't squats", () => {
    expect(
      assessForm(
        five,
        frames(five, () => ({ depth: -0.05 })),
        checksFor("squat"),
      ).issues,
    ).toEqual([]);
    expect(
      assessForm(
        five,
        frames(five, () => ({ depth: -0.4 })),
        checksFor("hinge"),
      ).issues,
    ).toEqual([]);
  });

  it("needs a quarter of the reps before it speaks", () => {
    const ten = Array.from({ length: 10 }, (_, i) => rep(i));
    const two = frames(ten, (x) => ({ depth: x.index < 2 ? -0.3 : 0.1 }));
    expect(assessForm(ten, two, checksFor("squat")).issues).toEqual([]);
    const three = frames(ten, (x) => ({ depth: x.index < 3 ? -0.3 : 0.1 }));
    expect(assessForm(ten, three, checksFor("squat")).issues).toHaveLength(1);
  });

  it("counts partial reps as short range, and leaves failed attempts out", () => {
    const set = [rep(0), rep(1, { kind: "partial", depth: 0.5 }), rep(2, { kind: "partial", depth: 0.6 }), rep(3, { kind: "failed" })];
    const r = assessForm(set, [], checksFor("hpush"));
    expect(r.reps).toBe(3);
    expect(r.issues).toEqual([{ kind: "rom", hit: 2, of: 3, reach: 0.55 }]);
  });

  it("finds a lean to one side through the bottom of the reps, with its size", () => {
    const r = assessForm(
      five,
      frames(five, (x) => ({ lean: x.index < 4 ? -12 : 2 })),
      checksFor("squat"),
    );
    // The size is the average through the bottom half, a little under the peak.
    expect(r.issues).toEqual([{ kind: "lean", hit: 4, of: 5, side: "left", deg: 9 }]);
    expect(
      assessForm(
        five,
        frames(five, () => ({ lean: LEAN_DEG - 2 })),
        checksFor("squat"),
      ).issues,
    ).toEqual([]);
    expect(
      assessForm(
        five,
        frames(five, () => ({ lean: 12 })),
        checksFor("hpush"),
      ).issues,
    ).toEqual([]);
  });

  it("doesn't call a wobble both ways a lean", () => {
    const ten = Array.from({ length: 10 }, (_, i) => rep(i));
    const r = assessForm(
      ten,
      frames(ten, (x) => ({ lean: x.index % 5 === 0 ? 12 : x.index % 5 === 1 ? -12 : 0 })),
      checksFor("squat"),
    );
    expect(r.issues).toEqual([]);
  });
});

describe("the one tip", () => {
  it("picks the most common issue, a lean first on a tie, and lets depth stand for short range on squats", () => {
    expect(mainIssue({ reps: 5, issues: [] })).toBeUndefined();
    expect(
      mainIssue({
        reps: 5,
        issues: [
          { kind: "rom", hit: 4, of: 5 },
          { kind: "depth", hit: 2, of: 5 },
        ],
      })?.kind,
    ).toBe("depth");
    expect(
      mainIssue({
        reps: 5,
        issues: [
          { kind: "depth", hit: 3, of: 5 },
          { kind: "lean", hit: 3, of: 5, side: "right" },
        ],
      })?.kind,
    ).toBe("lean");
    expect(
      mainIssue({
        reps: 5,
        issues: [
          { kind: "rom", hit: 4, of: 5 },
          { kind: "lean", hit: 2, of: 5, side: "right" },
        ],
      })?.kind,
    ).toBe("rom");
  });
});

describe("from the camera to the tip", () => {
  /** Feeds a side-on set of squats through the same pose signal, rep tracker and form check as the app. */
  function run(roms: number[]) {
    const signal = new PoseSignal(SQUAT);
    const tracker = new RepTracker(SQUAT);
    const check = new FormCheck(checksFor("squat"));
    let t = 0;
    const frame = (f: number, rom: number) => {
      t += 33;
      const kps = sideSquat(f, rom);
      tracker.push(signal.sample(t, kps, 1));
      check.push(formFrame(t, kps, 1));
    };
    for (let i = 0; i < 30; i++) frame(0, 0);
    for (const rom of roms) {
      for (let i = 0; i <= 70; i++) frame(Math.sin((Math.PI * i) / 70), rom);
      for (let i = 0; i < 25; i++) frame(0, 0);
    }
    return check.report(tracker.finish().reps);
  }

  it("calls a set of deep squats clean", () => {
    const r = run([120, 120, 120, 120]);
    expect(r.reps).toBe(4);
    expect(r.issues).toEqual([]);
  });

  it("flags squats cut above parallel", () => {
    const r = run([120, 75, 75, 120]);
    expect(mainIssue(r)).toEqual(expect.objectContaining({ kind: "depth", hit: 2, of: 4 }));
  });

  it("keeps reps from a tracker that ended itself, and starts clean after a reset", () => {
    const check = new FormCheck(checksFor("squat"));
    check.keep([rep(0, { kind: "partial", depth: 0.5 })]);
    expect(check.report([rep(1, { kind: "partial", depth: 0.5 })]).issues[0]).toEqual(expect.objectContaining({ kind: "rom", hit: 2 }));
    check.reset();
    expect(check.report([]).reps).toBe(0);
  });
});
