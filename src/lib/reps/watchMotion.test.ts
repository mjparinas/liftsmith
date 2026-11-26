import { describe, expect, it } from "vitest";

import { barSpeed } from "./barSpeed";
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

  it("gives each rep's lifting speed in metres a second for wrist bar speed", () => {
    const c = new WatchRepCount(imuProfile("back-squat", "squat")!);
    expect(c.summary()).toBeUndefined();
    for (const b of batches(squats(5))) c.push(parseWatchMotion(b));
    const sum = c.summary()!;
    expect(sum.full).toBe(5);
    const full = sum.reps.filter((r) => r.kind === "full");
    for (const r of full) {
      expect(r.speedIsMetres).toBe(true);
      // A half-metre squat lifted in well under two seconds: a believable bar speed, not signal units.
      expect(r.speed).toBeGreaterThan(0.1);
      expect(r.speed).toBeLessThan(3);
    }
    const read = barSpeed(sum)!;
    expect(read.metres).toBe(true);
    expect(read.speed).toBe(full[full.length - 1]!.speed);
  });

  it("keeps the last reps' summary after a pause ends the counter's set", () => {
    const c = new WatchRepCount(imuProfile("back-squat", "squat")!);
    const reps = squats(4);
    for (const b of batches(reps)) c.push(parseWatchMotion(b));
    // Thirty seconds standing still: the counter closes its set and starts a fresh one with nothing in it.
    const end = reps[reps.length - 1]!.t;
    const still = Array.from({ length: 1500 }, (_, i) => ({ t: end + 20 + i * 20, up: 0, rot: 0 }));
    for (const b of batches(still)) c.push(parseWatchMotion(b));
    expect(c.reps).toBe(4);
    expect(c.summary()?.full).toBe(4);
  });

  it("only offers lifts where the wrist moves", () => {
    expect(watchCountable("back-squat", "squat")).toBe(true);
    expect(watchCountable("barbell-curl", "isolation")).toBe(true);
    expect(watchCountable("pull-up", "vpull")).toBe(false);
  });
});
