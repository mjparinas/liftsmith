// Statuses, presence and typing in coach chat (2026-11-15, docs/decisions/trainer-mode.md "Chat dock, statuses and
// stickers"; the rules in src/lib/coachStatus.ts). One row per account in coach_status: what they picked and until
// when, when they last had coaching open, and who they were last typing to. Only the database here, so coach.ts can
// read it without importing itself.
import { isStatus, type Presence, type Status } from "@/lib/coachStatus";

import { query, run } from "./db";

/** Typing shows for this long after the last keystroke the app reported (it reports at most every 3 seconds). */
export const TYPING_MS = 6_000;
/** Activity is written at most this often per account, so each poll isn't a write. */
const SEEN_EVERY_MS = 30_000;
/** The furthest ahead a status can be set to end (a long holiday). */
const UNTIL_MAX_MS = 92 * 86_400_000;

/** This account has coaching open now. Writes only when the last mark is 30 seconds old or more. */
export async function touchSeen(accountId: string, now = Date.now()): Promise<void> {
  await run(
    `INSERT INTO coach_status (account_id, seen_at) VALUES (?, ?)
     ON CONFLICT (account_id) DO UPDATE SET seen_at = excluded.seen_at WHERE coach_status.seen_at <= excluded.seen_at - ${SEEN_EVERY_MS}`,
    [accountId, now],
  );
}

/** Each account's stored presence; anyone without a row is automatic and never seen. */
export async function presences(ids: readonly string[]): Promise<Map<string, Presence & { typingTo: string | null; typingAt: number }>> {
  const out = new Map<string, Presence & { typingTo: string | null; typingAt: number }>();
  if (ids.length === 0) return out;
  const rows = await query<{
    account_id: string;
    status: string;
    until: number;
    seen_at: number;
    typing_to: string | null;
    typing_at: number;
  }>(
    `SELECT account_id, status, until, seen_at, typing_to, typing_at FROM coach_status WHERE account_id IN (${ids.map(() => "?").join(", ")})`,
    [...ids],
  );
  for (const r of rows)
    out.set(String(r.account_id), {
      status: isStatus(r.status) ? r.status : "auto",
      until: Number(r.until) || 0,
      seenAt: Number(r.seen_at) || 0,
      typingTo: r.typing_to === null ? null : String(r.typing_to),
      typingAt: Number(r.typing_at) || 0,
    });
  return out;
}

export async function presenceOf(accountId: string): Promise<Presence & { typingTo: string | null; typingAt: number }> {
  return (await presences([accountId])).get(accountId) ?? { status: "auto", until: 0, seenAt: 0, typingTo: null, typingAt: 0 };
}

/** Picks a status. `until` is when it ends (0 or anything not in the future: until they change it); automatic never ends. */
export async function setStatus(
  accountId: string,
  raw: unknown,
  rawUntil: unknown,
  now = Date.now(),
): Promise<{ status: Status; until: number } | { error: "bad" }> {
  if (!isStatus(raw)) return { error: "bad" };
  const n = typeof rawUntil === "number" && Number.isFinite(rawUntil) ? Math.round(rawUntil) : 0;
  const until = raw === "auto" || n <= now ? 0 : Math.min(n, now + UNTIL_MAX_MS);
  await run(
    `INSERT INTO coach_status (account_id, status, until, seen_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (account_id) DO UPDATE SET status = excluded.status, until = excluded.until, seen_at = excluded.seen_at`,
    [accountId, raw, until, now],
  );
  return { status: raw, until };
}

/** This account is typing to that one. The other side only sees it if the two are linked (coach.ts checks). */
export async function setTyping(accountId: string, to: string, now = Date.now()): Promise<void> {
  await run(
    `INSERT INTO coach_status (account_id, typing_to, typing_at, seen_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (account_id) DO UPDATE SET typing_to = excluded.typing_to, typing_at = excluded.typing_at, seen_at = excluded.seen_at`,
    [accountId, to, now, now],
  );
}

/** Sending a message ends the typing that led to it. */
export async function stopTyping(accountId: string): Promise<void> {
  await run("UPDATE coach_status SET typing_at = 0 WHERE account_id = ?", [accountId]);
}

/** Whether `p` was typing to `to` in the last few seconds. */
export const typingTo = (p: { typingTo: string | null; typingAt: number }, to: string, now: number) =>
  p.typingTo === to && now - p.typingAt < TYPING_MS;

/** Deleting an account: its row. */
export const presenceCleanup = (accountId: string) => [{ sql: "DELETE FROM coach_status WHERE account_id = ?", args: [accountId] }];
