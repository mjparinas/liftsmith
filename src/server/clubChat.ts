// Club chat and crew sessions (Melvin, 2026-11-17: "do 1, 2" from the community gap list; docs/decisions/friends.md
// "Club chat and crew sessions"). A club already had a weekly board, a crew goal and a feed of posts; this adds a
// conversation between workouts and a way to meet up:
//
// - **Chat**: members of a club write short messages to everyone in it. Words go through the comment filter (no links,
//   no blocked words), people blocked either way or muted are left out, a suspended writer's messages disappear, and
//   anyone can report a message (three reports hide it until staff look; Admin › Reports). The writer or the club's
//   starter can delete one. A push goes to members who haven't opened the chat since, at most once an hour per club,
//   and never for an official gym's club (a whole gym is too many people to buzz).
// - **Crew sessions**: anyone in the club posts a time (up to 30 days ahead), a name and a place; members tap I'm in;
//   everyone in gets a push about an hour before (the "crew" schedule, /api/cron/crew/); and a member who's in and
//   posts a workout to Friends around its time counts as trained, with the others in it who are their friends tagged
//   as training partners on that post.
//
// Under 18s get neither (`crewMinor`): both are ways for people who don't follow each other to talk and meet in person.
import { randomBytes } from "node:crypto";

import { AVATAR_IDS, SOCIAL_LIMITS, type ClubMessage, type CrewSession } from "@/lib/socialTypes";

import { batch, query, rateLimit, run, type Row } from "./db";
import { checkText } from "./moderation";
import { notifyPlain } from "./push";
import { isMinor } from "./teams";

export type Result = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown> = { ok: true }): Result => ({ code: 200, body });
const fail = (code: number, error: string): Result => ({ code, body: { error } });
const newId = () => randomBytes(9).toString("base64url");
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? "" : String(v));
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Messages a page of the chat holds. */
export const CHAT_PAGE = 50;
/** Per account per day. */
export const CHAT_DAILY = { say: 300, crew: 10, going: 200 };
/** A chat push to one member waits at least this long after the last one from the same club. */
export const CHAT_PUSH_GAP = HOUR;
/** Crew sessions show from this long after they started. */
export const CREW_SHOWN_AFTER = 3 * HOUR;
/** The reminder goes out this long before a session starts (the schedule runs every 15 minutes). */
export const CREW_REMIND_BEFORE = HOUR;
/** A workout counts for a crew session when it starts this long before or after it. */
export const CREW_TRAINED = { before: 2 * HOUR, after: 6 * HOUR };

const AVATAR_SET = new Set<string>(AVATAR_IDS);
const avatarOf = (v: unknown) => (AVATAR_SET.has(s(v)) ? s(v) : "");

/** Leaves out people blocked either way and, for the chat, people the reader muted. */
const NOT_BLOCKED = (col: string, v: string) => `${col} NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${v})
  AND ${col} NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${v})`;
/** Seen by everyone while not suspended; a shadow-banned writer still sees their own (socialModeration.ts). */
const SHOWN = (v: string) => `(sp.suspended = 0 OR (sp.account_id = ${v} AND sp.suspended != 1))`;

interface Member {
  club: Row;
  me: Row;
}

/**
 * A member of the club who may use its chat and crew sessions: in Friends, in the club, and 18 or over. Writing
 * (`write`) also needs a profile that isn't suspended.
 */
async function member(accountId: string, clubId: string, now: number, write = false): Promise<Member | Result> {
  const [row] = await query(
    `SELECT c.id AS id, c.name AS name, c.owner_id AS owner_id, c.place_id AS place_id,
       sp.handle AS handle, sp.name AS my_name, sp.avatar AS avatar, sp.suspended AS suspended
     FROM clubs c JOIN club_members cm ON cm.club_id = c.id AND cm.account_id = ?
     JOIN social_profiles sp ON sp.account_id = cm.account_id
     WHERE c.id = ?`,
    [accountId, clubId],
  );
  if (!row) return fail(404, "gone");
  if (write && n(row.suspended) === 1) return fail(403, "suspended");
  if (await isMinor(accountId, now)) return fail(403, "crewMinor");
  return { club: row, me: row };
}
const isResult = (x: unknown): x is Result => !!x && typeof x === "object" && "code" in x && "body" in x;

// --- Chat ---

function toMessage(viewer: string, owner: string, r: Row): ClubMessage {
  const mine = s(r.account_id) === viewer;
  return {
    id: s(r.id),
    handle: s(r.handle),
    name: s(r.name),
    avatar: avatarOf(r.avatar),
    at: n(r.created_at),
    body: s(r.body),
    mine,
    canDelete: mine || owner === viewer,
  };
}

/**
 * A page of the club's chat, oldest first: the newest `CHAT_PAGE` messages, or those before `before` (Load earlier),
 * or only those after `after` (the screen asking for what's new while it's open). Reading the newest marks the chat
 * read, so its unread count and pushes start again from now.
 */
export async function clubChat(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const m = await member(accountId, s(b.id), now);
  if (isResult(m)) return m;
  const before = Number(b.before);
  const after = Number(b.after);
  const older = Number.isFinite(before) && before > 0;
  const newer = !older && Number.isFinite(after) && after > 0;
  const rows = await query(
    `SELECT m.id AS id, m.account_id AS account_id, m.created_at AS created_at, m.body AS body,
       sp.handle AS handle, sp.name AS name, sp.avatar AS avatar
     FROM club_messages m JOIN social_profiles sp ON sp.account_id = m.account_id
     WHERE m.club_id = ?1 AND m.hidden = 0 AND m.created_at ${newer ? "> ?3" : "< ?3"} AND ${SHOWN("?2")}
       AND ${NOT_BLOCKED("m.account_id", "?2")}
       AND m.account_id NOT IN (SELECT muted_id FROM mutes WHERE muter_id = ?2)
     ORDER BY m.created_at ${newer ? "ASC" : "DESC"} LIMIT ${CHAT_PAGE}`,
    [s(m.club.id), accountId, older ? before : newer ? after : now + 1],
  );
  const owner = s(m.club.owner_id);
  const messages = rows.map((r) => toMessage(accountId, owner, r));
  if (!newer) messages.reverse();
  if (!older) await run("UPDATE club_members SET read_at = ? WHERE club_id = ? AND account_id = ?", [now, s(m.club.id), accountId]);
  return ok({ messages, more: !newer && rows.length === CHAT_PAGE });
}

/** Sends a message to the club's chat. Pushes go to members who'd want one (`pushChat`). */
export async function clubSay(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const m = await member(accountId, s(b.id), now, true);
  if (isResult(m)) return m;
  const text = checkText(b.text, SOCIAL_LIMITS.clubMessage);
  if (!text.ok) return fail(400, `message.${text.error}`);
  if (!(await rateLimit(`social:clubSay:${accountId}`, CHAT_DAILY.say, DAY, now))) return fail(429, "slow");
  const id = newId();
  const clubId = s(m.club.id);
  await batch([
    {
      sql: "INSERT INTO club_messages (id, club_id, account_id, created_at, body, hidden) VALUES (?, ?, ?, ?, ?, 0)",
      args: [id, clubId, accountId, now, text.text],
    },
    { sql: "UPDATE club_members SET read_at = ? WHERE club_id = ? AND account_id = ?", args: [now, clubId, accountId] },
  ]);
  // A shadow-banned writer's message is kept (they see it) but tells nobody.
  if (n(m.me.suspended) === 0) await pushChat(m.club, accountId, s(m.me.my_name), text.text, now);
  return ok({
    message: toMessage(accountId, s(m.club.owner_id), { id, account_id: accountId, created_at: now, body: text.text, ...meRow(m.me) }),
  });
}

const meRow = (me: Row) => ({ handle: me.handle, name: me.my_name, avatar: me.avatar });

/**
 * The chat push: to members who left "Notify me" on, haven't read the chat since the last push and weren't pushed
 * about this club in the last hour, not blocked either way with the writer, not suspended and not under 18. Never for
 * an official gym's club. The club's name leads, so a push from a crew reads "Morning crew · Sam: see you at 6".
 */
async function pushChat(club: Row, from: string, name: string, text: string, now: number) {
  if (s(club.place_id)) return;
  const to = await query(
    `SELECT cm.account_id AS id FROM club_members cm JOIN social_profiles sp ON sp.account_id = cm.account_id
     WHERE cm.club_id = ?1 AND cm.account_id != ?2 AND cm.chat_push = 1 AND cm.pushed_at < ?3 AND cm.pushed_at <= cm.read_at
       AND sp.suspended = 0 AND ${NOT_BLOCKED("cm.account_id", "?2")}
     LIMIT ${SOCIAL_LIMITS.clubMembers}`,
    [s(club.id), from, now - CHAT_PUSH_GAP],
  );
  const route = `#/friends/club.${s(club.id)}`;
  const sent: string[] = [];
  await Promise.all(
    to.map(async (r) => {
      const id = s(r.id);
      if (await isMinor(id, now)) return;
      sent.push(id);
      await notifyPlain(id, "clubMsg", { name: `${s(club.name)} · ${name}`, text }, route);
    }),
  );
  if (sent.length)
    await run(`UPDATE club_members SET pushed_at = ? WHERE club_id = ? AND account_id IN (${sent.map(() => "?").join(", ")})`, [
      now,
      s(club.id),
      ...sent,
    ]);
}

/** Deletes a message: the writer's own, or any in a club the lifter started. */
export async function clubUnsay(accountId: string, b: Record<string, unknown>): Promise<Result> {
  await run(`DELETE FROM club_messages WHERE id = ? AND (account_id = ? OR club_id IN (SELECT id FROM clubs WHERE owner_id = ?))`, [
    s(b.id),
    accountId,
    accountId,
  ]);
  return ok();
}

/** "Notify me" for one club's chat (on to start). */
export async function clubChatPush(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const on = b.on !== false;
  await run("UPDATE club_members SET chat_push = ? WHERE club_id = ? AND account_id = ?", [on ? 1 : 0, s(b.id), accountId]);
  return ok({ on });
}

// --- Crew sessions ---

/**
 * Crew sessions a member sees: from three hours ago to 30 days ahead, soonest first, each with who's in (people
 * blocked either way and suspended people left out) and whether they trained.
 */
export async function sessionsFor(viewer: string, clubId: string, owner: string, now = Date.now()): Promise<CrewSession[]> {
  const rows = await query(
    `SELECT cs.id AS id, cs.starts_at AS starts_at, cs.title AS title, cs.place AS place, cs.account_id AS by_id,
       sp.handle AS by_handle, sp.name AS by_name
     FROM crew_sessions cs JOIN social_profiles sp ON sp.account_id = cs.account_id
     WHERE cs.club_id = ?1 AND cs.starts_at > ?3 AND cs.starts_at < ?4 AND ${SHOWN("?2")} AND ${NOT_BLOCKED("cs.account_id", "?2")}
     ORDER BY cs.starts_at LIMIT ${SOCIAL_LIMITS.crewUpcoming}`,
    [clubId, viewer, now - CREW_SHOWN_AFTER, now + SOCIAL_LIMITS.crewDays * DAY + DAY],
  );
  if (!rows.length) return [];
  const ids = rows.map((r) => s(r.id));
  const going = await query(
    `SELECT g.session_id AS session_id, g.account_id AS account_id, g.trained AS trained,
       sp.handle AS handle, sp.name AS name, sp.avatar AS avatar
     FROM crew_going g JOIN social_profiles sp ON sp.account_id = g.account_id
       JOIN club_members cm ON cm.club_id = ? AND cm.account_id = g.account_id
     WHERE g.session_id IN (${ids.map(() => "?").join(", ")}) AND (sp.suspended = 0 OR (sp.account_id = ? AND sp.suspended != 1))
       AND ${NOT_BLOCKED("g.account_id", "?")}
     ORDER BY g.created_at`,
    [clubId, ...ids, viewer, viewer, viewer],
  );
  return rows.map((r) => {
    const mine = going.filter((g) => s(g.session_id) === s(r.id));
    return {
      id: s(r.id),
      at: n(r.starts_at),
      title: s(r.title),
      place: s(r.place),
      by: { handle: s(r.by_handle), name: s(r.by_name) },
      going: mine.map((g) => ({ handle: s(g.handle), name: s(g.name), avatar: avatarOf(g.avatar), trained: n(g.trained) === 1 })),
      in: mine.some((g) => s(g.account_id) === viewer),
      canCancel: s(r.by_id) === viewer || owner === viewer,
    };
  });
}

/**
 * Posts a crew session: a time from now to 30 days ahead, a name (filtered, required) and a place (filtered,
 * optional; an official gym's club uses the gym's name when it's left empty). The poster is in. Members get a push
 * about it (crews only, like the chat), and everyone who's in gets the reminder.
 */
export async function crewPost(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const m = await member(accountId, s(b.club), now, true);
  if (isResult(m)) return m;
  const at = Math.round(Number(b.at));
  if (!Number.isFinite(at) || at < now - 5 * 60_000 || at > now + SOCIAL_LIMITS.crewDays * DAY) return fail(400, "crew.when");
  const title = checkText(b.title, SOCIAL_LIMITS.crewTitle);
  if (!title.ok) return fail(400, `crew.${title.error}`);
  let place = "";
  if (s(b.place).trim()) {
    const p = checkText(b.place, SOCIAL_LIMITS.crewPlace);
    if (!p.ok) return fail(400, `crew.${p.error}`);
    place = p.text;
  } else if (s(m.club.place_id)) place = s(m.club.name);
  const clubId = s(m.club.id);
  const [count] = await query("SELECT COUNT(*) AS n FROM crew_sessions WHERE club_id = ? AND starts_at > ?", [clubId, now]);
  if (n(count?.n) >= SOCIAL_LIMITS.crewUpcoming) return fail(429, "crewFull");
  if (!(await rateLimit(`social:crew:${accountId}`, CHAT_DAILY.crew, DAY, now))) return fail(429, "slow");
  const id = newId();
  await batch([
    {
      sql: "INSERT INTO crew_sessions (id, club_id, account_id, starts_at, title, place, created_at, reminded) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      args: [id, clubId, accountId, at, title.text, place, now],
    },
    { sql: "INSERT INTO crew_going (session_id, account_id, created_at, trained) VALUES (?, ?, ?, 0)", args: [id, accountId, now] },
  ]);
  if (!s(m.club.place_id) && n(m.me.suspended) === 0) {
    const to = await query(
      `SELECT cm.account_id AS id FROM club_members cm JOIN social_profiles sp ON sp.account_id = cm.account_id
       WHERE cm.club_id = ?1 AND cm.account_id != ?2 AND cm.chat_push = 1 AND sp.suspended = 0 AND ${NOT_BLOCKED("cm.account_id", "?2")}
       LIMIT ${SOCIAL_LIMITS.clubMembers}`,
      [clubId, accountId],
    );
    const route = `#/friends/club.${clubId}`;
    await Promise.all(
      to.map(async (r) => {
        if (await isMinor(s(r.id), now)) return;
        await notifyPlain(s(r.id), "crewNew", { name: s(m.me.my_name), text: title.text }, route);
      }),
    );
  }
  return ok({ id, sessions: await sessionsFor(accountId, clubId, s(m.club.owner_id), now) });
}

/** I'm in, or not any more. Only for a session that hasn't started more than three hours ago. */
export async function crewGoing(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const [cs] = await query("SELECT id, club_id, starts_at FROM crew_sessions WHERE id = ?", [s(b.id)]);
  if (!cs) return fail(404, "gone");
  const m = await member(accountId, s(cs.club_id), now, b.on !== false);
  if (isResult(m)) return m;
  if (b.on === false) await run("DELETE FROM crew_going WHERE session_id = ? AND account_id = ?", [s(cs.id), accountId]);
  else {
    if (n(cs.starts_at) < now - CREW_SHOWN_AFTER) return fail(400, "crew.over");
    if (!(await rateLimit(`social:crewGoing:${accountId}`, CHAT_DAILY.going, DAY, now))) return fail(429, "slow");
    await run("INSERT OR IGNORE INTO crew_going (session_id, account_id, created_at, trained) VALUES (?, ?, ?, 0)", [
      s(cs.id),
      accountId,
      now,
    ]);
  }
  return ok({ sessions: await sessionsFor(accountId, s(cs.club_id), s(m.club.owner_id), now) });
}

/** Cancels a session: its poster, or the club's starter. */
export async function crewCancel(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const [cs] = await query(
    "SELECT cs.id AS id, cs.club_id AS club_id, cs.account_id AS by_id, c.owner_id AS owner_id FROM crew_sessions cs JOIN clubs c ON c.id = cs.club_id WHERE cs.id = ?",
    [s(b.id)],
  );
  if (!cs || (s(cs.by_id) !== accountId && s(cs.owner_id) !== accountId)) return fail(404, "gone");
  await batch([
    { sql: "DELETE FROM crew_going WHERE session_id = ?", args: [s(cs.id)] },
    { sql: "DELETE FROM crew_sessions WHERE id = ?", args: [s(cs.id)] },
  ]);
  return ok({ sessions: await sessionsFor(accountId, s(cs.club_id), s(cs.owner_id), now) });
}

/**
 * A workout posted to Friends at `at`: every crew session the lifter is in that starts within the window around it
 * marks them trained, and the others in those sessions come back as handles to tag as training partners (post's
 * `tagPartners` keeps only mutual friends and five at most).
 */
export async function crewTrained(accountId: string, at: number): Promise<string[]> {
  const rows = await query(
    `SELECT g.session_id AS id FROM crew_going g JOIN crew_sessions cs ON cs.id = g.session_id
     WHERE g.account_id = ? AND cs.starts_at BETWEEN ? AND ?`,
    [accountId, at - CREW_TRAINED.after, at + CREW_TRAINED.before],
  );
  if (!rows.length) return [];
  const ids = rows.map((r) => s(r.id));
  const marks = ids.map(() => "?").join(", ");
  await run(`UPDATE crew_going SET trained = 1 WHERE account_id = ? AND session_id IN (${marks})`, [accountId, ...ids]);
  const mates = await query(
    `SELECT DISTINCT sp.handle AS handle FROM crew_going g JOIN social_profiles sp ON sp.account_id = g.account_id
     WHERE g.session_id IN (${marks}) AND g.account_id != ? AND sp.suspended = 0`,
    [...ids, accountId],
  );
  return mates.map((r) => s(r.handle));
}

/**
 * The "crew" schedule (every 15 minutes): everyone in a session starting within the next hour gets one reminder.
 * Safe to run twice: each session is claimed in one statement (`reminded = 0` to 1) before anyone is told.
 */
export async function crewReminders(now = Date.now()): Promise<{ sessions: number; pushed: number }> {
  const due = await query(
    "SELECT id FROM crew_sessions WHERE reminded = 0 AND starts_at > ? AND starts_at <= ? ORDER BY starts_at LIMIT 200",
    [now, now + CREW_REMIND_BEFORE],
  );
  let sessions = 0;
  let pushed = 0;
  for (const d of due) {
    const [claimed] = await query(
      `UPDATE crew_sessions SET reminded = 1 WHERE id = ? AND reminded = 0
       RETURNING id, club_id, title, place, starts_at`,
      [s(d.id)],
    );
    if (!claimed) continue;
    sessions++;
    const to = await query(
      `SELECT g.account_id AS id FROM crew_going g JOIN social_profiles sp ON sp.account_id = g.account_id
       JOIN club_members cm ON cm.club_id = ? AND cm.account_id = g.account_id
       WHERE g.session_id = ? AND sp.suspended = 0`,
      [s(claimed.club_id), s(claimed.id)],
    );
    const route = `#/friends/club.${s(claimed.club_id)}`;
    await Promise.all(
      to.map(async (r) => {
        pushed++;
        await notifyPlain(s(r.id), "crewSoon", { name: s(claimed.title), text: s(claimed.place) }, route);
      }),
    );
  }
  // Old sessions go once they're well past, with who was in them.
  const old = now - 60 * DAY;
  await batch([
    { sql: "DELETE FROM crew_going WHERE session_id IN (SELECT id FROM crew_sessions WHERE starts_at < ?)", args: [old] },
    { sql: "DELETE FROM crew_sessions WHERE starts_at < ?", args: [old] },
  ]);
  return { sessions, pushed };
}

// --- Leaving, deleting and reports ---

/** Rows of chat and crew sessions to delete with a club (its starter deleted it or left Friends). */
export function clubChatDeletes(clubId: string): { sql: string; args: string[] }[] {
  return [
    { sql: "DELETE FROM club_messages WHERE club_id = ?", args: [clubId] },
    { sql: "DELETE FROM crew_going WHERE session_id IN (SELECT id FROM crew_sessions WHERE club_id = ?)", args: [clubId] },
    { sql: "DELETE FROM crew_sessions WHERE club_id = ?", args: [clubId] },
  ];
}

/** What a lifter leaving Friends or deleting their account takes with them (social.ts socialDeletes). */
export function chatDeletes(accountId: string): { sql: string; args: string[] }[] {
  const a = [accountId];
  const owned = "SELECT id FROM clubs WHERE owner_id = ?";
  return [
    { sql: `DELETE FROM club_messages WHERE club_id IN (${owned})`, args: a },
    { sql: `DELETE FROM crew_going WHERE session_id IN (SELECT id FROM crew_sessions WHERE club_id IN (${owned}))`, args: a },
    { sql: `DELETE FROM crew_sessions WHERE club_id IN (${owned})`, args: a },
    { sql: "DELETE FROM club_messages WHERE account_id = ?", args: a },
    { sql: "DELETE FROM crew_going WHERE session_id IN (SELECT id FROM crew_sessions WHERE account_id = ?)", args: a },
    { sql: "DELETE FROM crew_sessions WHERE account_id = ?", args: a },
    { sql: "DELETE FROM crew_going WHERE account_id = ?", args: a },
  ];
}
