import { describe, expect, it } from "vitest";

import { boardNudge, cleanInvite, inviteFromReferrer, inviteUrl, playInviteUrl, rankBoard, weekStart } from "./invite";
import type { BoardRow } from "./socialTypes";

const row = (name: string, workouts: number, me = false): BoardRow => ({
  handle: name.toLowerCase(),
  name,
  avatar: "",
  me,
  workouts,
  sets: workouts * 10,
  minutes: workouts * 45,
  volume: workouts * 4000,
  prs: 0,
});

describe("invite links", () => {
  it("reads codes from links, typing and the Play install referrer", () => {
    expect(cleanInvite("abcd-efgh")).toBe("ABCDEFGH");
    expect(cleanInvite("ABCD0FGH")).toBe(""); // no 0, O, 1 or I
    expect(inviteUrl("ABCDEFGH")).toMatch(/\/app\/#\/invite\/ABCDEFGH$/);
    expect(inviteFromReferrer("utm_source=invite&utm_campaign=ABCDEFGH")).toBe("ABCDEFGH");
    expect(inviteFromReferrer("utm_source=creator&utm_campaign=ABCDEFGH")).toBe("");
    expect(inviteFromReferrer(decodeURIComponent(new URL(playInviteUrl("ABCDEFGH")).searchParams.get("referrer")!))).toBe("ABCDEFGH");
  });
});

describe("the friends leaderboard", () => {
  it("starts the week on Monday at midnight, local time", () => {
    const wed = new Date(2026, 10, 11, 18, 30).getTime();
    expect(new Date(weekStart(wed))).toEqual(new Date(2026, 10, 9));
    expect(new Date(weekStart(wed, 1))).toEqual(new Date(2026, 10, 2));
    expect(new Date(weekStart(new Date(2026, 10, 15, 23).getTime()))).toEqual(new Date(2026, 10, 9)); // Sunday
  });

  it("ranks with shared places for ties", () => {
    const ranked = rankBoard([row("Casey", 2), row("Alex", 3, true), row("Blair", 2)], "workouts");
    expect(ranked.map((r) => [r.name, r.place])).toEqual([
      ["Alex", 1],
      ["Blair", 2],
      ["Casey", 2],
    ]);
  });

  it("says how far behind the next person the lifter is, or that they lead", () => {
    expect(boardNudge([row("Alex", 1, true), row("Blair", 3)], "workouts")).toEqual({ kind: "chase", name: "Blair", gap: 2 });
    expect(boardNudge([row("Alex", 0, true), row("Blair", 1)], "sets")).toEqual({ kind: "chase", name: "Blair", gap: 10 });
    expect(boardNudge([row("Alex", 4, true), row("Blair", 3)], "workouts")).toEqual({ kind: "lead", by: 1 });
    expect(boardNudge([row("Alex", 2, true), row("Blair", 2)], "workouts")).toEqual({ kind: "tied", name: "Blair" });
    expect(boardNudge([row("Alex", 0, true), row("Blair", 0)], "workouts")).toBeNull();
    expect(boardNudge([row("Alex", 3, true)], "workouts")).toBeNull();
  });
});
