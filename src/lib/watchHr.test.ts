import { describe, expect, it } from "vitest";

import { NOW } from "@/test/factories";

import { pickBpm, WATCH_HR_FRESH_MS } from "./watchHr";

describe("pickBpm", () => {
  it("prefers the Bluetooth monitor", () => {
    expect(pickBpm(140, { bpm: 120, at: NOW }, NOW)).toBe(140);
  });

  it("uses a fresh watch reading when there's no monitor", () => {
    expect(pickBpm(null, { bpm: 120, at: NOW - 2_000 }, NOW)).toBe(120);
    expect(pickBpm(null, { bpm: 120, at: NOW - WATCH_HR_FRESH_MS }, NOW)).toBe(120);
  });

  it("drops a watch reading that's gone stale", () => {
    expect(pickBpm(null, { bpm: 120, at: NOW - WATCH_HR_FRESH_MS - 1 }, NOW)).toBeNull();
  });

  it("shows nothing with neither", () => {
    expect(pickBpm(null, null, NOW)).toBeNull();
  });
});
