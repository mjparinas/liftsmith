// Pro that lifters earn by bringing people (growth plan items 2 and 3, Melvin 2026-11-12; docs/decisions/growth.md).
//
// Give a month, get a month: a friend who accepts a lifter's invite (social.ts `acceptInvite`) within 30 days of
// making their account, then finishes three workouts, earns a month of Pro for each of them. One accept counts per
// friend ever, a lifter earns at most 12 months in any 365 days, and months stack end to end. The workouts are
// counted from the friend's synced events, so it's settled when the friend syncs (`settleReferral`).
//
// Coaches: an account with 3 or more clients who each finished a workout in the last 14 days has Pro for as long as
// that holds (`coachEarnsPro`). Nothing is stored for it; it's worked out on every access check.
import { FLAGS } from "@/lib/flags";
import type { InviteFriend, InviteStatus } from "@/lib/referral";

import { query, run } from "./db";
import { flagStates } from "./flags";
import { notifyPlain } from "./push";
import { isMinor } from "./teams";

const DAY = 86_400_000;
export const EARNED = {
  /** Workouts the invited friend finishes before both get their month. */
  workouts: 3,
  /** Logged sets a finished workout needs to count. */
  setsPerWorkout: 3,
  /** Days of Pro each. */
  days: 30,
  /** Only a new account's acceptance counts: made at most this long before accepting. */
  newAccountDays: 30,
  /** Months a lifter can earn from invites in any 365 days. */
  perYear: 12,
  /** Clients training, each with a workout in the last `activeDays`, for a coach's free Pro. */
  coachClients: 3,
  activeDays: 14,
} as const;

/** Records that `friendId` joined through `inviterId`'s invite, if it's the friend's first and their account is new. */
export async function recordAccept(friendId: string, inviterId: string, now = Date.now()): Promise<void> {
  if (friendId === inviterId) return;
  const [acct] = await query<{ created_at: number }>("SELECT created_at FROM accounts WHERE id = ?", [friendId]);
  if (!acct || now - Number(acct.created_at) > EARNED.newAccountDays * DAY) return;
  await run("INSERT OR IGNORE INTO invite_accepts (friend_id, inviter_id, at) VALUES (?, ?, ?)", [friendId, inviterId, now]);
}

/**
 * Finished workouts in the account's synced events since `from` that hold real logged sets: at least
 * `EARNED.setsPerWorkout` sets with reps (or seconds, for holds and cardio) under the same session (Melvin, 2026-11-13,
 * after the security audit). A bare "workout finished" with nothing logged doesn't earn anyone Pro.
 */
async function workoutsSince(accountId: string, from: number): Promise<number> {
  const [r] = await query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sync_events e
     WHERE e.account_id = ?1 AND e.at >= ?2 AND e.body IS NOT NULL AND json_extract(e.body, '$.type') = 'sessionEnd'
       AND (SELECT COUNT(*) FROM sync_events s
             WHERE s.account_id = ?1 AND s.body IS NOT NULL AND json_extract(s.body, '$.type') = 'set'
               AND json_extract(s.body, '$.sessionId') = json_extract(e.body, '$.sessionId')
               AND json_extract(s.body, '$.reps') > 0) >= ?3`,
    [accountId, from, EARNED.setsPerWorkout],
  );
  return Number(r?.n ?? 0);
}

/** Whether invites pay out right now (the admin flag `referralReward`; on when the flags can't be read). */
export async function referralOn(): Promise<boolean> {
  try {
    const v = (await flagStates()).get("referralReward")?.value;
    return typeof v === "boolean" ? v : FLAGS.referralReward.default;
  } catch {
    return FLAGS.referralReward.default;
  }
}

const nameOf = async (accountId: string) => {
  const [p] = await query<{ name: string }>("SELECT name FROM social_profiles WHERE account_id = ?", [accountId]);
  return p?.name ? String(p.name) : "";
};

/**
 * Gives the friend and their inviter a month each once the friend has finished three workouts since accepting.
 * Called after the friend syncs; does nothing when there's nothing to settle, or while the `referralReward` flag is
 * off (the invite waits and pays once it's back on). Returns whether it rewarded. Both hear about it by push, except
 * someone under 18 (no promotional rewards pushed at teens, docs/decisions/school-teams.md).
 */
export async function settleReferral(friendId: string, now = Date.now()): Promise<boolean> {
  if (!(await referralOn())) return false;
  const [a] = await query<{ inviter_id: string; at: number }>(
    "SELECT inviter_id, at FROM invite_accepts WHERE friend_id = ? AND rewarded_at IS NULL",
    [friendId],
  );
  if (!a) return false;
  if ((await workoutsSince(friendId, Number(a.at))) < EARNED.workouts) return false;
  // Claim it in one statement, so two syncs racing can't reward twice.
  const claimed = await query("UPDATE invite_accepts SET rewarded_at = ? WHERE friend_id = ? AND rewarded_at IS NULL RETURNING friend_id", [
    now,
    friendId,
  ]);
  if (!claimed.length) return false;
  const inviter = String(a.inviter_id);
  await run("INSERT OR IGNORE INTO earned_pro (account_id, friend_id, at, days) VALUES (?, ?, ?, ?)", [
    friendId,
    friendId,
    now,
    EARNED.days,
  ]);
  const [recent] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM earned_pro WHERE account_id = ? AND friend_id != account_id AND at > ?",
    [inviter, now - 365 * DAY],
  );
  const inviterEarns = Number(recent?.n ?? 0) < EARNED.perYear;
  if (inviterEarns) {
    await run("INSERT OR IGNORE INTO earned_pro (account_id, friend_id, at, days) VALUES (?, ?, ?, ?)", [
      inviter,
      friendId,
      now,
      EARNED.days,
    ]);
  }
  const [friendName, inviterName] = await Promise.all([nameOf(friendId), nameOf(inviter)]);
  await Promise.all([
    (async () => {
      if (!(await isMinor(friendId, now))) await notifyPlain(friendId, "referralFriend", { name: inviterName }, "#/pro");
    })(),
    (async () => {
      if (inviterEarns && !(await isMinor(inviter, now))) await notifyPlain(inviter, "referralInviter", { name: friendName }, "#/friends");
    })(),
  ]);
  return true;
}

/**
 * The lifter's invites, for "Your invites" on Friends › People: each friend who joined with their link, how many of the
 * three workouts they've done, whether it paid out, the months earned in the last 365 days and when earned Pro ends.
 * `joined` is the invite this lifter joined with, if any, so a new lifter sees how close they are to their own month.
 * `reward` is false while the flag is off and for anyone under 18, and the app then leaves the reward unsaid.
 */
export async function inviteStatus(accountId: string, now = Date.now()): Promise<InviteStatus> {
  const rows = await query<{ friend_id: string; at: number; rewarded_at: number | null; name: string | null; handle: string | null }>(
    `SELECT ia.friend_id, ia.at, ia.rewarded_at, sp.name, sp.handle FROM invite_accepts ia
     LEFT JOIN social_profiles sp ON sp.account_id = ia.friend_id AND sp.suspended = 0
     WHERE ia.inviter_id = ? ORDER BY ia.at DESC LIMIT 50`,
    [accountId],
  );
  const friend = async (r: { friend_id: string; at: number; rewarded_at: number | null; name: string | null; handle: string | null }) => {
    const rewarded = r.rewarded_at != null;
    const done = rewarded ? EARNED.workouts : Math.min(EARNED.workouts, await workoutsSince(String(r.friend_id), Number(r.at)));
    return { name: String(r.name ?? ""), handle: String(r.handle ?? ""), workouts: done, rewarded } satisfies InviteFriend;
  };
  const friends = await Promise.all(rows.map(friend));
  const [mine] = await query<{ inviter_id: string; at: number; rewarded_at: number | null; name: string | null; handle: string | null }>(
    `SELECT ia.inviter_id, ia.at, ia.rewarded_at, sp.name, sp.handle FROM invite_accepts ia
     LEFT JOIN social_profiles sp ON sp.account_id = ia.inviter_id AND sp.suspended = 0
     WHERE ia.friend_id = ?`,
    [accountId],
  );
  const joined = mine ? await friend({ ...mine, friend_id: accountId }) : null;
  const [recent] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM earned_pro WHERE account_id = ? AND friend_id != account_id AND at > ?",
    [accountId, now - 365 * DAY],
  );
  const until = await earnedUntil(accountId);
  const [on, minor] = await Promise.all([referralOn(), isMinor(accountId, now)]);
  return {
    friends,
    joined,
    months: Number(recent?.n ?? 0),
    perYear: EARNED.perYear,
    needed: EARNED.workouts,
    until: until != null && until > now ? until : null,
    reward: on && !minor,
  };
}

/** When the account's earned Pro ends: months laid end to end from when each was earned. Null with none. */
export async function earnedUntil(accountId: string): Promise<number | null> {
  const rows = await query<{ at: number; days: number }>("SELECT at, days FROM earned_pro WHERE account_id = ? ORDER BY at", [accountId]);
  let until: number | null = null;
  for (const r of rows) until = Math.max(until ?? 0, Number(r.at)) + Number(r.days) * DAY;
  return until;
}

/** Whether a coach has enough clients training right now for free Pro. */
export async function coachEarnsPro(accountId: string, now = Date.now()): Promise<boolean> {
  const clients = await query<{ client_id: string }>("SELECT client_id FROM coach_links WHERE coach_id = ?", [accountId]);
  if (clients.length < EARNED.coachClients) return false;
  let active = 0;
  for (const c of clients) {
    if ((await workoutsSince(String(c.client_id), now - EARNED.activeDays * DAY)) > 0) active++;
    if (active >= EARNED.coachClients) return true;
  }
  return false;
}

/** Deleting an account forgets its earned months and any invite still waiting to pay out. */
export const earnedDeletes = (accountId: string) => [
  { sql: "DELETE FROM earned_pro WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM invite_accepts WHERE (friend_id = ? OR inviter_id = ?) AND rewarded_at IS NULL", args: [accountId, accountId] },
];
