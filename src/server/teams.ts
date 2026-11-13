// School teams (Melvin, 2026-11-13: "make the app free for anybody in high school or below … even high school coaches",
// shaped with him into: free Pro for high school coaches who prove a school email address, and free Pro through the
// team for their athletes aged 13 to 18; nobody under 13; no open student discount). Decision record:
// docs/decisions/school-teams.md.
//
// - A coach proves their school address with a six-digit code sent to it. Addresses at a known school domain (the
//   allowlist staff build on the admin Users tab, or a pattern only schools use, like k12.<state>.us) are approved at
//   once; any other address waits for staff, who check the school's website. Free mail (Gmail, Outlook…) never counts.
// - The proof lasts a school year (`verifiedMs`), then the coach confirms the address again, so a coach who leaves the
//   school stops getting free Pro, and so do their athletes.
// - A verified coach makes teams (a name, a code that lasts the season). An athlete enters the code, says how old they
//   are (13 to 18) and agrees that the coach sees their workouts, which links them as the coach's client (trainer mode,
//   coach.ts), so the coach gets the same reports, routines and chat. Body data is never shared through the team.
// - Each team has a weekly board, members only: workouts and sets in the last 7 days. Never weights, body data or a
//   public page.
import { createHash, randomInt } from "node:crypto";

import { cleanEmail, type SendMail } from "./accounts";
import { cleanCode, COACH_LIMITS, nameOf, newCode, unlink } from "./coach";
import { batch, query, rateLimit, run } from "./db";

const DAY = 86_400_000;

export const TEAM_LIMITS = {
  /** How long an emailed code works, and wrong tries before it stops. */
  codeMs: 30 * 60_000,
  tries: 5,
  /** Codes a coach can ask for in a day. */
  codesPerDay: 5,
  /** How long a school address stays proven: a school year and a bit, then the coach confirms it again. */
  verifiedMs: 400 * DAY,
  /** Teams per coach and athletes per team. */
  teams: 5,
  members: 100,
  /** Clients a verified school coach can have, teams included (other coaches stay at COACH_LIMITS.clients). */
  clients: 300,
  /** Ages that get free Pro through a team. Under 13 is never allowed (COPPA); over 18 isn't high school. */
  minAge: 13,
  maxAge: 18,
  /** Team codes looked up or used per account per hour. */
  triesPerHour: 20,
  /** The board counts the last 7 days. */
  boardMs: 7 * DAY,
};

// Free and personal mail: an address there proves nothing about a school.
const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.ca",
  "live.com",
  "live.ca",
  "msn.com",
  "yahoo.com",
  "yahoo.ca",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "web.de",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "shaw.ca",
  "telus.net",
  "rogers.com",
  "sympatico.ca",
  "comcast.net",
  "verizon.net",
  "att.net",
  "orange.fr",
  "free.fr",
  "laposte.net",
  "libero.it",
  "yahoo.co.jp",
  "docomo.ne.jp",
]);

// Domains only schools get: US K-12 (k12.ca.us, district.k12.tx.us), UK schools (.sch.uk) and Japanese
// school networks (.ed.jp). Anything else waits for staff.
const SCHOOL_PATTERNS = [/(^|\.)k12\.[a-z]{2}\.us$/, /\.sch\.uk$/, /(^|\.)ed\.jp$/];

export const domainOf = (email: string) => email.slice(email.lastIndexOf("@") + 1).toLowerCase();
export const isFreeMail = (domain: string) => FREE_MAIL.has(domain);
export const looksLikeSchool = (domain: string) => SCHOOL_PATTERNS.some((p) => p.test(domain));

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const clean = (x: unknown, max: number) =>
  typeof x === "string"
    ? x
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

export type SchoolStatus = "code" | "pending" | "approved" | "rejected";

/** Where a coach's school proof stands, for the app. */
export interface SchoolCoach {
  email: string;
  school: string;
  status: SchoolStatus;
  /** Approved and still within the school year it was proven for. */
  active: boolean;
  /** When the proof runs out (approved only). */
  until: number | null;
}

type CoachRow = {
  account_id: string;
  email: string;
  school: string;
  domain: string;
  status: string;
  code_hash: string;
  expires_at: number;
  tries: number;
  verified_at: number | null;
  created_at: number;
};

async function coachRow(accountId: string): Promise<CoachRow | null> {
  const [r] = await query<CoachRow>("SELECT * FROM school_coaches WHERE account_id = ?", [accountId]);
  return r ?? null;
}

const toCoach = (r: CoachRow, now: number): SchoolCoach => {
  const until = r.status === "approved" && r.verified_at != null ? n(r.verified_at) + TEAM_LIMITS.verifiedMs : null;
  return { email: s(r.email), school: s(r.school), status: r.status as SchoolStatus, active: until != null && until > now, until };
};

/** A coach with an approved school address that hasn't run out. */
export async function isSchoolCoach(accountId: string, now = Date.now()): Promise<boolean> {
  const r = await coachRow(accountId);
  return !!r && toCoach(r, now).active;
}

export type StartError = "email" | "freeMail" | "school" | "blocked" | "slow" | "mail";

/** Sends a code to a coach's school address. In development (no mail) the code is handed back. */
export async function startSchool(
  accountId: string,
  rawEmail: unknown,
  rawSchool: unknown,
  mail: SendMail | null,
  now = Date.now(),
): Promise<{ ok: true; devCode?: string } | { ok: false; error: StartError }> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: false, error: "email" };
  const domain = domainOf(email);
  if (isFreeMail(domain)) return { ok: false, error: "freeMail" };
  const school = clean(rawSchool, 80);
  if (school.length < 3) return { ok: false, error: "school" };
  const [d] = await query<{ status: string }>("SELECT status FROM school_domains WHERE domain = ?", [domain]);
  if (d?.status === "blocked") return { ok: false, error: "blocked" };
  if (!(await rateLimit(`school:code:${accountId}`, TEAM_LIMITS.codesPerDay, DAY, now))) return { ok: false, error: "slow" };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const prev = await coachRow(accountId);
  await run(
    `INSERT INTO school_coaches (account_id, email, school, domain, status, code_hash, expires_at, tries, verified_at, created_at)
     VALUES (?, ?, ?, ?, 'code', ?, ?, 0, ?, ?)
     ON CONFLICT (account_id) DO UPDATE SET email = excluded.email, school = excluded.school, domain = excluded.domain,
       status = CASE WHEN school_coaches.status = 'approved' AND school_coaches.email = excluded.email THEN 'approved' ELSE 'code' END,
       code_hash = excluded.code_hash, expires_at = excluded.expires_at, tries = 0`,
    [accountId, email, school, domain, hash(`${accountId}:${code}`), now + TEAM_LIMITS.codeMs, prev?.verified_at ?? null, now],
  );
  const text = `Your Liftsmith code to confirm you coach at ${school} is ${code}\n\nType it in the app. It works for 30 minutes.\n\nIf you didn't ask for it, ignore this email: nothing happens without the code.\n\nLiftsmith · https://www.getliftsmith.com`;
  if (!mail) {
    if (process.env.NODE_ENV !== "production") return { ok: true, devCode: code };
    return { ok: false, error: "mail" };
  }
  const sent = await mail(email, `${code} is your Liftsmith school coach code`, text).catch(() => false);
  return sent ? { ok: true } : { ok: false, error: "mail" };
}

/**
 * Checks the emailed code. Right, the address is proven: at a known school domain it's approved at once, otherwise it
 * waits for staff. Each try is counted before comparing, so parallel guesses can't pass the limit.
 */
export async function confirmSchool(
  accountId: string,
  code: unknown,
  now = Date.now(),
): Promise<{ ok: true; coach: SchoolCoach } | { ok: false; error: "wrong" | "expired" }> {
  if (typeof code !== "string") return { ok: false, error: "wrong" };
  const counted = await query<{ code_hash: string; domain: string }>(
    `UPDATE school_coaches SET tries = tries + 1 WHERE account_id = ? AND tries < ? AND expires_at >= ? AND code_hash != ''
     RETURNING code_hash, domain`,
    [accountId, TEAM_LIMITS.tries, now],
  );
  const c = counted[0];
  if (!c) return { ok: false, error: "expired" };
  if (hash(`${accountId}:${code.trim()}`) !== s(c.code_hash)) return { ok: false, error: "wrong" };
  const domain = s(c.domain);
  const [d] = await query<{ status: string }>("SELECT status FROM school_domains WHERE domain = ?", [domain]);
  const known = d?.status === "approved" || looksLikeSchool(domain);
  await run(
    `UPDATE school_coaches SET code_hash = '', expires_at = 0, verified_at = ?,
       status = CASE WHEN ? = 1 THEN 'approved' WHEN status = 'approved' THEN 'approved' ELSE 'pending' END
     WHERE account_id = ?`,
    [now, known ? 1 : 0, accountId],
  );
  return { ok: true, coach: toCoach((await coachRow(accountId))!, now) };
}

// --- Teams ---

export interface Team {
  id: string;
  name: string;
  code: string;
  school: string;
  coachId: string;
  coachName: string;
  members: number;
}
export interface Member {
  id: string;
  name: string;
  since: number;
}

type TeamRow = { id: string; coach_id: string; name: string; code: string; created_at: number };

async function teamOut(r: TeamRow): Promise<Team> {
  const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?", [r.id]);
  const coach = await coachRow(s(r.coach_id));
  return {
    id: s(r.id),
    name: s(r.name),
    code: s(r.code),
    school: s(coach?.school),
    coachId: s(r.coach_id),
    coachName: await nameOf(s(r.coach_id)),
    members: n(c?.n),
  };
}

export type TeamError = "notCoach" | "name" | "full";

/** A verified coach makes a team. Its code works until the coach makes a new one or deletes the team. */
export async function makeTeam(
  coachId: string,
  rawName: unknown,
  now = Date.now(),
  code = newCode(),
): Promise<Team | { error: TeamError }> {
  if (!(await isSchoolCoach(coachId, now))) return { error: "notCoach" };
  const name = clean(rawName, 60);
  if (name.length < 2) return { error: "name" };
  const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM teams WHERE coach_id = ?", [coachId]);
  if (n(c?.n) >= TEAM_LIMITS.teams) return { error: "full" };
  const id = newCode();
  await run("INSERT INTO teams (id, coach_id, name, code, created_at) VALUES (?, ?, ?, ?, ?)", [id, coachId, name, code, now]);
  return teamOut({ id, coach_id: coachId, name, code, created_at: now });
}

async function ownTeam(coachId: string, teamId: unknown): Promise<TeamRow | null> {
  if (typeof teamId !== "string" || !/^[2-9A-HJ-NP-Z]{8}$/.test(teamId)) return null;
  const [r] = await query<TeamRow>("SELECT * FROM teams WHERE id = ? AND coach_id = ?", [teamId, coachId]);
  return r ?? null;
}

/** A fresh code for a team: the old one stops working; athletes already on the team stay. */
export async function newTeamCode(coachId: string, teamId: unknown, code = newCode()): Promise<Team | null> {
  const r = await ownTeam(coachId, teamId);
  if (!r) return null;
  await run("UPDATE teams SET code = ? WHERE id = ?", [code, r.id]);
  return teamOut({ ...r, code });
}

/** Deletes a team: its athletes leave it, and stop sharing with the coach unless they joined the coach some other way. */
export async function deleteTeam(coachId: string, teamId: unknown): Promise<boolean> {
  const r = await ownTeam(coachId, teamId);
  if (!r) return false;
  const members = await query<{ account_id: string }>("SELECT account_id FROM team_members WHERE team_id = ?", [r.id]);
  await batch([
    { sql: "DELETE FROM team_members WHERE team_id = ?", args: [r.id] },
    { sql: "DELETE FROM teams WHERE id = ?", args: [r.id] },
  ]);
  for (const m of members) await unlinkUnlessOtherTeam(coachId, s(m.account_id));
  return true;
}

/** Ends the coach link a team made, unless the athlete is still on another of that coach's teams. */
async function unlinkUnlessOtherTeam(coachId: string, athleteId: string): Promise<void> {
  const [still] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE t.coach_id = ? AND tm.account_id = ?",
    [coachId, athleteId],
  );
  if (n(still?.n) === 0) await unlink(coachId, athleteId);
}

/** The coach takes an athlete off a team. */
export async function removeMember(coachId: string, teamId: unknown, athleteId: unknown): Promise<boolean> {
  const r = await ownTeam(coachId, teamId);
  if (!r || typeof athleteId !== "string") return false;
  const gone = await run("DELETE FROM team_members WHERE team_id = ? AND account_id = ?", [r.id, athleteId]);
  if (gone) await unlinkUnlessOtherTeam(coachId, athleteId);
  return gone > 0;
}

/** An athlete leaves a team. */
export async function leaveTeam(accountId: string, teamId: unknown): Promise<boolean> {
  if (typeof teamId !== "string") return false;
  const [t] = await query<TeamRow>("SELECT * FROM teams WHERE id = ?", [teamId]);
  if (!t) return false;
  const gone = await run("DELETE FROM team_members WHERE team_id = ? AND account_id = ?", [teamId, accountId]);
  if (gone) await unlinkUnlessOtherTeam(s(t.coach_id), accountId);
  return gone > 0;
}

export type JoinError = "slow" | "unknown" | "self" | "age" | "full" | "coachFull" | "coaches" | "lapsed";

/** Whose a team code is. Links nothing. */
export async function previewTeam(accountId: string, raw: unknown, now = Date.now()): Promise<{ team: Team } | { error: JoinError }> {
  const code = cleanCode(raw);
  if (!(await rateLimit(`team:try:${accountId}`, TEAM_LIMITS.triesPerHour, 3_600_000, now))) return { error: "slow" };
  if (!code) return { error: "unknown" };
  const [r] = await query<TeamRow>("SELECT * FROM teams WHERE code = ?", [code]);
  if (!r) return { error: "unknown" };
  if (s(r.coach_id) === accountId) return { error: "self" };
  if (!(await isSchoolCoach(s(r.coach_id), now))) return { error: "lapsed" };
  return { team: await teamOut(r) };
}

/** The age a birth year gives this year, which may be a year more than the athlete is today. */
export const ageFrom = (birthYear: number, now: number) => new Date(now).getUTCFullYear() - birthYear;

/**
 * An athlete joins with the team's code, their age and their agreement that the coach sees their workouts. Ages are
 * checked here as well as in the app: 13 to 18 only. Joining links them as the coach's client (coach.ts).
 */
export async function joinTeam(
  accountId: string,
  raw: unknown,
  age: unknown,
  now = Date.now(),
): Promise<{ team: Team } | { error: JoinError }> {
  if (typeof age !== "number" || !Number.isInteger(age) || age < TEAM_LIMITS.minAge || age > TEAM_LIMITS.maxAge) return { error: "age" };
  const seen = await previewTeam(accountId, raw, now);
  if ("error" in seen) return seen;
  const team = seen.team;
  const [had] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_members WHERE team_id = ? AND account_id = ?", [
    team.id,
    accountId,
  ]);
  if (n(had?.n) > 0) return seen;
  if (team.members >= TEAM_LIMITS.members) return { error: "full" };
  const [linked] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ? AND client_id = ?", [
    team.coachId,
    accountId,
  ]);
  if (!n(linked?.n)) {
    const [mine] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE client_id = ?", [accountId]);
    if (n(mine?.n) >= COACH_LIMITS.coaches) return { error: "coaches" };
    const [theirs] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ?", [team.coachId]);
    if (n(theirs?.n) >= TEAM_LIMITS.clients) return { error: "coachFull" };
  }
  // Born this many years ago, at the latest: kept so free Pro ends when they pass high school age.
  const birthYear = new Date(now).getUTCFullYear() - age;
  await batch([
    {
      sql: "INSERT OR IGNORE INTO team_members (team_id, account_id, birth_year, joined_at) VALUES (?, ?, ?, ?)",
      args: [team.id, accountId, birthYear, now],
    },
    { sql: "INSERT OR IGNORE INTO coach_links (coach_id, client_id, created_at) VALUES (?, ?, ?)", args: [team.coachId, accountId, now] },
  ]);
  return { team: { ...team, members: team.members + 1 } };
}

/** Free Pro through school teams: "school" for a verified coach, "team" for an athlete of high school age. */
export async function schoolPro(accountId: string, now = Date.now()): Promise<"school" | "team" | null> {
  if (await isSchoolCoach(accountId, now)) return "school";
  const rows = await query<{ coach_id: string; birth_year: number }>(
    "SELECT t.coach_id, tm.birth_year FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.account_id = ?",
    [accountId],
  );
  for (const r of rows) {
    // The birth year says how old they turn this year: one more than the oldest high schooler is past it.
    if (ageFrom(n(r.birth_year), now) > TEAM_LIMITS.maxAge + 1) continue;
    if (await isSchoolCoach(s(r.coach_id), now)) return "team";
  }
  return null;
}

/**
 * Whether the account belongs to someone under 18: by the age they gave joining a team, or the birth year on their
 * synced profile. Used for teen-safe defaults elsewhere (social.ts: no public profile, not suggested to strangers).
 */
export async function isMinor(accountId: string, now = Date.now()): Promise<boolean> {
  const rows = await query<{ birth_year: number }>("SELECT birth_year FROM team_members WHERE account_id = ?", [accountId]);
  if (rows.some((r) => ageFrom(n(r.birth_year), now) < 18)) return true;
  const [p] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  try {
    const year = (JSON.parse(String(p?.body ?? "{}")) as { birthYear?: unknown }).birthYear;
    return typeof year === "number" && ageFrom(year, now) < 18;
  } catch {
    return false;
  }
}

/** One line on a team's weekly board. */
export interface BoardRow {
  id: string;
  name: string;
  workouts: number;
  sets: number;
}

async function countSince(accountId: string, from: number): Promise<{ workouts: number; sets: number }> {
  const [r] = await query<{ w: number; s: number }>(
    `SELECT SUM(CASE WHEN json_extract(body, '$.type') = 'sessionEnd' THEN 1 ELSE 0 END) AS w,
            SUM(CASE WHEN json_extract(body, '$.type') = 'set' THEN 1 ELSE 0 END) AS s
     FROM sync_events WHERE account_id = ? AND at >= ? AND body IS NOT NULL`,
    [accountId, from],
  );
  return { workouts: n(r?.w), sets: n(r?.s) };
}

/** First name only: the board is for teammates, and teenagers' full names don't need to be on it. */
export const firstName = (name: string) => name.trim().split(/\s+/)[0]?.slice(0, 30) ?? "";

/** The team's board for the last 7 days, most workouts first, for the coach and the team's athletes only. */
export async function teamBoard(accountId: string, teamId: unknown, now = Date.now()): Promise<{ team: Team; board: BoardRow[] } | null> {
  if (typeof teamId !== "string") return null;
  const [t] = await query<TeamRow>("SELECT * FROM teams WHERE id = ?", [teamId]);
  if (!t) return null;
  const members = await query<{ account_id: string }>("SELECT account_id FROM team_members WHERE team_id = ?", [teamId]);
  const ids = members.map((m) => s(m.account_id));
  if (s(t.coach_id) !== accountId && !ids.includes(accountId)) return null;
  const board: BoardRow[] = [];
  for (const id of ids) {
    const c = await countSince(id, now - TEAM_LIMITS.boardMs);
    board.push({ id, name: firstName(await nameOf(id)), ...c });
  }
  board.sort((a, b) => b.workouts - a.workouts || b.sets - a.sets || a.name.localeCompare(b.name));
  return { team: await teamOut(t), board };
}

/** Everything the Teams part of Coaching shows: the coach's school proof and teams, and the teams this lifter is on. */
export async function teamsOverview(
  accountId: string,
  now = Date.now(),
): Promise<{ school: SchoolCoach | null; codeSent: boolean; teams: Team[]; joined: Team[]; members: Record<string, Member[]> }> {
  const row = await coachRow(accountId);
  const own = await query<TeamRow>("SELECT * FROM teams WHERE coach_id = ? ORDER BY created_at", [accountId]);
  const joined = await query<TeamRow>(
    "SELECT t.* FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.account_id = ? ORDER BY tm.joined_at",
    [accountId],
  );
  const members: Record<string, Member[]> = {};
  for (const t of own) {
    const rows = await query<{ account_id: string; joined_at: number }>(
      "SELECT account_id, joined_at FROM team_members WHERE team_id = ? ORDER BY joined_at",
      [t.id],
    );
    members[s(t.id)] = await Promise.all(
      rows.map(async (r) => ({ id: s(r.account_id), since: n(r.joined_at), name: await nameOf(s(r.account_id)) })),
    );
  }
  return {
    school: row && (row.status !== "code" || row.verified_at != null) ? toCoach(row, now) : null,
    // A code is on its way to the school address and still works.
    codeSent: !!row && s(row.code_hash) !== "" && n(row.expires_at) >= now,
    teams: await Promise.all(own.map(teamOut)),
    // Joined teams never carry their code: only the coach shares it.
    joined: (await Promise.all(joined.map(teamOut))).map((t) => ({ ...t, code: "" })),
    members,
  };
}

// --- Staff (admin Users tab) ---

export interface SchoolReview {
  accountId: string;
  email: string;
  school: string;
  domain: string;
  status: SchoolStatus;
  verifiedAt: number | null;
  teams: number;
  athletes: number;
}

/** Coaches waiting for staff, then the 50 most recent decisions, with the domains staff have ruled on. */
export async function schoolQueue(): Promise<{ coaches: SchoolReview[]; domains: { domain: string; status: string; school: string }[] }> {
  const rows = await query<CoachRow & { teams: number; athletes: number }>(
    `SELECT sc.*, (SELECT COUNT(*) FROM teams t WHERE t.coach_id = sc.account_id) AS teams,
       (SELECT COUNT(*) FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE t.coach_id = sc.account_id) AS athletes
     FROM school_coaches sc WHERE sc.status != 'code' ORDER BY (sc.status = 'pending') DESC, sc.verified_at DESC LIMIT 100`,
  );
  const domains = await query<{ domain: string; status: string; school: string }>(
    "SELECT domain, status, school FROM school_domains ORDER BY at DESC LIMIT 200",
  );
  return {
    coaches: rows.map((r) => ({
      accountId: s(r.account_id),
      email: s(r.email),
      school: s(r.school),
      domain: s(r.domain),
      status: r.status as SchoolStatus,
      verifiedAt: r.verified_at == null ? null : n(r.verified_at),
      teams: n(r.teams),
      athletes: n(r.athletes),
    })),
    domains: domains.map((d) => ({ domain: s(d.domain), status: s(d.status), school: s(d.school) })),
  };
}

/**
 * Staff approve or reject a coach. Approving also trusts the domain, so the next coach there is approved at once and
 * anyone waiting there is approved now; rejecting with `block` stops the domain for good.
 */
export async function decideSchool(accountId: unknown, action: unknown, now = Date.now()): Promise<boolean> {
  if (typeof accountId !== "string") return false;
  const r = await coachRow(accountId);
  if (!r || (action !== "approve" && action !== "reject" && action !== "block")) return false;
  const status = action === "approve" ? "approved" : "blocked";
  if (action !== "reject") {
    await run(
      `INSERT INTO school_domains (domain, status, school, at) VALUES (?, ?, ?, ?)
       ON CONFLICT (domain) DO UPDATE SET status = excluded.status, at = excluded.at`,
      [r.domain, status, r.school, now],
    );
  }
  if (action === "approve") {
    await run("UPDATE school_coaches SET status = 'approved' WHERE domain = ? AND status = 'pending' AND verified_at IS NOT NULL", [
      r.domain,
    ]);
  } else if (action === "block") {
    await run("UPDATE school_coaches SET status = 'rejected' WHERE domain = ?", [r.domain]);
  } else {
    await run("UPDATE school_coaches SET status = 'rejected' WHERE account_id = ?", [accountId]);
  }
  return true;
}

/** Deleting an account deletes its school proof, its teams (athletes stay, teamless) and its places on teams. */
export const teamDeletes = (accountId: string) => [
  { sql: "DELETE FROM school_coaches WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE coach_id = ?)", args: [accountId] },
  { sql: "DELETE FROM teams WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM team_members WHERE account_id = ?", args: [accountId] },
];
