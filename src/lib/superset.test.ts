import { describe, expect, it } from "vitest";

import {
  afterSet,
  applyLinks,
  groupedSeconds,
  groupRange,
  linksOf,
  roundRest,
  supersetLabel,
  SWITCH_REST,
  toggleLink,
  withLinks,
} from "./superset";

const it3: { exerciseId: string; sets: number; restSec: number; group?: string }[] = [
  { exerciseId: "a", sets: 3, restSec: 120 },
  { exerciseId: "b", sets: 3, restSec: 75 },
  { exerciseId: "c", sets: 2, restSec: 60 },
];

describe("supersets", () => {
  it("links and splits neighbours", () => {
    const one = toggleLink(it3, 0);
    expect(one.map((i) => i.group)).toEqual(["ss-a", "ss-a", undefined]);
    expect(groupRange(one, 1)).toEqual([0, 1]);
    const three = toggleLink(one, 1);
    expect(three.map((i) => i.group)).toEqual(["ss-a", "ss-a", "ss-a"]);
    const split = toggleLink(three, 0);
    expect(split.map((i) => i.group)).toEqual([undefined, "ss-b", "ss-b"]);
    expect(linksOf(split)).toEqual([false, true]);
    // Out of range does nothing.
    expect(toggleLink(it3, 2).map((i) => i.group)).toEqual([undefined, undefined, undefined]);
  });

  it("keeps the lifter's links and splits when the plan is rebuilt", () => {
    // Linked on Today, then the plan is rebuilt without groups: the link comes back.
    expect(applyLinks(it3, ["a>b"]).map((i) => i.group)).toEqual(["ss-a", "ss-a", undefined]);
    // A plan that links b and c itself (a routine): splitting it on Today must stick across a rebuild.
    const routine = withLinks(it3, [false, true]);
    expect(applyLinks(routine, ["!b>c"]).map((i) => i.group)).toEqual([undefined, undefined, undefined]);
    expect(applyLinks(routine, ["a>b", "!b>c"]).map((i) => i.group)).toEqual(["ss-a", "ss-a", undefined]);
    // Pairs no longer next to each other are left alone.
    expect(applyLinks(it3, ["a>c"]).map((i) => i.group)).toEqual([undefined, undefined, undefined]);
  });

  it("alternates through a round, then rests the longest rest", () => {
    const items = withLinks(it3, [true, false]);
    const done = new Map<number, number>();
    const log = (i: number) => {
      done.set(i, (done.get(i) ?? 0) + 1);
      return afterSet(items, i, (k) => done.get(k) ?? 0);
    };
    expect(log(0)).toEqual({ index: 1, rest: SWITCH_REST, finished: false });
    expect(log(1)).toEqual({ index: 0, rest: 120, finished: false });
    log(0);
    log(1);
    expect(log(0)).toEqual({ index: 1, rest: SWITCH_REST, finished: true });
    // Both done: on to the next exercise, after a full rest.
    expect(log(1)).toEqual({ index: 2, rest: 120, finished: true });
    expect(log(2)).toEqual({ index: 2, rest: 60, finished: false });
    expect(log(2)).toEqual({ index: 3, rest: 60, finished: true });
  });

  it("keeps going on the one with sets left when set counts differ", () => {
    const items = withLinks(
      [
        { exerciseId: "a", sets: 1, restSec: 90 },
        { exerciseId: "b", sets: 3, restSec: 60 },
      ],
      [true],
    );
    const done = new Map<number, number>([[0, 1]]);
    expect(afterSet(items, 0, (k) => done.get(k) ?? 0)).toEqual({ index: 1, rest: SWITCH_REST, finished: true });
    done.set(1, 1);
    // Only b is left: its own rest, not the round's.
    expect(afterSet(items, 1, (k) => done.get(k) ?? 0)).toEqual({ index: 1, rest: 60, finished: false });
    expect(roundRest(items, 1)).toBe(90);
  });

  it("labels each exercise in a superset", () => {
    const items = withLinks([...it3, { exerciseId: "d", sets: 2, restSec: 60 }], [true, false, true]);
    expect(supersetLabel(items, 0)).toBe("Superset A · 1 of 2");
    expect(supersetLabel(items, 1)).toBe("Superset A · 2 of 2");
    expect(supersetLabel(items, 3)).toBe("Superset B · 2 of 2");
    expect(supersetLabel(it3, 0)).toBeNull();
  });

  it("saves time: one rest per round instead of one per set", () => {
    const alone = (i: number) => 60 + it3[i].sets * 40 + (it3[i].sets - 1) * it3[i].restSec;
    const plain = groupedSeconds(it3, (i) => alone(i));
    const paired = groupedSeconds(withLinks(it3, [true, false]), (i) => alone(i));
    // a and b alone: 2 rests each between sets plus 75 s before b. Paired: 2 round rests of 120 and 3 switches.
    expect(plain - paired).toBe(2 * 120 + 2 * 75 + 75 - (2 * 120 + 3 * SWITCH_REST));
    expect(paired).toBeLessThan(plain);
  });
});
