import { describe, expect, it } from "vitest";

import { codeFromLink, decodeRoutine, encodeRoutine, routineUrl, sameItems } from "./routineShare";

// Routine links (Melvin, 2026-11-11): the name, exercises, sets and supersets travel in the link.

const items = [
  { exerciseId: "bench-press", sets: 4 },
  { exerciseId: "lateral-raise", sets: 3, group: "ss-lateral-raise" },
  { exerciseId: "cable-pushdown", sets: 3, group: "ss-lateral-raise" },
];

describe("routine links", () => {
  it("round-trips the name, sets and supersets", () => {
    expect(decodeRoutine(encodeRoutine({ name: "Push ~ day / A#1", items }))).toEqual({ name: "Push ~ day / A#1", items });
  });

  it("keeps any language's name", () => {
    expect(decodeRoutine(encodeRoutine({ name: "プッシュの日", items }))!.name).toBe("プッシュの日");
  });

  it("carries nothing but exercises, sets and supersets", () => {
    const code = encodeRoutine({ name: "A", items: [{ exerciseId: "bench-press", sets: 3 }] });
    expect(code).toBe("r1~QQ~bench-press.3");
  });

  it("drops unknown exercises and breaks a superset that loses a partner", () => {
    const code = "r1~TWl4~bench-press.3.s~not-a-lift.3.s~lateral-raise.3.s~cable-pushdown.2";
    expect(decodeRoutine(code)).toEqual({
      name: "Mix",
      items: [
        { exerciseId: "bench-press", sets: 3 },
        { exerciseId: "lateral-raise", sets: 3, group: "ss-lateral-raise" },
        { exerciseId: "cable-pushdown", sets: 2, group: "ss-lateral-raise" },
      ],
    });
  });

  it("drops bad set counts and opens nothing from junk", () => {
    expect(decodeRoutine("r1~QQ~bench-press.0~squat.99")).toBeNull();
    expect(decodeRoutine("garbage")).toBeNull();
    expect(decodeRoutine("r2~QQ~bench-press.3")).toBeNull();
  });

  it("opens a link an app encoded again", () => {
    const code = encodeRoutine({ name: "Push day", items });
    expect(decodeRoutine(encodeURIComponent(code))).toEqual({ name: "Push day", items });
  });

  it("strips control characters from the name and falls back to a default", () => {
    expect(decodeRoutine(`r1~${btoa("A\nb")}~bench-press.3`)!.name).toBe("A b");
    expect(decodeRoutine("r1~%%%~bench-press.3")!.name).toBe("My routine");
    expect(decodeRoutine("r1~~bench-press.3")!.name).toBe("My routine");
  });

  it("finds the code in a pasted link or a bare code", () => {
    const code = encodeRoutine({ name: "Legs", items });
    expect(codeFromLink(`Try this: ${routineUrl(code)} `)).toBe(code);
    expect(codeFromLink(code)).toBe(code);
    expect(codeFromLink("https://www.getliftsmith.com/app/#/today")).toBeNull();
  });

  it("tells the same routine from a different one", () => {
    expect(
      sameItems(
        items,
        items.map((i) => ({ ...i })),
      ),
    ).toBe(true);
    const unlinked = items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets }));
    expect(sameItems(items, unlinked)).toBe(false);
    expect(sameItems(items, items.slice(0, 2))).toBe(false);
  });
});
