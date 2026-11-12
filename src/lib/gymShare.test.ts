import { describe, expect, it } from "vitest";

import { makeTestGym } from "@/test/factories";

import { decodeGym, encodeGym, gymCodeFromLink, gymUrl, kitOf, sameKit } from "./gymShare";

const b64 = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

describe("gym links", () => {
  it("round-trips a gym's kit", () => {
    const gym = makeTestGym("commercial", "kg", { name: "Iron Works" });
    expect(decodeGym(encodeGym(kitOf(gym)))).toEqual({
      ...kitOf(gym),
      bars: gym.bars.map((b, i) => ({ ...b, id: `bar-${i + 1}` })),
      plates: [...gym.plates].sort((a, b) => b.weight - a.weight),
    });
  });

  it("never carries the gym's place or machine settings", () => {
    const gym = makeTestGym("commercial", "lb", {
      place: { lat: 49.283, lon: -123.121, radiusM: 300 },
      settings: { "leg-press": [{ label: "Seat", value: "4" }] },
    });
    const code = encodeGym(kitOf(gym));
    const json = atob(code.split("~")[1]!.replace(/-/g, "+").replace(/_/g, "/"));
    expect(json).not.toContain("49.283");
    expect(json).not.toContain("Seat");
    expect(decodeGym(code)).not.toHaveProperty("place");
  });

  it("keeps a name with accents and emoji, and drops control characters", () => {
    const gym = makeTestGym("home", "kg", { name: "Café\u0007 gym 💪" });
    expect(decodeGym(encodeGym(kitOf(gym)))!.name).toBe("Café  gym 💪");
  });

  it("drops unknown equipment and bad numbers, so newer links still open", () => {
    const body = {
      n: "X",
      u: "kg",
      e: ["barbell", "laserCannon"],
      b: [
        ["Bar", 20],
        ["Huge", 9999],
      ],
      p: [
        [20, 4],
        [-5, 2],
        ["x", 1],
      ],
      d: [10, 10, 12, -1],
      k: "nope",
      m: 5,
    };
    const kit = decodeGym(`g1~${b64(JSON.stringify(body))}`)!;
    expect(kit.equipment).toEqual(["barbell"]);
    expect(kit.bars).toEqual([{ id: "bar-1", name: "Bar", weight: 20 }]);
    expect(kit.plates).toEqual([{ weight: 20, count: 4 }]);
    expect(kit.dumbbells).toEqual([10, 12]);
    expect(kit.kettlebells).toEqual([]);
  });

  it("opens nothing for junk, another version or a bad unit", () => {
    expect(decodeGym("garbage")).toBeNull();
    expect(decodeGym(`g2~${b64("{}")}`)).toBeNull();
    expect(decodeGym(`g1~${b64(JSON.stringify({ u: "stone" }))}`)).toBeNull();
    expect(decodeGym("g1~%%%")).toBeNull();
  });

  it("finds the code in a pasted link, even when an app encoded it again", () => {
    const code = encodeGym(kitOf(makeTestGym()));
    expect(gymCodeFromLink(`Try my gym ${gymUrl(code)}`)).toBe(code);
    expect(gymCodeFromLink(encodeURIComponent(code))).toBe(encodeURIComponent(code));
    expect(gymCodeFromLink("https://www.getliftsmith.com/app/#/routine/r1~x")).toBeNull();
  });

  it("knows when a gym already has the same kit, whatever its name", () => {
    const gym = makeTestGym("commercial", "kg", { name: "Mine" });
    const kit = decodeGym(encodeGym({ ...kitOf(gym), name: "Theirs" }))!;
    expect(sameKit(gym, kit)).toBe(true);
    expect(sameKit(gym, { ...kit, dumbbells: kit.dumbbells.slice(1) })).toBe(false);
    expect(sameKit(makeTestGym("home", "kg"), kit)).toBe(false);
  });
});
