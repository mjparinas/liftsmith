import { beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "./db";
import { finishedCount, openMonths, recordFinish } from "./monthly";

// The app-wide count of monthly challenge finishers (docs/decisions/friends.md, gap list 3 item 10).
const NOW = Date.UTC(2026, 10, 15, 12);
const DEV = (k: string) => `device-${k}-${"x".repeat(12)}`;

beforeEach(async () => {
  await resetDb();
});

describe("monthly finishers", () => {
  it("counts each device once per month", async () => {
    expect(await recordFinish("2026-11", DEV("a"), NOW)).toBe(true);
    expect(await recordFinish("2026-11", DEV("a"), NOW)).toBe(true);
    expect(await recordFinish("2026-11", DEV("b"), NOW)).toBe(true);
    expect(await finishedCount("2026-11")).toBe(2);
    expect(await finishedCount("2026-10")).toBe(0);
  });

  it("takes only the month that's on, with a little slack at the edges for time zones and late syncs", async () => {
    expect(await recordFinish("2026-10", DEV("a"), NOW)).toBe(false);
    expect(await recordFinish("2026-12", DEV("a"), NOW)).toBe(false);
    expect(openMonths(Date.UTC(2026, 11, 1, 6))).toEqual(new Set(["2026-11", "2026-12"]));
    expect(openMonths(Date.UTC(2026, 10, 30, 20))).toEqual(new Set(["2026-11", "2026-12"]));
  });

  it("refuses junk", async () => {
    for (const [m, d] of [
      ["2026-13", DEV("a")],
      ["november", DEV("a")],
      ["2026-11", "short"],
      ["2026-11", "x'; DROP TABLE month_finishers;--xxxxxx"],
      [null, DEV("a")],
    ])
      expect(await recordFinish(m, d, NOW)).toBe(false);
    expect(await finishedCount("2026-11")).toBe(0);
  });
});
