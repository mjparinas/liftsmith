import { describe, expect, it } from "vitest";

import { imuProfile } from "./imu";
import { imuSamples, simulateSet } from "./simulate";
import { MAX_BATCH, parseWatchMotion, watchCountable, WatchRepCount, type WatchSample } from "./watchMotion";

/** Packs readings the way the watch apps do: a start time and (ms after it, up, rot) for each. */
function batches(samples: readonly WatchSample[], size = 12) {
  const out: { t: number; s: number[] }[] = [];
  for (let i = 0; i < samples.length; i += size) {
    const part = samples.slice(i, i + size);
    const t = part[0]!.t;
    out.push({ t, s: part.flatMap((x) => [x.t - t, x.up, x.rot]) });
  }
  return out;
}

const squats = (n: number, seed = 11) =>
  imuSamples(simulateSet(Array<"full">(n).fill("full"), seed), seed + 1, { romM: 0.5, downFirst: true }).map((x) => ({
    t: 1_700_000_000_000 + x.t,
    up: x.up,
    rot: x.rot,
  }));

describe("watch motion batches", () => {
  it("reads a batch into timed readings", () => {
    expect(parseWatchMotion({ t: 1000, s: [0, 0.5, 0.1, 20, -0.25, 0.2] })).toEqual([
      { t: 1000, up: 0.5, rot: 0.1 },
      { t: 1020, up: -0.25, rot: 0.2 },
    ]);
  });

  it("drops anything that isn't a believable batch", () => {
    for (const junk of [
      null,
      "x",
      { t: "1", s: [] },
      { t: 1, s: [0, 1] },
      { t: 1, s: [0, "1", 0] },
      { t: 1, s: [0, 1, -1] },
      { t: 1, s: [0, 500, 0] },
      { t: 1, s: [-5, 1, 0] },
      { t: Number.NaN, s: [0, 1, 0] },
      { t: 1, s: Array<number>((MAX_BATCH + 1) * 3).fill(0) },
    ])
      expect(parseWatchMotion(junk)).toEqual([]);
  });
});

describe("watch rep counting", () => {
  it("counts squats sent in batches", () => {
    const c = new WatchRepCount(imuProfile("back-squat", "squat")!);
    let n = 0;
    for (const b of batches(squats(5))) n = c.push(parseWatchMotion(b));
    expect(n).toBe(5);
  });

  it("skips a batch that arrives twice", () => {
    const c = new WatchRepCount(imuProfile("back-squat", "squat")!);
    let n = 0;
    for (const b of batches(squats(4))) {
      c.push(parseWatchMotion(b));
      n = c.push(parseWatchMotion(b));
    }
    expect(n).toBe(4);
  });

  it("only offers lifts where the wrist moves", () => {
    expect(watchCountable("back-squat", "squat")).toBe(true);
    expect(watchCountable("barbell-curl", "isolation")).toBe(true);
    expect(watchCountable("pull-up", "vpull")).toBe(false);
  });
});
