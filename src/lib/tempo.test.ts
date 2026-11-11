import { describe, expect, it } from "vitest";

import { EXERCISES } from "./exercises";
import { beatAt, LEAD_IN, phaseWord, repSeconds, tempoOf, TEMPOS, timeline } from "./tempo";

describe("tempo coach", () => {
  it("only names lifts that exist", () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const id of Object.keys(TEMPOS)) expect(ids.has(id), id).toBe(true);
  });

  it("counts the seconds each lift's own cues give", () => {
    // "Take three slow seconds on the way down", "Drive up at normal speed".
    expect(tempoOf("tempo-squat")?.phases).toEqual([
      { phase: "down", s: 3 },
      { phase: "up", s: 1 },
    ]);
    // "Hold two seconds at the bottom".
    expect(tempoOf("pause-squat")?.phases.find((p) => p.phase === "hold")?.s).toBe(2);
    expect(tempoOf("back-squat")).toBeUndefined();
  });

  it("every exercise with tempo in its name has a tempo, and every phase is a whole second or more", () => {
    for (const e of EXERCISES) if (/^(tempo|pause|paused)-/.test(e.id)) expect(tempoOf(e.id), e.id).toBeDefined();
    for (const t of Object.values(TEMPOS)) for (const p of t.phases) expect(Number.isInteger(p.s) && p.s >= 1).toBe(true);
  });

  it("lays out a lead-in, then one beat a second for every rep", () => {
    const tempo = tempoOf("tempo-goblet-squat")!; // 4 down, 1 hold, 1 up
    const { beats, end } = timeline(tempo, 2);
    expect(repSeconds(tempo)).toBe(6);
    expect(beats).toHaveLength(LEAD_IN + 12);
    expect(end).toBe((LEAD_IN + 12) * 1000);
    expect(beats.slice(0, 3).map((b) => [b.phase, b.left])).toEqual([
      ["lead", 3],
      ["lead", 2],
      ["lead", 1],
    ]);
    const rep1 = beats.filter((b) => b.rep === 1);
    expect(rep1.map((b) => `${b.phase}${b.start ? "!" : ""}${b.left}`)).toEqual(["down!4", "down3", "down2", "down1", "hold!1", "up!1"]);
    expect(beats.map((b) => b.at)).toEqual(beats.map((_, i) => i * 1000));
  });

  it("finds the beat in progress, and nothing once the set's count ends", () => {
    const { beats, end } = timeline(tempoOf("tempo-squat")!, 1);
    expect(beatAt(beats, end, -1)).toBeUndefined();
    expect(beatAt(beats, end, 0)?.phase).toBe("lead");
    expect(beatAt(beats, end, 3500)).toMatchObject({ rep: 1, phase: "down", left: 3 });
    expect(beatAt(beats, end, 6999)).toMatchObject({ rep: 1, phase: "up" });
    expect(beatAt(beats, end, 7000)).toBeUndefined();
  });

  it("no reps means only the lead-in", () => {
    expect(timeline(tempoOf("tempo-squat")!, 0).beats).toHaveLength(LEAD_IN);
  });

  it("says Pull and Return on pulling lifts", () => {
    const row = tempoOf("paused-lat-pulldown")!;
    expect(row.phases.map((p) => phaseWord(row, p.phase))).toEqual(["pull", "hold", "return"]);
    const squat = tempoOf("tempo-squat")!;
    expect(squat.phases.map((p) => phaseWord(squat, p.phase))).toEqual(["down", "up"]);
    expect(phaseWord(squat, "lead")).toBe("lead");
  });
});
