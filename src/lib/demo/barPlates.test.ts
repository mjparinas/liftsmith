import { describe, expect, it } from "vitest";

import { loadBar } from "@/lib/plates";

import {
  barDiscs,
  DECORATIVE,
  DECORATIVE_SMALL,
  DECORATIVE_TRAP,
  discSize,
  loadingKey,
  poleDiscs,
  poleRadii,
  sleeveStack,
  trapDiscs,
} from "./barPlates";

const LB = [
  { weight: 45, count: 8 },
  { weight: 35, count: 2 },
  { weight: 25, count: 4 },
  { weight: 10, count: 4 },
  { weight: 5, count: 4 },
  { weight: 2.5, count: 2 },
];

describe("barPlates", () => {
  it("keeps a decorative stack when no loading is passed", () => {
    expect(barDiscs(null, null, false)).toEqual([...DECORATIVE]);
    expect(barDiscs(undefined, "lb", true)).toEqual([...DECORATIVE_SMALL]);
    expect(trapDiscs(null, "kg")).toEqual([...DECORATIVE_TRAP]);
    expect(poleDiscs(null, "lb")).toBeNull();
    expect(poleRadii(null, "lb")).toBeNull();
  });

  it("stacks two 45 lb plates per side for 225 on a 45 lb bar", () => {
    const loading = loadBar(225, 45, LB);
    expect(loading.perSide).toEqual([45, 45]);
    const discs = barDiscs(loading, "lb", false);
    expect(discs).toHaveLength(2);
    expect(discs[0]!.r).toBeGreaterThan(discs[1]!.r - 1e-9); // same size here
    expect(discs[0]!.z).toBeLessThan(discs[1]!.z); // heaviest nearer the collar
    expect(loadingKey(loading, "lb")).toBe("lb:0:45,45");
  });

  it("draws an empty bar as collars only (no discs)", () => {
    const loading = loadBar(45, 45, LB);
    expect(loading.perSide).toEqual([]);
    expect(barDiscs(loading, "lb", false)).toEqual([]);
    expect(trapDiscs(loading, "lb")).toEqual([]);
  });

  it("scales discs down for a small curl bar", () => {
    const loading = loadBar(65, 45, LB); // 10 lb each side
    const full = barDiscs(loading, "lb", false);
    const small = barDiscs(loading, "lb", true);
    expect(small).toHaveLength(full.length);
    expect(small[0]!.r).toBeCloseTo(full[0]!.r * 0.55, 5);
    expect(small[0]!.z).toBeLessThan(0.5);
  });

  it("puts landmine plates on one end as discs with thickness, heaviest first", () => {
    const loading = loadBar(135, 45, LB, true); // 90 on one end → two 45s
    expect(loading.oneEnd).toBe(true);
    expect(loading.perSide).toEqual([45, 45]);
    const size = discSize(45, "lb");
    expect(poleDiscs(loading, "lb")).toEqual([size, size]);
    expect(poleRadii(loading, "lb")).toEqual([size.r, size.r]);
    expect(poleDiscs({ ...loading, perSide: [] }, "lb")).toEqual([]);
  });

  it("sizes heavier plates larger", () => {
    expect(discSize(45, "lb").r).toBeGreaterThan(discSize(10, "lb").r);
    expect(discSize(25, "kg").r).toBeGreaterThan(discSize(5, "kg").r);
  });

  it("caps the sleeve at eight discs", () => {
    const many = Array(12).fill(2.5);
    expect(sleeveStack(many, "lb", 0.5)).toHaveLength(8);
  });
});

describe("landmine pole discs", () => {
  it("always returns a fixed segment count so the 3D buffer stays sized", async () => {
    const { POLE_SEGMENTS, POLE_MAX_PLATES, poleSegments } = await import("./rig");
    const J = {
      handL: [0.2, 1.2, -0.05] as [number, number, number],
      handR: [0.2, 1.2, 0.05] as [number, number, number],
    };
    // minimal joints the pole reader needs (Proxy fills the rest)
    const joints = new Proxy(J, {
      get: (t, k) => (k in t ? t[k as keyof typeof J] : ([0, 0, 0] as [number, number, number])),
    }) as unknown as import("./rig").Joints;
    const none = poleSegments({ kind: "pole", from: [1.4, 0.03, 0], to: "hands", past: 0.08, plates: [] }, joints);
    const many = poleSegments(
      {
        kind: "pole",
        from: [1.4, 0.03, 0],
        to: "hands",
        past: 0.08,
        plates: [
          { r: 0.22, w: 0.05 },
          { r: 0.22, w: 0.05 },
          { r: 0.18, w: 0.035 },
        ],
      },
      joints,
    );
    expect(none).toHaveLength(POLE_SEGMENTS);
    expect(many).toHaveLength(POLE_SEGMENTS);
    // shaft (4) + per disc: two 16-seg rings + 8 thickness edges
    expect(POLE_SEGMENTS).toBe(4 + (16 + 16 + 8) * POLE_MAX_PLATES);
  });
});
