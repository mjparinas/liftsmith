// The admin panel's Users tab (Gradelings' Users, cut to what a Liftsmith account holds): find an account by
// email or id, see how it signs in, its devices and how much it has synced, and act on it. Synced bodies (sets,
// health readings, injuries, cycle logs) are never read here, only counted. Private staff notes are kept per
// account and deleted with it.
import { hasLifetimePro } from "./creators";
import { query, run } from "./db";
import { accountHasPro } from "./review";
import { stateOf, type ModState } from "./socialModeration";

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? null : String(v));

export interface AccountRow {
  id: string;
  email: string | null;
  createdAt: number;
  lastSeen: number;
  providers: string[];
  devices: number;
  events: number;
  /** Coach (made an invite or has clients), client (linked to a coach), both, or neither: an ordinary lifter. */
  role: Role;
  /** Their Friends handle, or null when they haven't joined Friends. */
  handle: string | null;
  /** Friends standing (socialModeration.ts). */
  state: ModState;
  /** Reports about them (profile, posts and comments): waiting for staff, and ever. */
  openReports: number;
  reports: number;
  /** Under 18 by a school team or the birth year in their settings (a year-based check, like isMinor). */
  minor: boolean;
}

/** The Users tab's filters (moderation.md): everyone, reported and waiting, acted on, or under 18. */
export const USER_FILTERS = ["all", "reported", "actioned", "teens"] as const;
export type UserFilter = (typeof USER_FILTERS)[number];
export const USER_SORTS = ["newest", "reports", "seen"] as const;
export type UserSort = (typeof USER_SORTS)[number];

export type Role = "lifter" | "coach" | "client" | "both";

export interface AccountDetail extends AccountRow {
  pro: boolean;
  identities: { provider: string; email: string | null; createdAt: number }[];
  sessions: { platform: string | null; createdAt: number; lastSeen: number; expiresAt: number }[];
  sync: { events: number; deleted: number; bytes: number; records: number; gyms: number; firstAt: number | null; lastAt: number | null };
  notes: Note[];
}

export interface Note {
  id: number;
  at: number;
  author: string;
  text: string;
}

export const NOTE_MAX = 1000;

// Reports grouped by who they're about (a profile, or the author of a post or comment): one pass over reports.
const REPORTED = `SELECT who, COUNT(*) AS total, SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open FROM (
    SELECT r.status, CASE r.kind WHEN 'profile' THEN r.target_id
      WHEN 'post' THEN (SELECT account_id FROM posts WHERE id = r.target_id)
      ELSE (SELECT account_id FROM post_comments WHERE id = r.target_id) END AS who
    FROM reports r) WHERE who IS NOT NULL GROUP BY who`;

// ?1 is the youngest birth year that's 18 or over this year.
const ROW_SQL = `SELECT a.id, a.email, a.created_at, a.last_seen,
    sp.handle AS handle, sp.suspended AS suspended, sp.suspended_until AS suspended_until, sp.boards_off AS boards_off,
    COALESCE(rc.open, 0) AS open_reports, COALESCE(rc.total, 0) AS reports,
    (EXISTS (SELECT 1 FROM team_members t WHERE t.account_id = a.id AND t.birth_year > ?1)
      OR EXISTS (SELECT 1 FROM sync_records sr WHERE sr.account_id = a.id AND sr.key = 'profile'
        AND json_valid(sr.body) AND json_extract(sr.body, '$.birthYear') > ?1)) AS minor,
    (SELECT GROUP_CONCAT(DISTINCT provider) FROM account_identities i WHERE i.account_id = a.id) AS providers,
    (SELECT COUNT(*) FROM account_sessions x WHERE x.account_id = a.id) AS devices,
    (SELECT COUNT(*) FROM sync_events e WHERE e.account_id = a.id AND e.body IS NOT NULL) AS events,
    (EXISTS (SELECT 1 FROM coach_accounts c WHERE c.account_id = a.id) OR EXISTS (SELECT 1 FROM coach_links l WHERE l.coach_id = a.id)) AS coach,
    EXISTS (SELECT 1 FROM coach_links l WHERE l.client_id = a.id) AS client
  FROM accounts a LEFT JOIN social_profiles sp ON sp.account_id = a.id LEFT JOIN (${REPORTED}) rc ON rc.who = a.id`;

const adultYear = (now: number) => new Date(now).getUTCFullYear() - 18;

const roleOf = (coach: unknown, client: unknown): Role =>
  n(coach) && n(client) ? "both" : n(coach) ? "coach" : n(client) ? "client" : "lifter";

const toRow = (r: Record<string, unknown>): AccountRow => ({
  id: String(r.id),
  email: s(r.email),
  createdAt: n(r.created_at),
  lastSeen: n(r.last_seen),
  providers: s(r.providers)?.split(",").sort() ?? [],
  devices: n(r.devices),
  events: n(r.events),
  role: roleOf(r.coach, r.client),
  handle: r.handle == null ? null : String(r.handle),
  state: stateOf(r),
  openReports: n(r.open_reports),
  reports: n(r.reports),
  minor: !!n(r.minor),
});

const WHERE: Record<UserFilter, string> = {
  all: "",
  reported: "open_reports > 0",
  actioned: "(suspended != 0 OR boards_off != 0)",
  teens: "minor = 1",
};
const ORDER: Record<UserSort, string> = {
  newest: "created_at DESC",
  reports: "open_reports DESC, reports DESC, created_at DESC",
  seen: "last_seen DESC",
};

/**
 * Accounts matching an email (part of one), an account id or a Friends handle, filtered and sorted for the Users tab;
 * the newest first by default. Empty search: the latest.
 */
export async function searchAccounts(
  q: string,
  limit = 50,
  opts: { filter?: UserFilter; sort?: UserSort; now?: number } = {},
): Promise<AccountRow[]> {
  const term = q.trim().toLowerCase().slice(0, 200);
  const like = `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const handle = term.replace(/^@/, "");
  const match = term
    ? `(x.id = ?2 OR x.email LIKE ?3 ESCAPE '\\' OR x.handle = ?4 OR x.id IN (SELECT account_id FROM account_identities WHERE email LIKE ?3 ESCAPE '\\'))`
    : "";
  const where = [match, WHERE[opts.filter ?? "all"]].filter(Boolean).join(" AND ");
  const rows = await query(
    `SELECT x.* FROM (${ROW_SQL}) x ${where ? `WHERE ${where}` : ""}
     ORDER BY ${ORDER[opts.sort ?? "newest"]} LIMIT ${Math.max(1, Math.min(200, Math.round(limit)))}`,
    term ? [adultYear(opts.now ?? Date.now()), q.trim(), like, handle] : [adultYear(opts.now ?? Date.now())],
  );
  return rows.map(toRow);
}

export async function accountTotals(now = Date.now()) {
  const day = 86_400_000;
  const rows = await query(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS new30, SUM(CASE WHEN last_seen >= ? THEN 1 ELSE 0 END) AS active30 FROM accounts`,
    [now - 30 * day, now - 30 * day],
  );
  return { total: n(rows[0]?.total), new30: n(rows[0]?.new30), active30: n(rows[0]?.active30), ...(await coachTotals(now)) };
}

export interface CoachTotals {
  /** Accounts that coach: made an invite, or have clients from before coaches were counted. */
  coaches: number;
  /** Of those, how many came in through the website's coaches page. */
  coachesFromPage: number;
  /** Coaches with at least one client. */
  coachesWithClients: number;
  /** Accounts linked to at least one coach. */
  clients: number;
  /** New since `since` (30 days by default), and of the new coaches, how many came from the coaches page. */
  coachesNew: number;
  coachesNewFromPage: number;
  clientsNew: number;
}

/** Coach and client counts for the Users tab and the morning digest (Melvin, 2026-11-12). */
export async function coachTotals(now = Date.now(), since = now - 30 * 86_400_000): Promise<CoachTotals> {
  const [c] = await query(
    `SELECT COUNT(*) AS coaches, SUM(CASE WHEN via = 'coaches' THEN 1 ELSE 0 END) AS from_page,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM coach_links l WHERE l.coach_id = x.id) THEN 1 ELSE 0 END) AS with_clients,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS new_coaches,
        SUM(CASE WHEN created_at >= ? AND via = 'coaches' THEN 1 ELSE 0 END) AS new_from_page
      FROM (SELECT account_id AS id, created_at, via FROM coach_accounts
            UNION SELECT coach_id AS id, MIN(created_at) AS created_at, 'app' AS via FROM coach_links
              WHERE coach_id NOT IN (SELECT account_id FROM coach_accounts) GROUP BY coach_id) x`,
    [since, since],
  );
  const [k] = await query(
    "SELECT COUNT(*) AS clients, SUM(CASE WHEN first_at >= ? THEN 1 ELSE 0 END) AS new_clients FROM (SELECT client_id, MIN(created_at) AS first_at FROM coach_links GROUP BY client_id)",
    [since],
  );
  return {
    coaches: n(c?.coaches),
    coachesFromPage: n(c?.from_page),
    coachesWithClients: n(c?.with_clients),
    clients: n(k?.clients),
    coachesNew: n(c?.new_coaches),
    coachesNewFromPage: n(c?.new_from_page),
    clientsNew: n(k?.new_clients),
  };
}

export async function accountDetail(id: string, now = Date.now()): Promise<AccountDetail | null> {
  const rows = await query(`${ROW_SQL} WHERE a.id = ?2`, [adultYear(now), id]);
  if (!rows[0]) return null;
  const row = toRow(rows[0]);
  const [identities, sessions, sync, records, notes] = await Promise.all([
    query("SELECT provider, email, created_at FROM account_identities WHERE account_id = ? ORDER BY created_at", [id]),
    query("SELECT platform, created_at, last_seen, expires_at FROM account_sessions WHERE account_id = ? ORDER BY last_seen DESC", [id]),
    query(
      `SELECT SUM(CASE WHEN body IS NOT NULL THEN 1 ELSE 0 END) AS events, SUM(CASE WHEN body IS NULL THEN 1 ELSE 0 END) AS deleted,
        SUM(COALESCE(LENGTH(body), 0)) AS bytes, MIN(at) AS first_at, MAX(at) AS last_at FROM sync_events WHERE account_id = ?`,
      [id],
    ),
    query(
      "SELECT COUNT(*) AS records, SUM(CASE WHEN key LIKE 'gym:%' AND body IS NOT NULL THEN 1 ELSE 0 END) AS gyms FROM sync_records WHERE account_id = ?",
      [id],
    ),
    listNotes(id),
  ]);
  const sy = sync[0] ?? {};
  return {
    ...row,
    pro: accountHasPro(row.email) || (await hasLifetimePro(id)),
    identities: identities.map((r) => ({ provider: String(r.provider), email: s(r.email), createdAt: n(r.created_at) })),
    sessions: sessions.map((r) => ({
      platform: s(r.platform),
      createdAt: n(r.created_at),
      lastSeen: n(r.last_seen),
      expiresAt: n(r.expires_at),
    })),
    sync: {
      events: n(sy.events),
      deleted: n(sy.deleted),
      bytes: n(sy.bytes),
      records: n(records[0]?.records),
      gyms: n(records[0]?.gyms),
      firstAt: sy.first_at == null ? null : n(sy.first_at),
      lastAt: sy.last_at == null ? null : n(sy.last_at),
    },
    notes,
  };
}

/** Ends every device's session; the devices keep their data and ask to sign in again. */
export async function signOutEverywhere(id: string): Promise<number> {
  return run("DELETE FROM account_sessions WHERE account_id = ?", [id]);
}

export async function listNotes(accountId: string): Promise<Note[]> {
  const rows = await query("SELECT id, at, author, text FROM account_notes WHERE account_id = ? ORDER BY id DESC", [accountId]);
  return rows.map((r) => ({ id: n(r.id), at: n(r.at), author: String(r.author), text: String(r.text) }));
}

export function checkNote(v: unknown): { ok: true; text: string } | { ok: false; error: string } {
  const text = typeof v === "string" ? v.trim() : "";
  if (!text) return { ok: false, error: "Write the note first." };
  if (text.length > NOTE_MAX) return { ok: false, error: `Keep a note under ${NOTE_MAX} characters.` };
  return { ok: true, text };
}

export async function addNote(accountId: string, text: string, author: string, now = Date.now()): Promise<number> {
  const rows = await query<{ id: number }>("INSERT INTO account_notes (account_id, at, author, text) VALUES (?, ?, ?, ?) RETURNING id", [
    accountId,
    now,
    author,
    text,
  ]);
  return n(rows[0]?.id);
}

/** Removes a note. Support staff may remove only their own; admins any. */
export async function removeNote(id: number, who: string, admin: boolean): Promise<boolean> {
  return (
    (await run(
      admin ? "DELETE FROM account_notes WHERE id = ?" : "DELETE FROM account_notes WHERE id = ? AND author = ?",
      admin ? [id] : [id, who],
    )) > 0
  );
}

/** Everything the panel shows about one install: the device, what it did (event names and times), and its subscription. */
export async function installDetail(id: string) {
  const rows = await query("SELECT * FROM installs WHERE id = ?", [id]);
  const i = rows[0];
  if (!i) return null;
  const [counts, recent, subs, ent, creator] = await Promise.all([
    query("SELECT name, COUNT(*) AS n, MAX(at) AS last FROM events WHERE install_id = ? GROUP BY name ORDER BY n DESC", [id]),
    query("SELECT name, at, app_version, props FROM events WHERE install_id = ? ORDER BY at DESC LIMIT 50", [id]),
    query(
      "SELECT at, store, kind, plan, usd_micros, reason, source FROM subscription_events WHERE install_id = ? ORDER BY at DESC LIMIT 50",
      [id],
    ),
    query("SELECT active, plan, period, store, expires_at, family, updated_at FROM entitlements WHERE app_user_id = ?", [id]),
    query("SELECT code, at FROM creator_installs WHERE install_id = ?", [id]),
  ]);
  const e = ent[0];
  return {
    install: {
      id,
      firstSeen: n(i.first_seen),
      lastSeen: n(i.last_seen),
      platform: String(i.platform),
      store: s(i.store),
      appVersion: s(i.app_version),
      firstVersion: s(i.first_version),
      device: [s(i.manufacturer), s(i.model)].filter(Boolean).join(" ") || null,
      os: [s(i.os), s(i.os_version)].filter(Boolean).join(" ") || null,
      formFactor: s(i.form_factor),
      locale: s(i.locale),
      timeZone: s(i.time_zone),
      country: [s(i.country), s(i.region)].filter(Boolean).join(" · ") || null,
      source: [s(i.source), s(i.medium), s(i.campaign)].filter(Boolean).join(" / ") || s(i.referrer) || null,
      landing: s(i.landing),
      test: n(i.test) === 1,
    },
    counts: counts.map((r) => ({ name: String(r.name), n: n(r.n), last: n(r.last) })),
    recent: recent.map((r) => ({ name: String(r.name), at: n(r.at), appVersion: s(r.app_version), props: s(r.props) })),
    subs: subs.map((r) => ({
      at: n(r.at),
      store: String(r.store),
      kind: String(r.kind),
      plan: s(r.plan),
      usd: r.usd_micros == null ? null : n(r.usd_micros) / 1e6,
      reason: s(r.reason),
      source: String(r.source),
    })),
    entitlement: e
      ? {
          active: n(e.active) === 1,
          plan: s(e.plan),
          period: s(e.period),
          store: s(e.store),
          expiresAt: e.expires_at == null ? null : n(e.expires_at),
          family: n(e.family) === 1,
          updatedAt: n(e.updated_at),
        }
      : null,
    creator: creator[0] ? { code: String(creator[0].code), at: n(creator[0].at) } : null,
  };
}
