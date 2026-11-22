import { beforeEach, describe, expect, it } from "vitest";

import { accessFor } from "./access";
import { deleteAccount } from "./accounts";
import { query, resetDb, run } from "./db";
import { clubEarnsPro, coachEarnsPro, EARNED, earnedUntil, inviteStatus, recordAccept, settleReferral } from "./earnedPro";
import { setFlag } from "./flags";
import { saveToken, setPushSender, type PushMessage } from "./push";
import { sync } from "./sync";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
});

const account = (id: string, createdAt = NOW - DAY) =>
  run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, NULL, ?, ?)", [id, createdAt, NOW]);

let n = 0;
/** One finished workout: `sets` logged sets (reps > 0) and its sessionEnd, at `at`. */
const workout = (at: number, sets: number = EARNED.setsPerWorkout) => {
  const w = `w${++n}`;
  return [
    ...Array.from({ length: sets }, (_, i) => ({
      id: `set-${w}-${i}`,
      at,
      type: "set",
      sessionId: w,
      exerciseId: "squat",
      weight: 60,
      reps: 5,
    })),
    { id: `end-${w}`, at, type: "sessionEnd", sessionId: w },
  ];
};
/** Syncs `count` finished workouts for the account, ending at `at`, each with `sets` logged sets. */
const workouts = (id: string, count: number, at = NOW + DAY, sets?: number) =>
  sync(id, `s-${id}`, {
    cursor: 0,
    events: Array.from({ length: count }, () => workout(at, sets)).flat() as { id: string; at: number }[],
    deleted: [],
    records: [],
    first: false,
  });

describe("only real workouts count", () => {
  it("doesn't count a finished workout without enough logged sets", async () => {
    await account("inviter", NOW - 400 * DAY);
    await account("friend");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 3, NOW + DAY, 0);
    await workouts("friend", 3, NOW + DAY, EARNED.setsPerWorkout - 1);
    expect(await settleReferral("friend", NOW + DAY)).toBe(false);
    await workouts("friend", 3);
    expect(await settleReferral("friend", NOW + DAY)).toBe(true);
  });

  it("doesn't count sets with no reps", async () => {
    await account("friend");
    await recordAccept("friend", "inviter", NOW);
    const empty = [1, 2, 3].flatMap(() => workout(NOW + DAY).map((e) => (e.type === "set" ? { ...e, reps: 0 } : e)));
    await sync("friend", "s-friend", { cursor: 0, events: empty as { id: string; at: number }[], deleted: [], records: [], first: false });
    expect(await settleReferral("friend", NOW + DAY)).toBe(false);
  });
});

describe("give a month, get a month", () => {
  it("pays both a month once the invited friend finishes three workouts", async () => {
    await account("inviter", NOW - 400 * DAY);
    await account("friend");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 2);
    expect(await settleReferral("friend", NOW + DAY)).toBe(false);
    await workouts("friend", 1);
    expect(await settleReferral("friend", NOW + DAY)).toBe(true);
    expect(await earnedUntil("friend")).toBe(NOW + DAY + 30 * DAY);
    expect(await earnedUntil("inviter")).toBe(NOW + DAY + 30 * DAY);
    expect(await accessFor("inviter", null, NOW + 2 * DAY)).toMatchObject({ pro: true, via: "referral" });
    expect(await accessFor("inviter", null, NOW + 32 * DAY)).toMatchObject({ pro: false });
    // Only once.
    await workouts("friend", 3);
    expect(await settleReferral("friend", NOW + 2 * DAY)).toBe(false);
  });

  it("counts only workouts after accepting", async () => {
    await account("inviter");
    await account("friend");
    await workouts("friend", 3, NOW - 1000);
    await recordAccept("friend", "inviter", NOW);
    expect(await settleReferral("friend", NOW + DAY)).toBe(false);
  });

  it("counts only new accounts, and only their first invite", async () => {
    await account("inviter");
    await account("other");
    await account("old", NOW - 60 * DAY);
    await recordAccept("old", "inviter", NOW);
    expect(await query("SELECT * FROM invite_accepts")).toHaveLength(0);
    await account("friend");
    await recordAccept("friend", "inviter", NOW);
    await recordAccept("friend", "other", NOW);
    expect(await query("SELECT inviter_id FROM invite_accepts")).toEqual([{ inviter_id: "inviter" }]);
    await recordAccept("inviter", "inviter", NOW);
    expect(await query("SELECT * FROM invite_accepts WHERE friend_id = 'inviter'")).toHaveLength(0);
  });

  it("months stack end to end, and a lifter earns at most 12 a year", async () => {
    await account("inviter");
    for (let i = 0; i < EARNED.perYear + 2; i++) {
      await account(`f${i}`);
      await recordAccept(`f${i}`, "inviter", NOW);
      await workouts(`f${i}`, 3);
      expect(await settleReferral(`f${i}`, NOW + DAY)).toBe(true);
    }
    expect(await earnedUntil("inviter")).toBe(NOW + DAY + EARNED.perYear * 30 * DAY);
    // Every friend still gets theirs.
    expect(await earnedUntil(`f${EARNED.perYear + 1}`)).toBe(NOW + DAY + 30 * DAY);
  });

  it("deleting an account forgets its earned months", async () => {
    await account("inviter");
    await account("friend");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 3);
    await settleReferral("friend", NOW + DAY);
    await deleteAccount("inviter", async () => null);
    expect(await earnedUntil("inviter")).toBeNull();
    expect(await earnedUntil("friend")).not.toBeNull();
  });
});

describe("campus clubs earn Pro", () => {
  const club = (owner: string, id: string) =>
    run("INSERT INTO clubs (id, owner_id, name, code, created_at) VALUES (?, ?, ?, ?, ?)", [id, owner, id, id, NOW]);
  const join = (clubId: string, accountId: string) =>
    run("INSERT INTO club_members (club_id, account_id, created_at) VALUES (?, ?, ?)", [clubId, accountId, NOW]);

  /** The leader plus `others` members, each with one real workout at `at` (the leader too, unless `leaderTrains` is false). */
  const crew = async (others: number, at = NOW - DAY, leaderTrains = true) => {
    await club("leader", "crew");
    await join("crew", "leader");
    if (leaderTrains) await workouts("leader", 1, at);
    for (let i = 0; i < others; i++) {
      const id = `m${i}`;
      await join("crew", id);
      await workouts(id, 1, at);
    }
  };

  it("while 5 or more members, the leader included, each trained in the last 14 days", async () => {
    await crew(EARNED.clubMembers - 2);
    expect(await clubEarnsPro("leader", NOW)).toBe(false);
    await join("crew", "m-old");
    await workouts("m-old", 1, NOW - 20 * DAY);
    expect(await clubEarnsPro("leader", NOW)).toBe(false);
    await join("crew", "m-new");
    await workouts("m-new", 1, NOW - 13 * DAY);
    expect(await clubEarnsPro("leader", NOW)).toBe(true);
    expect(await accessFor("leader", null, NOW)).toMatchObject({ pro: true, via: "club" });
    // Two weeks later nobody has trained: Pro goes.
    expect(await clubEarnsPro("leader", NOW + 15 * DAY)).toBe(false);
  });

  it("doesn't count a bare finished workout, a club they only joined, or members split across two clubs", async () => {
    await club("leader", "crew");
    await join("crew", "leader");
    await workouts("leader", 1, NOW - DAY, 0);
    for (let i = 0; i < EARNED.clubMembers - 1; i++) {
      await join("crew", `bare${i}`);
      await workouts(`bare${i}`, 1, NOW - DAY, EARNED.setsPerWorkout - 1);
    }
    expect(await clubEarnsPro("leader", NOW)).toBe(false);

    await club("someone", "theirs");
    await join("theirs", "leader");
    for (let i = 0; i < EARNED.clubMembers; i++) {
      await join("theirs", `t${i}`);
      await workouts(`t${i}`, 1, NOW - DAY);
    }
    expect(await clubEarnsPro("leader", NOW)).toBe(false);
    expect(await clubEarnsPro("someone", NOW)).toBe(true);

    await club("leader", "other");
    await join("other", "leader");
    await workouts("leader", 1, NOW - DAY);
    for (let i = 0; i < EARNED.clubMembers - 2; i++) {
      await join("crew", `a${i}`);
      await join("other", `b${i}`);
      await workouts(`a${i}`, 1, NOW - DAY);
      await workouts(`b${i}`, 1, NOW - DAY);
    }
    // The leader plus three others on each club they started: neither club reaches 5.
    expect(await clubEarnsPro("leader", NOW)).toBe(false);
  });

  it("stops when the campusClubs flag is off", async () => {
    await crew(EARNED.clubMembers - 1);
    expect(await clubEarnsPro("leader", NOW)).toBe(true);
    await setFlag("campusClubs", false, 100, "test", NOW);
    expect(await clubEarnsPro("leader", NOW)).toBe(false);
    expect((await accessFor("leader", null, NOW)).pro).toBe(false);
  });
});

describe("coaches earn Pro", () => {
  const link = (client: string) => run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES ('coach', ?, ?)", [client, NOW]);

  it("while 3 or more clients each trained in the last 14 days", async () => {
    for (const c of ["c1", "c2", "c3", "c4"]) await link(c);
    await workouts("c1", 1, NOW - DAY);
    await workouts("c2", 1, NOW - 2 * DAY);
    expect(await coachEarnsPro("coach", NOW)).toBe(false);
    await workouts("c3", 1, NOW - 20 * DAY);
    expect(await coachEarnsPro("coach", NOW)).toBe(false);
    await workouts("c4", 1, NOW - 13 * DAY);
    expect(await coachEarnsPro("coach", NOW)).toBe(true);
    expect(await accessFor("coach", null, NOW)).toMatchObject({ pro: true, via: "coach" });
    // Two weeks later nobody has trained: Pro goes.
    expect(await coachEarnsPro("coach", NOW + 15 * DAY)).toBe(false);
  });
});

// The invite loop (docs/decisions/growth.md "The invite loop"): progress on Friends › People, the admin switch, and the
// push when a month lands.
describe("the invite loop", () => {
  const sent: PushMessage[] = [];
  const lifter = async (id: string, name: string, birthYear?: number, createdAt?: number) => {
    await account(id, createdAt);
    await run("INSERT INTO social_profiles (account_id, handle, name, agreed_at, created_at, suspended) VALUES (?, ?, ?, ?, ?, 0)", [
      id,
      id,
      name,
      NOW,
      NOW,
    ]);
    if (birthYear)
      await run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
        id,
        JSON.stringify({ birthYear }),
        NOW,
      ]);
    await saveToken(id, `token-for-${id}-0123456789`, "android", "en", NOW);
  };
  beforeEach(() => {
    sent.length = 0;
    setPushSender(async (m) => {
      sent.push(m);
      return "ok";
    });
    return () => setPushSender(null);
  });

  it("shows each friend's progress, then the month both earned", async () => {
    await lifter("inviter", "Sam", undefined, NOW - 400 * DAY);
    await lifter("friend", "Alex");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 2);
    expect(await inviteStatus("inviter", NOW + DAY)).toMatchObject({
      friends: [{ name: "Alex", handle: "friend", workouts: 2, rewarded: false }],
      joined: null,
      months: 0,
      needed: EARNED.workouts,
      until: null,
      reward: true,
    });
    // The friend sees their side: whose link and how far they are.
    expect((await inviteStatus("friend", NOW + DAY)).joined).toMatchObject({ name: "Sam", workouts: 2, rewarded: false });

    await workouts("friend", 1);
    expect(await settleReferral("friend", NOW + DAY)).toBe(true);
    const after = await inviteStatus("inviter", NOW + 2 * DAY);
    expect(after).toMatchObject({ friends: [{ workouts: EARNED.workouts, rewarded: true }], months: 1 });
    expect(after.until).toBe(NOW + DAY + EARNED.days * DAY);
  });

  it("tells both by push when the month lands", async () => {
    await lifter("inviter", "Sam", undefined, NOW - 400 * DAY);
    await lifter("friend", "Alex");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 3);
    await settleReferral("friend", NOW + DAY);
    expect(sent.map((m) => [m.token, m.kind, m.body]).sort()).toEqual([
      ["token-for-friend-0123456789", "referralFriend", "You finished three workouts. You and Sam both have a month of Pro."],
      ["token-for-inviter-0123456789", "referralInviter", "Alex finished three workouts with your invite. You both have a month of Pro."],
    ]);
  });

  it("never pushes the reward at someone under 18, and doesn't mention it to them", async () => {
    await lifter("inviter", "Sam", undefined, NOW - 400 * DAY);
    await lifter("teen", "Jo", 2012);
    await recordAccept("teen", "inviter", NOW);
    await workouts("teen", 3);
    expect(await settleReferral("teen", NOW + DAY)).toBe(true);
    expect(sent.map((m) => m.token)).toEqual(["token-for-inviter-0123456789"]);
    expect((await inviteStatus("teen", NOW + DAY)).reward).toBe(false);
    expect((await inviteStatus("inviter", NOW + DAY)).reward).toBe(true);
  });

  it("pays nothing while the admin switch is off, and pays once it's back on", async () => {
    await lifter("inviter", "Sam", undefined, NOW - 400 * DAY);
    await lifter("friend", "Alex");
    await recordAccept("friend", "inviter", NOW);
    await workouts("friend", 3);
    await setFlag("referralReward", false, 100, "test", NOW);
    expect(await settleReferral("friend", NOW + DAY)).toBe(false);
    expect((await inviteStatus("inviter", NOW + DAY)).reward).toBe(false);
    expect(await earnedUntil("friend")).toBeNull();
    await setFlag("referralReward", true, 100, "test", NOW);
    expect(await settleReferral("friend", NOW + DAY)).toBe(true);
  });
});
