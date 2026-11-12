import { describe, expect, it } from "vitest";

import { kindOf, MachineTally, parseBike, parseCrossTrainer, parseRower, parseTreadmill } from "./ftms";

/** Little-endian bytes as a DataView, from [value, byteCount] pairs. */
function bytes(...fields: [number, number][]): DataView {
  const out: number[] = [];
  for (const [v, n] of fields) for (let i = 0; i < n; i++) out.push((v >> (8 * i)) & 0xff);
  return new DataView(new Uint8Array(out).buffer);
}

describe("FTMS parsers", () => {
  it("reads a bike's speed, cadence, distance, power, heart rate and time", () => {
    // Speed (bit 0 clear), cadence (2), distance (4), power (6), heart rate (9), elapsed time (11).
    const flags = (1 << 2) | (1 << 4) | (1 << 6) | (1 << 9) | (1 << 11);
    const r = parseBike(bytes([flags, 2], [2850, 2], [180, 2], [4321, 3], [212, 2], [148, 1], [605, 2]));
    expect(r).toEqual({ kind: "bike", speedKmh: 28.5, cadence: 90, distanceM: 4321, powerW: 212, heartRate: 148, elapsedS: 605 });
  });

  it("skips the fields it doesn't use without losing its place", () => {
    // More Data set (no speed), average speed (1), resistance (5), average power (7), energy (8), elapsed (11).
    const flags = 1 | (1 << 1) | (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8) | (1 << 11);
    const r = parseBike(bytes([flags, 2], [2000, 2], [40, 2], [150, 2], [140, 2], [99, 2], [600, 2], [10, 1], [300, 2]));
    expect(r).toEqual({ kind: "bike", powerW: 150, elapsedS: 300 });
  });

  it("reads a rower's stroke rate, distance, power and time", () => {
    // Stroke rate and count (bit 0 clear), distance (2), pace (3), power (5), elapsed (11).
    const flags = (1 << 2) | (1 << 3) | (1 << 5) | (1 << 11);
    const r = parseRower(bytes([flags, 2], [56, 1], [120, 2], [1500, 3], [118, 2], [180, 2], [420, 2]));
    expect(r).toEqual({ kind: "rower", cadence: 28, distanceM: 1500, powerW: 180, elapsedS: 420 });
  });

  it("reads a treadmill's speed, distance, time and power after its incline", () => {
    // Speed, distance (2), incline and ramp (3), elapsed (10), force and power (12).
    const flags = (1 << 2) | (1 << 3) | (1 << 10) | (1 << 12);
    const r = parseTreadmill(bytes([flags, 2], [1000, 2], [2500, 3], [20, 2], [11, 2], [900, 2], [30, 2], [240, 2]));
    expect(r).toEqual({ kind: "treadmill", speedKmh: 10, distanceM: 2500, elapsedS: 900, powerW: 240 });
  });

  it("reads a cross trainer's 24 bits of flags", () => {
    // Speed, distance (2), steps (3), power (8), elapsed (13).
    const flags = (1 << 2) | (1 << 3) | (1 << 8) | (1 << 13);
    const r = parseCrossTrainer(bytes([flags, 3], [800, 2], [1200, 3], [140, 2], [135, 2], [160, 2], [500, 2]));
    expect(r).toEqual({ kind: "crossTrainer", speedKmh: 8, distanceM: 1200, cadence: 140, powerW: 160, elapsedS: 500 });
  });

  it("drops fields a short packet doesn't have and never reports negative power", () => {
    const flags = (1 << 6) | (1 << 11);
    expect(parseBike(bytes([flags | 1, 2], [-20 & 0xffff, 2]))).toEqual({ kind: "bike", powerW: 0 });
    expect(parseBike(new DataView(new ArrayBuffer(0)))).toEqual({ kind: "bike" });
  });

  it("knows each data characteristic by its short or long id", () => {
    expect(kindOf("00002AD1-0000-1000-8000-00805F9B34FB")).toBe("rower");
    expect(kindOf("2ad2")).toBe("bike");
    expect(kindOf("00002a37-0000-1000-8000-00805f9b34fb")).toBeNull();
  });
});

describe("MachineTally", () => {
  const T = 1_000_000;

  it("takes the machine's totals for the first set, then counts each set from Log set", () => {
    const m = new MachineTally();
    m.add({ kind: "rower", elapsedS: 60, distanceM: 250, powerW: 150 }, T);
    m.add({ kind: "rower", elapsedS: 61, distanceM: 255, powerW: 150 }, T + 1000);
    expect(m.set()).toEqual({ seconds: 61, distanceM: 255, powerW: 150 });
    m.nextSet();
    m.add({ kind: "rower", elapsedS: 62, distanceM: 260, powerW: 200 }, T + 2000);
    m.add({ kind: "rower", elapsedS: 63, distanceM: 266, powerW: 100 }, T + 3000);
    expect(m.set()).toEqual({ seconds: 2, distanceM: 11, powerW: 150 });
  });

  it("carries on when the machine's counters restart", () => {
    const m = new MachineTally();
    m.add({ kind: "bike", elapsedS: 300, distanceM: 2000 }, T);
    m.add({ kind: "bike", elapsedS: 5, distanceM: 30 }, T + 5000);
    expect(m.set()).toEqual({ seconds: 305, distanceM: 2030 });
  });

  it("counts moving seconds on a machine with no clock, and not a stalled link", () => {
    const m = new MachineTally();
    m.add({ kind: "treadmill", speedKmh: 10 }, T);
    m.add({ kind: "treadmill", speedKmh: 10 }, T + 1000);
    m.add({ kind: "treadmill", speedKmh: 10 }, T + 61_000); // a minute with no readings counts at most 3 s
    m.add({ kind: "treadmill", speedKmh: 0 }, T + 62_000); // stopped
    expect(m.set().seconds).toBe(4);
  });

  it("keeps what it had across a dropped link", () => {
    const m = new MachineTally();
    m.add({ kind: "rower", elapsedS: 100, distanceM: 400 }, T);
    m.gap();
    m.add({ kind: "rower", elapsedS: 130, distanceM: 520 }, T + 30_000);
    expect(m.set()).toEqual({ seconds: 130, distanceM: 520 });
  });
});
