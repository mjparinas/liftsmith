import { describe, expect, it } from "vitest";

import { challengeNudge, daysLeft, isOver, standings, winners } from "./challenge";
import type { Challenge, ChallengeMember } from "./socialTypes";

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const member = (name: string, value: number, over: Partial<ChallengeMember> = {}): ChallengeMember => ({
  handle: name.toLowerCase(),
  name,
  avatar: "",
  me: false,
  joined: true,
  value,
  ...over,
});
const challenge = (members: ChallengeMember[], over: Partial<Challenge> = {}): Challenge => ({
  id: "c1",
  name: "Most sets",
  metric: "sets",
  startsAt: NOW - DAY,
  endsAt: NOW + 6 * DAY,
  owner: { handle: "alex", name: "Alex" },
  mine: false,
  status: "joined",
  members,
  ...over,
});

describe("friend challenges", () => {
  it("ranks joined members only, ties sharing a place", () => {
    const c = challenge([
      member("Alex", 30),
      member("Blair", 40),
      member("Casey", 30, { me: true }),
      member("Drew", 99, { joined: false }),
    ]);
    expect(standings(c).map((r) => [r.name, r.place, r.sets])).toEqual([
      ["Blair", 1, 40],
      ["Alex", 2, 30],
      ["Casey", 2, 30],
    ]);
  });

  it("says how far behind the next person the lifter is, and nothing before they join", () => {
    const people = [member("Alex", 30), member("Blair", 40, { me: true }), member("Casey", 55)];
    expect(challengeNudge(challenge(people))).toEqual({ kind: "chase", name: "Casey", gap: 15 });
    expect(challengeNudge(challenge(people, { status: "invited" }))).toBeNull();
  });

  it("counts days left, rounding up, and names the winners once it's over", () => {
    const c = challenge([member("Alex", 30), member("Blair", 30)]);
    expect(daysLeft(c, NOW)).toBe(6);
    expect(daysLeft(c, NOW + 5.5 * DAY)).toBe(1);
    expect(daysLeft(c, NOW + 9 * DAY)).toBe(0);
    expect(isOver(c, NOW + 6 * DAY)).toBe(true);
    expect(winners(c)).toEqual(["Alex", "Blair"]);
    expect(winners(challenge([member("Alex", 0)]))).toEqual([]);
  });
});
