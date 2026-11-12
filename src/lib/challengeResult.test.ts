// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { challengeDays, challengeResult, markResultSeen, rematchHandles, unseenResult } from "./challengeResult";
import { challengeShare } from "./shareCards";
import type { Challenge, ChallengeMember } from "./socialTypes";

// Challenge results (docs/decisions/friends.md, gap list 3 item 5).
const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const m = (name: string, value: number, over: Partial<ChallengeMember> = {}): ChallengeMember => ({
  handle: name.toLowerCase(),
  name,
  avatar: "",
  me: false,
  joined: true,
  value,
  ...over,
});
const done = (members: ChallengeMember[], over: Partial<Challenge> = {}): Challenge => ({
  id: "c1",
  name: "Most sets",
  metric: "sets",
  startsAt: NOW - 15 * DAY,
  endsAt: NOW - DAY,
  owner: { handle: "alex", name: "Alex" },
  mine: true,
  status: "joined",
  members,
  ...over,
});

beforeEach(() => localStorage.clear());

describe("challenge results", () => {
  it("says where the lifter finished, out of the members who joined", () => {
    const c = done([m("Alex", 30, { me: true }), m("Blair", 40), m("Casey", 10), m("Drew", 99, { joined: false })]);
    expect(challengeResult(c, NOW)).toEqual({ place: 2, of: 3, score: 30, won: false, tie: false, winners: ["Blair"] });
    expect(challengeResult(done([m("Alex", 40, { me: true }), m("Blair", 40)]), NOW)).toMatchObject({ won: true, tie: true });
    // Nobody scored: no winner.
    expect(challengeResult(done([m("Alex", 0, { me: true }), m("Blair", 0)]), NOW)).toMatchObject({ won: false, winners: [] });
  });

  it("is nothing while it runs, for an invite, or without the lifter", () => {
    expect(challengeResult(done([m("Alex", 1, { me: true })], { endsAt: NOW + DAY }), NOW)).toBeNull();
    expect(challengeResult(done([m("Alex", 1, { me: true })], { status: "invited" }), NOW)).toBeNull();
    expect(challengeResult(done([m("Blair", 1)]), NOW)).toBeNull();
  });

  it("shows each result's moment once on this device", () => {
    const a = done([m("Alex", 3, { me: true }), m("Blair", 1)]);
    const b = done([m("Alex", 3, { me: true }), m("Blair", 1)], { id: "c2" });
    expect(unseenResult([a, b], NOW)?.id).toBe("c1");
    markResultSeen("c1");
    expect(unseenResult([a, b], NOW)?.id).toBe("c2");
    markResultSeen("c2");
    expect(unseenResult([a, b], NOW)).toBeNull();
  });

  it("starts a rematch with the same length and the friends who joined", () => {
    const c = done([m("Alex", 3, { me: true }), m("Blair", 1), m("Casey", 0, { joined: false })]);
    expect(challengeDays(c)).toBe(14);
    expect(challengeDays({ ...c, startsAt: NOW - 8 * DAY })).toBe(7);
    expect(rematchHandles(c)).toEqual(["blair"]);
  });

  it("puts only the lifter's own place and total on the share card", () => {
    const card = challengeShare({ id: "c1", name: "Most sets", days: 14 }, { place: 2, of: 3, won: false, tie: false }, "30 sets", {
      unit: "kg",
      game: { level: { level: 3, title: "Iron" }, streak: { weeks: 0 } } as never,
    }).card({ weights: true, name: null });
    expect(card).toMatchObject({ headline: "Most sets", big: { value: "No. 2", label: "out of 3" }, medal: { icon: "2" } });
    expect(card.tiles).toEqual([
      ["My total", "30 sets"],
      ["Length", "2 weeks"],
    ]);
    expect(JSON.stringify(card)).not.toMatch(/Blair/);
  });
});
