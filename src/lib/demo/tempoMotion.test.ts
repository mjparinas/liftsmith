import { describe, expect, it } from "vitest";

import { alternatives } from "../generator";
import { TEMPOS } from "../tempo";
import { motionFor } from "./motions";
import { cycleLength, sample, TEMPO } from "./rig";
import { fromTempo } from "./tempoMotion";

const labels = (id: string) => motionFor(id).phases.map((p) => p[3]);

describe("tempo and paused lifts in the demo", () => {
  it("plays a paused squat differently from the back squat it's swapped for", () => {
    // Melvin, 2026-11-12: swapping didn't seem to change the animation, because the two played the same motion
    expect(alternatives("back-squat", null).map((e) => e.id)).toContain("pause-squat");
    expect(labels("pause-squat")).not.toEqual(labels("back-squat"));
    expect(labels("pause-squat")).toEqual(["Brace", "Lower · 2s", "Pause · 2s", "Drive · 1s"]);
    expect(labels("tempo-squat")).toEqual(["Brace", "Lower · 3s", "Drive · 1s"]);
  });

  it("holds still at the bottom of the pause", () => {
    const m = motionFor("pause-squat");
    const start = m.phases[0]![0] + m.phases[1]![0];
    expect(sample(m.phases, start + 0.5).d).toBeCloseTo(1);
    expect(sample(m.phases, start + 1.5).d).toBeCloseTo(1);
  });

  it("pulls first on pulls, and splits a paused deadlift's pull around the pause", () => {
    expect(labels("paused-barbell-row")).toEqual(["Hang", "Row · 1s", "Pause · 1s", "Lower · 2s"]);
    const rows = motionFor("paused-deadlift").phases;
    const pause = rows.find((r) => r[3].startsWith("Pause"))!;
    expect(pause[1]).toBeGreaterThan(0);
    expect(pause[1]).toBeLessThan(1);
  });

  it("gives every lift with a tempo its seconds, and every rep ends where it started", () => {
    for (const [id, tempo] of Object.entries(TEMPOS)) {
      const m = motionFor(id);
      const seconds = tempo.phases.reduce((n, p) => n + p.s, 0);
      const lead = m.phases[0]![1] === m.phases[0]![2] && !m.phases[0]![3].includes("·") ? m.phases[0]![0] : 0;
      expect(cycleLength(m.phases), id).toBeCloseTo(seconds + lead);
      expect(m.phases.at(-1)![2], id).toBe(0);
    }
  });

  it("leaves the motion as it is when the tempo doesn't end where it started", () => {
    const rows = TEMPO.lowerFirst();
    expect(fromTempo({ phases: [{ phase: "down", s: 2 }] }, rows)).toBe(rows);
  });
});
