import { describe, expect, it } from "vitest";

import { friendNotes } from "./friendNotes";
import type { BoardRow, Challenge, FriendSignals } from "./socialTypes";

// Friend nudges in coach's notes (docs/decisions/friends.md, gap list 2 item 9).
const DAY = 86_400_000;
const NOW = new Date(2026, 10, 12, 12).getTime(); // a Thursday
const row = (handle: string, workouts: number, me = false): BoardRow => ({
  handle,
  name: handle.charAt(0).toUpperCase() + handle.slice(1),
  avatar: "",
  me,
  workouts,
  sets: 0,
  minutes: 0,
  volume: 0,
  prs: 0,
});
const challenge = (over: Partial<Challenge> = {}): Challenge => ({
  id: "ch1",
  name: "",
  metric: "workouts",
  startsAt: NOW - 5 * DAY,
  endsAt: NOW + 2 * DAY,
  owner: { handle: "blair", name: "Blair" },
  mine: false,
  status: "joined",
  members: [
    { handle: "alex", name: "Alex", avatar: "", me: true, joined: true, value: 2 },
    { handle: "blair", name: "Blair", avatar: "", me: false, joined: true, value: 4 },
  ],
  ...over,
});
const none: FriendSignals = { week: [], challenges: [], quiet: [] };
const profile = { unit: "kg" as const, daysPerWeek: 3 };

describe("friend notes", () => {
  it("says a challenge is slipping away in its last three days, with the gap and one thing to do", () => {
    const [n] = friendNotes({ ...none, challenges: [challenge()] }, { profile, now: NOW, mine: 2 });
    expect(n).toMatchObject({ tone: "warn", title: "Catch Blair in Most workouts", why: "Blair is 2 workouts ahead, with 2 days left." });
    expect(n!.action).toMatchObject({ kind: "go", route: "friends/board" });
    // Not with a week to go, not when leading, not when only invited.
    expect(friendNotes({ ...none, challenges: [challenge({ endsAt: NOW + 6 * DAY })] }, { profile, now: NOW, mine: 2 })).toEqual([]);
    expect(friendNotes({ ...none, challenges: [challenge({ status: "invited" })] }, { profile, now: NOW, mine: 2 })).toEqual([]);
  });

  it("points out a friend pulling ahead only while the lifter is short of their weekly goal", () => {
    const week = [row("alex", 1, true), row("blair", 3), row("casey", 2)];
    const [n] = friendNotes({ ...none, week }, { profile, now: NOW, mine: 1 });
    expect(n).toMatchObject({ title: "Blair is ahead this week", why: "Blair has 3 workouts this week; you have 1 workout." });
    expect(friendNotes({ ...none, week }, { profile, now: NOW, mine: 3 })).toEqual([]);
    expect(friendNotes({ ...none, week: [row("blair", 2)] }, { profile, now: NOW, mine: 1 })).toEqual([]);
  });

  it("suggests checking in on a friend who went quiet, opening their profile, and never shows more than two", () => {
    const quiet = [{ handle: "drew", name: "Drew", avatar: "", lastAt: NOW - 12 * DAY, before: 9 }];
    const [n] = friendNotes({ ...none, quiet }, { profile, now: NOW, mine: 3 });
    expect(n).toMatchObject({
      title: "Check in on Drew",
      why: "Drew hasn’t posted a workout in 12 days, after 9 in the six weeks before.",
    });
    expect(n!.action).toMatchObject({ kind: "go", route: "person/drew" });
    const all = friendNotes({ week: [row("blair", 3)], challenges: [challenge()], quiet }, { profile, now: NOW, mine: 0 });
    expect(all.map((x) => x.id.split("-")[1])).toEqual(["chase", "pace"]);
  });
});
