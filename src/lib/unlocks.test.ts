import { describe, expect, it } from "vitest";

import { anyLocked, firstReveal, HEAD_START, isUnlocked, justUnlocked, nextUnlock, unlockCount, UNLOCKS } from "./unlocks";

const fresh = { reveal: firstReveal("new") };

describe("unlocks", () => {
  it("keeps everything for a profile from before unlocks", () => {
    for (const u of UNLOCKS) expect(isUnlocked(u.id, {}, 0)).toBe(true);
    expect(anyLocked({}, 0)).toBe(false);
    expect(justUnlocked({}, 1)).toEqual([]);
  });

  it("opens each feature at its workout, in order", () => {
    expect(UNLOCKS.map((u) => [u.id, u.at])).toEqual([
      ["awards", 1],
      ["quests", 2],
      ["friends", 3],
      ["seasons", 5],
      ["more", 8],
    ]);
    expect(isUnlocked("awards", fresh, 0)).toBe(false);
    expect(isUnlocked("awards", fresh, 1)).toBe(true);
    expect(isUnlocked("seasons", fresh, 4)).toBe(false);
    expect(isUnlocked("seasons", fresh, 5)).toBe(true);
    expect(anyLocked(fresh, 7)).toBe(true);
    expect(anyLocked(fresh, 8)).toBe(false);
  });

  it("gives an experienced lifter a head start", () => {
    const r = firstReveal("advanced");
    expect(r.head).toBe(HEAD_START);
    expect(isUnlocked("friends", { reveal: r }, 0)).toBe(true);
    expect(isUnlocked("seasons", { reveal: r }, 1)).toBe(false);
    expect(isUnlocked("seasons", { reveal: r }, 2)).toBe(true);
  });

  it("never hides something again after a workout is deleted", () => {
    const p = { reveal: { head: 0, peak: 5 } };
    expect(unlockCount(p.reveal, 2)).toBe(5);
    expect(isUnlocked("seasons", p, 2)).toBe(true);
  });

  it("shows everything with the switch on", () => {
    const p = { reveal: { head: 0, all: true } };
    expect(isUnlocked("more", p, 0)).toBe(true);
    expect(justUnlocked(p, 1)).toEqual([]);
    expect(nextUnlock(p, 0)).toBeNull();
  });

  it("names only what this workout opened", () => {
    expect(justUnlocked(fresh, 1)).toEqual(["awards"]);
    expect(justUnlocked(fresh, 4)).toEqual([]);
    expect(justUnlocked(fresh, 5)).toEqual(["seasons"]);
    // Already counted (the peak was saved): no second moment.
    expect(justUnlocked({ reveal: { head: 0, peak: 5 } }, 5)).toEqual([]);
    // Imported history opens things quietly; the next real workout gets its own moment.
    expect(justUnlocked(fresh, 40)).toEqual([]);
  });

  it("says what comes next", () => {
    expect(nextUnlock(fresh, 3)).toEqual({ id: "seasons", left: 2 });
    expect(nextUnlock(fresh, 8)).toBeNull();
  });
});
