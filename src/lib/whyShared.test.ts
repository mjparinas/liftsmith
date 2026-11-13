// Today says a reason every exercise shares once, above the list, and keeps each row to what's its own.
import { describe, expect, it } from "vitest";

import { itemWhyWithoutLoad, sharedLoadNote, type ItemWhy } from "./why";

const why = (pick: string, load: string, sets?: string): ItemWhy => ({
  pick,
  load,
  sets,
  short: [pick, sets, load].filter(Boolean).join(" · "),
});

describe("shared reasons on Today", () => {
  it("finds the load note when every exercise has the same one", () => {
    expect(
      sharedLoadNote([
        why("Quads 100% recovered", "first time: find your level"),
        why("Lats 90% recovered", "first time: find your level"),
      ]),
    ).toBe("first time: find your level");
  });

  it("finds none when the notes differ, when one is empty, or with a single exercise", () => {
    expect(sharedLoadNote([why("Quads", "first time: a cautious start"), why("Lats", "first time: find your level")])).toBe("");
    expect(sharedLoadNote([why("Quads", ""), why("Lats", "")])).toBe("");
    expect(sharedLoadNote([why("Quads", "first time: find your level")])).toBe("");
  });

  it("keeps the row's own pick and set reasons, capitalized, without the load", () => {
    expect(itemWhyWithoutLoad(why("quads 100% recovered", "same", "one more set: you're fresh"))).toBe(
      "Quads 100% recovered · one more set: you're fresh",
    );
  });
});
