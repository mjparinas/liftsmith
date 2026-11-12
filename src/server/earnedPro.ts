// Pro that lifters earn by bringing people (growth plan items 2 and 3, Melvin 2026-11-12; docs/decisions/growth.md).
//
// Give a month, get a month: a friend who accepts a lifter's invite (social.ts `acceptInvite`) within 30 days of
// making their account, then finishes three workouts, earns a month of Pro for each of them. One accept counts per
// friend ever, a lifter earns at most 12 months in any 365 days, and months stack end to end. The workouts are
// counted from the friend's synced events, so it's settled when the friend syncs (`settleReferral`).
//
// Coaches: an account with 3 or more clients who each finished a workout in the last 14 days has Pro for as long as
// that holds (`coachEarnsPro`). Nothing is stored for it; it's worked out on every access check.
import { query, run } from "./db";

const DAY = 86_400_000;
export const EARNED = {
  /** Workouts the invited friend finishes before both get their month. */
  workouts: 3,
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

/** Finished workouts in the account's synced events since `from`. */
async function workoutsSince(accountId: string, from: number): Promise<number> {
  const [r] = await query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM sync_events
     WHERE account_id = ? AND at >= ? AND body IS NOT NULL AND json_extract(body, '$.type') = 'sessionEnd'`,
    [accountId, from],
  );
  return Number(r?.n ?? 0);
}

/**
 * Gives the friend and their inviter a month each once the friend has finished three workouts since accepting.
 * Called after the friend syncs; does nothing when there's nothing to settle. Returns whether it rewarded.
 */
export async function settleReferral(friendId: string, now = Date.now()): Promise<boolean> {
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
  if (Number(recent?.n ?? 0) < EARNED.perYear) {
    await run("INSERT OR IGNORE INTO earned_pro (account_id, friend_id, at, days) VALUES (?, ?, ?, ?)", [
      inviter,
      friendId,
      now,
      EARNED.days,
    ]);
  }
  return true;
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
