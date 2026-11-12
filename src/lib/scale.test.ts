import { afterEach, describe, expect, it, vi } from "vitest";

import { BODY_GRACE_MS, parseBodyComposition, parseWeight, sane, ScaleTally } from "./scale";

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);
const le = (n: number) => [n & 0xff, (n >> 8) & 0xff];

afterEach(() => {
  vi.useRealTimers();
});

describe("weight measurement", () => {
  it("reads kilograms in 0.005 kg and pounds in 0.01 lb", () => {
    expect(parseWeight(view(0x00, ...le(16420)))).toEqual({ kg: 82.1 });
    expect(parseWeight(view(0x01, ...le(18100)))).toEqual({ kg: 82.1 });
    // A time stamp after the weight changes nothing.
    expect(parseWeight(view(0x02, ...le(16000), 0xea, 0x07, 11, 12, 7, 30, 0))).toEqual({ kg: 80 });
  });

  it("ignores a failed measurement and short packets", () => {
    expect(parseWeight(view(0x00, 0xff, 0xff))).toBeNull();
    expect(parseWeight(view(0x00, 0x10))).toBeNull();
  });
});

describe("body composition measurement", () => {
  it("reads body fat, and the weight past the optional fields before it", () => {
    // Flags: time stamp (bit 1), muscle % (bit 4), impedance (bit 9), weight (bit 10).
    const flags = (1 << 1) | (1 << 4) | (1 << 9) | (1 << 10);
    const v = view(...le(flags), ...le(182), 0xea, 0x07, 11, 12, 7, 30, 0, ...le(400), ...le(5000), ...le(16420));
    expect(parseBodyComposition(v)).toEqual({ bodyFat: 18.2, kg: 82.1 });
  });

  it("reads body fat alone, in pounds the weight too", () => {
    expect(parseBodyComposition(view(...le(0), ...le(205)))).toEqual({ bodyFat: 20.5 });
    expect(parseBodyComposition(view(...le(1 | (1 << 10)), ...le(205), ...le(18100)))).toEqual({ bodyFat: 20.5, kg: 82.1 });
    expect(parseBodyComposition(view(...le(0), 0xff, 0xff))).toBeNull();
  });
});

describe("the tally", () => {
  it("keeps only readings a weigh-in can take", () => {
    expect(sane({ kg: 3, bodyFat: 18 })).toEqual({ bodyFat: 18 });
    expect(sane({ kg: 80, bodyFat: 90 })).toEqual({ kg: 80 });
  });

  it("finishes at once with weight and body fat, or a moment after a weight alone", () => {
    vi.useFakeTimers();
    const both = vi.fn();
    const a = new ScaleTally(both);
    a.add({ bodyFat: 18 });
    expect(both).not.toHaveBeenCalled();
    a.add({ kg: 81.9 });
    expect(both).toHaveBeenCalledWith({ kg: 81.9, bodyFat: 18 });

    const alone = vi.fn();
    const b = new ScaleTally(alone);
    b.add({ kg: 80 });
    b.add({ kg: 80.2 });
    vi.advanceTimersByTime(BODY_GRACE_MS - 1);
    expect(alone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(alone).toHaveBeenCalledTimes(1);
    expect(alone).toHaveBeenCalledWith({ kg: 80.2 });
    b.add({ bodyFat: 20 });
    expect(alone).toHaveBeenCalledTimes(1);
  });
});
