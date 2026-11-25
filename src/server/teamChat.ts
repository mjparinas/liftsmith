// Team chat (Melvin, 2026-11-25: an athlete's "My team" should have "team chat, coach chat"; docs/decisions/school-teams.md
// "My team"). Every school team has one conversation for its athletes and its coach:
//
// - Only the team's coach and its athletes read or write it. Athletes show by first name, as on the weekly board; the
//   coach by their name, marked Coach. Words go through the comment filter (no links, no blocked words).
// - The coach sees everything and can delete any message; an athlete can delete their own. It's a team the coach runs,
//   so unlike a Friends club (no chat for under 18s) teenagers on it can talk, with their coach in the room.
// - Unread messages count toward the coaching count and the app icon badge. A push goes to someone who hasn't opened the
//   chat since, at most once an hour per team.
import { randomBytes } from "node:crypto";

import { nameOf } from "./coach";
import { batch, query, rateLimit, run } from "./db";
import { checkText } from "./moderation";
import { notifyPlain } from "./push";

export type Result = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown> = { ok: true }): Result => ({ code: 200, body });
const fail = (code: number, error: string): Result => ({ code, body: { error } });
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => Number(v ?? 0);
const HOUR = 3_600_000;

export const TEAM_CHAT = {
  /** Messages a page holds. */
  page: 50,
  /** Longest message. */
  max: 500,
  /** Messages per account per day. */
  daily: 300,
  /** A push to one person waits at least this long after their last one from the same team. */
  pushGap: HOUR,
  /** Unread counts stop here (the red count says 99+ past it anyway). */
  unreadCap: 100,
};

/** One message as the app shows it. */
export interface TeamMessage {
  id: string;
  name: string;
  coach: boolean;
  at: number;
  body: string;
  mine: boolean;
  canDelete: boolean;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0]?.slice(0, 30) ?? "";

interface Access {
  team: { id: string; name: string; coach_id: string };
  coach: boolean;
}

/** The team, when this account is its coach or on it. */
async function access(accountId: string, teamId: unknown): Promise<Access | null> {
  if (typeof teamId !== "string" || !teamId) return null;
  const [t] = await query<{ id: string; name: string; coach_id: string }>("SELECT id, name, coach_id FROM teams WHERE id = ?", [teamId]);
  if (!t) return null;
  if (s(t.coach_id) === accountId) return { team: t, coach: true };
  const [m] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_members WHERE team_id = ? AND account_id = ?", [
    teamId,
    accountId,
  ]);
  return n(m?.n) ? { team: t, coach: false } : null;
}

async function markRead(teamId: string, accountId: string, now: number) {
  await run(
    `INSERT INTO team_chat_reads (team_id, account_id, read_at, pushed_at) VALUES (?, ?, ?, 0)
     ON CONFLICT (team_id, account_id) DO UPDATE SET read_at = excluded.read_at`,
    [teamId, accountId, now],
  );
}

const names = new Map<string, string>();
async function shownName(id: string, coachId: string): Promise<string> {
  let name = names.get(id);
  if (name === undefined) {
    name = await nameOf(id);
    if (names.size > 500) names.clear();
    names.set(id, name);
  }
  return id === coachId ? name : firstName(name);
}

async function toMessage(viewer: string, a: Access, r: { id: string; account_id: string; created_at: number; body: string }) {
  const from = s(r.account_id);
  const coachId = s(a.team.coach_id);
  const mine = from === viewer;
  const m: TeamMessage = {
    id: s(r.id),
    name: await shownName(from, coachId),
    coach: from === coachId,
    at: n(r.created_at),
    body: s(r.body),
    mine,
    canDelete: mine || a.coach,
  };
  return m;
}

/**
 * A page of a team's chat, oldest first: the newest messages, those before `before` (Load earlier), or only those
 * after `after` (asking what's new while the chat is open). Reading the newest marks it read.
 */
export async function teamChat(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const a = await access(accountId, b.team);
  if (!a) return fail(404, "unknown");
  const before = Number(b.before);
  const after = Number(b.after);
  const older = Number.isFinite(before) && before > 0;
  const newer = !older && Number.isFinite(after) && after > 0;
  const rows = await query<{ id: string; account_id: string; created_at: number; body: string }>(
    `SELECT id, account_id, created_at, body FROM team_messages
     WHERE team_id = ? AND created_at ${newer ? ">" : "<"} ?
     ORDER BY created_at ${newer ? "ASC" : "DESC"} LIMIT ${TEAM_CHAT.page}`,
    [s(a.team.id), older ? before : newer ? after : now + 1],
  );
  const messages = await Promise.all(rows.map((r) => toMessage(accountId, a, r)));
  if (!newer) messages.reverse();
  if (!older) await markRead(s(a.team.id), accountId, now);
  return ok({ messages, more: !newer && rows.length === TEAM_CHAT.page, team: { id: s(a.team.id), name: s(a.team.name) }, coach: a.coach });
}

/** Sends a message to the team. */
export async function teamSay(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const a = await access(accountId, b.team);
  if (!a) return fail(404, "unknown");
  const text = checkText(b.text, TEAM_CHAT.max);
  if (!text.ok) return fail(400, `message.${text.error}`);
  if (!(await rateLimit(`team:say:${accountId}`, TEAM_CHAT.daily, 24 * HOUR, now))) return fail(429, "slow");
  const id = randomBytes(9).toString("base64url");
  const teamId = s(a.team.id);
  await batch([
    {
      sql: "INSERT INTO team_messages (id, team_id, account_id, created_at, body) VALUES (?, ?, ?, ?, ?)",
      args: [id, teamId, accountId, now, text.text],
    },
    {
      sql: `INSERT INTO team_chat_reads (team_id, account_id, read_at, pushed_at) VALUES (?, ?, ?, 0)
            ON CONFLICT (team_id, account_id) DO UPDATE SET read_at = excluded.read_at`,
      args: [teamId, accountId, now],
    },
  ]);
  const message = await toMessage(accountId, a, { id, account_id: accountId, created_at: now, body: text.text });
  await pushChat(a, accountId, message.name, text.text, now);
  return ok({ message });
}

/**
 * The push: everyone else on the team (and its coach) who hasn't been pushed about this team in the last hour and has
 * read the chat since the last push. "Senior Girls Volleyball · Maya: practice moved to 4".
 */
async function pushChat(a: Access, from: string, name: string, text: string, now: number) {
  const teamId = s(a.team.id);
  const members = await query<{ account_id: string }>("SELECT account_id FROM team_members WHERE team_id = ?", [teamId]);
  const everyone = [s(a.team.coach_id), ...members.map((m) => s(m.account_id))].filter((id) => id !== from);
  if (!everyone.length) return;
  const reads = await query<{ account_id: string; read_at: number; pushed_at: number }>(
    "SELECT account_id, read_at, pushed_at FROM team_chat_reads WHERE team_id = ?",
    [teamId],
  );
  const by = new Map(reads.map((r) => [s(r.account_id), r]));
  const to = everyone.filter((id) => {
    const r = by.get(id);
    return !r || (n(r.pushed_at) < now - TEAM_CHAT.pushGap && n(r.pushed_at) <= n(r.read_at));
  });
  if (!to.length) return;
  await Promise.all(to.map((id) => notifyPlain(id, "clubMsg", { name: `${s(a.team.name)} · ${name}`, text }, `#/trainer/tc.${teamId}`)));
  await batch(
    to.map((id) => ({
      sql: `INSERT INTO team_chat_reads (team_id, account_id, read_at, pushed_at) VALUES (?, ?, 0, ?)
            ON CONFLICT (team_id, account_id) DO UPDATE SET pushed_at = excluded.pushed_at`,
      args: [teamId, id, now],
    })),
  );
}

/** Deletes a message: the writer's own, or any on a team the lifter coaches. */
export async function teamUnsay(accountId: string, b: Record<string, unknown>): Promise<Result> {
  await run("DELETE FROM team_messages WHERE id = ? AND (account_id = ? OR team_id IN (SELECT id FROM teams WHERE coach_id = ?))", [
    s(b.id),
    accountId,
    accountId,
  ]);
  return ok();
}

/** Unread messages on each of these teams (the ones the lifter coaches or is on), not counting their own. */
export async function teamChatUnread(accountId: string, teamIds: string[]): Promise<Record<string, number>> {
  if (!teamIds.length) return {};
  const reads = await query<{ team_id: string; read_at: number }>("SELECT team_id, read_at FROM team_chat_reads WHERE account_id = ?", [
    accountId,
  ]);
  const at = new Map(reads.map((r) => [s(r.team_id), n(r.read_at)]));
  const out: Record<string, number> = {};
  await Promise.all(
    teamIds.map(async (id) => {
      const [c] = await query<{ n: number }>(
        `SELECT COUNT(*) AS n FROM (SELECT account_id FROM team_messages WHERE team_id = ? AND created_at > ? LIMIT ${TEAM_CHAT.unreadCap})
         WHERE account_id != ?`,
        [id, at.get(id) ?? 0, accountId],
      );
      if (n(c?.n) > 0) out[id] = n(c?.n);
    }),
  );
  return out;
}

/** All unread team chat for this account: the coaching count and the app icon badge (badge.ts, coach overview). */
export async function teamChatWaiting(accountId: string): Promise<number> {
  const teams = await query<{ id: string }>(
    "SELECT id FROM teams WHERE coach_id = ? UNION SELECT team_id AS id FROM team_members WHERE account_id = ?",
    [accountId, accountId],
  );
  const unread = await teamChatUnread(
    accountId,
    teams.map((t) => s(t.id)),
  );
  return Object.values(unread).reduce((a, b) => a + b, 0);
}

/** A deleted team's chat. */
export const teamChatDeletes = (teamId: string) => [
  { sql: "DELETE FROM team_messages WHERE team_id = ?", args: [teamId] },
  { sql: "DELETE FROM team_chat_reads WHERE team_id = ?", args: [teamId] },
];
