import { describe, expect, it } from "vitest";

import { cleanPhases, phaseAt, phaseWeeks } from "./programPhases";

const DAY = 86_400_000;
const START = new Date(2026, 10, 30).getTime(); // a Monday

describe("program phases", () => {
  const phases = [
    { kind: "build", weeks: 3, weekdays: [[1, 4], [2]] },
    { kind: "deload", weeks: 1, weekdays: [[1], []] },
  ];

  it("keeps good phases and refuses anything off", () => {
    expect(cleanPhases(phases, 2)).toEqual(phases);
    expect(phaseWeeks(cleanPhases(phases, 2)!)).toBe(4);
    expect(cleanPhases([phases[0]], 2)).toBeNull(); // one phase is just the week
    expect(cleanPhases(phases, 3)).toBeNull(); // weekdays must match the days
    expect(cleanPhases([{ ...phases[0], kind: "taper" }, phases[1]], 2)).toBeNull();
    expect(cleanPhases([{ ...phases[0], weeks: 16 }, phases[1]], 2)).toBeNull(); // 17 weeks in all
    expect(cleanPhases([{ ...phases[0], weekdays: [[1], [1]] }, phases[1]], 2)).toBeNull(); // a weekday twice
    expect(cleanPhases([phases[0], { ...phases[1], weekdays: [[], []] }], 2)).toBeNull(); // no workout
  });

  it("finds this week's phase and week, and stays on the last one", () => {
    const src = { startedAt: START, weeks: 4, weekdays: [[1, 4], [2]], phases: cleanPhases(phases, 2)! };
    expect(phaseAt(src, START + 2 * DAY)).toMatchObject({ index: 0, kind: "build", week: 1, weeks: 3 });
    expect(phaseAt(src, START + 15 * DAY)).toMatchObject({ index: 0, week: 3 });
    expect(phaseAt(src, START + 22 * DAY)).toMatchObject({ index: 1, kind: "deload", week: 1, weekdays: [[1], []] });
    expect(phaseAt(src, START + 60 * DAY)).toMatchObject({ index: 1 });
    expect(phaseAt({ startedAt: START, weeks: 6, weekdays: [[1]] }, START + 20 * DAY)).toMatchObject({ kind: "build", week: 3, weeks: 6 });
  });
});
