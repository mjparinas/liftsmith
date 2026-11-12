import { beforeEach, describe, expect, it } from "vitest";

import { accessFor } from "./access";
import { deleteAccount } from "./accounts";
import { query, resetDb, run } from "./db";
import { coachEarnsPro, EARNED, earnedUntil, recordAccept, settleReferral } from "./earnedPro";
import { sync } from "./sync";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
});

const account = (id: string, createdAt = NOW - DAY) =>
  run("INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, NULL, ?, ?)", [id, createdAt, NOW]);

let n = 0;
/** Syncs `count` finished workouts for the account, ending at `at`. */
const workouts = (id: string, count: number, at = NOW + DAY) =>
  sync(id, `s-${id}`, {
    cursor: 0,
    events: Array.from({ length: count }, () => ({ id: `end-${++n}`, at, type: "sessionEnd", sessionId: `w${n}` })) as {
      id: string;
      at: number;
    }[],
    deleted: [],
    records: [],
    first: false,
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
