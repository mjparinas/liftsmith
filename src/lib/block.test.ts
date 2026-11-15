import { describe, expect, it } from "vitest";

import { blockWeek, weekStart } from "./block";
import { defaultProfile } from "./defaults";
import { weekOf } from "./derive";

describe("block weeks are calendar weeks", () => {
  // Number audit (2026-11-15): Body counted "this week" from the block's start, Progress from the calendar week.
  const mon = new Date(2026, 10, 2, 0, 0).getTime(); // Monday
  const p = (blockStart: number) => ({ ...defaultProfile(), blockStart, blockWeeks: 4, experience: "intermediate" as const });
  it("starts this week's count at the start of the calendar week, wherever the block began", () => {
    const thu = mon + 3 * 86_400_000 + 15 * 3_600_000;
    expect(weekStart(p(mon - 14 * 86_400_000 + 3 * 86_400_000 + 9 * 3_600_000), thu)).toBe(weekOf(thu));
    expect(weekStart(p(mon + 86_400_000), thu)).toBe(mon);
  });
  it("counts a block started midweek from that calendar week", () => {
    const started = mon + 2 * 86_400_000 + 10 * 3_600_000; // Wednesday
    expect(blockWeek(p(started), mon + 5 * 86_400_000).week).toBe(0);
    expect(blockWeek(p(started), mon + 7 * 86_400_000).week).toBe(1); // the next Monday is week 2
  });
});
