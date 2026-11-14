// Moderating Friends from the admin panel's Users tab (Melvin, 2026-11-14: "on the admin i should be able to view
// users, see their reports (how many and by whom), and either ban, shadow ban, unban, and other possibilities").
// Decision record: docs/decisions/moderation.md.
//
// A lifter's standing lives on their Friends profile (`social_profiles`):
//   suspended 0  fine
//   suspended 1  suspended (until `suspended_until`) or banned (`suspended_until` 0): hidden from everyone, can't
//                post, comment, follow or cheer, and told why in the Friends tab
//   suspended 2  shadow banned: carries on as usual and sees their own posts and comments, but nobody else sees
//                anything they do, no push goes out from them, and they're never told
// plus `boards_off` (off other people's leaderboards, for fake lifts) and `notice` (a warning, suspension or ban
// the lifter is told about). Only Friends is moderated: a lifter's own training, sync and account stay theirs.
import { createHash, randomBytes } from "node:crypto";

import { REPORT_REASONS, type ModerationNotice, type ReportKind, type ReportReason } from "@/lib/socialTypes";

import { batch, query, run, type Row } from "./db";
import { isMinor } from "./teams";

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? "" : String(v));
const DAY = 86_400_000;

export type ModState = "ok" | "suspended" | "banned" | "shadow";
/** Suspensions staff can pick, in days. */
export const SUSPEND_DAYS = [1, 3, 7, 30] as const;

export type ModAction =
  | { action: "warn"; reason: string }
  | { action: "suspend"; days: number; reason: string }
  | { action: "ban"; reason: string }
  | { action: "shadow" }
  | { action: "unban" }
  | { action: "boardsOff" }
  | { action: "boardsOn" }
  | { action: "resetName" }
  | { action: "resetHandle" }
  | { action: "dismiss" };

export const MOD_ACTIONS = [
  "warn",
  "suspend",
  "ban",
  "shadow",
  "unban",
  "boardsOff",
  "boardsOn",
  "resetName",
  "resetHandle",
  "dismiss",
] as const satisfies readonly ModAction["action"][];

const reasonOf = (v: unknown): ReportReason | "" => REPORT_REASONS.find((r) => r === v) ?? "";

export function stateOf(p: { suspended?: unknown; suspended_until?: unknown }): ModState {
  const v = n(p.suspended);
  return v === 2 ? "shadow" : v === 1 ? (n(p.suspended_until) > 0 ? "suspended" : "banned") : "ok";
}

/** What the lifter is told, or null. A shadow ban is never told. */
export function noticeOf(p: {
  notice?: unknown;
  notice_reason?: unknown;
  notice_at?: unknown;
  suspended_until?: unknown;
}): ModerationNotice | null {
  const kind = s(p.notice);
  if (kind !== "warn" && kind !== "suspend" && kind !== "ban") return null;
  return {
    kind,
    reason: reasonOf(p.notice_reason),
    at: n(p.notice_at),
    until: kind === "suspend" && n(p.suspended_until) > 0 ? n(p.suspended_until) : null,
  };
}

const lifted = { suspended: 0, suspended_until: 0, notice: "", notice_reason: "", notice_at: 0 };

/** A profile row with a suspension that has run out lifted (in the database too). Anything else comes back as it was. */
export async function liftIfOver<T extends { account_id: string; suspended: number; suspended_until?: number }>(
  p: T,
  now = Date.now(),
): Promise<T> {
  const until = n(p.suspended_until);
  if (n(p.suspended) !== 1 || until <= 0 || until > now) return p;
  await run(
    "UPDATE social_profiles SET suspended = 0, suspended_until = 0, notice = '', notice_reason = '', notice_at = 0 WHERE account_id = ? AND suspended = 1 AND suspended_until = ?",
    [p.account_id, until],
  );
  return { ...p, ...lifted };
}

/** Lifts every suspension that has run out (the daily admin job), so others see the lifter again even if they haven't opened the app. */
export async function liftExpired(now = Date.now()): Promise<number> {
  return run(
    "UPDATE social_profiles SET suspended = 0, suspended_until = 0, notice = '', notice_reason = '', notice_at = 0 WHERE suspended = 1 AND suspended_until > 0 AND suspended_until <= ?",
    [now],
  );
}

const emailHash = (email: string) => createHash("sha256").update(`liftsmith-ban:${email.trim().toLowerCase()}`).digest("hex");

async function emailsOf(accountId: string): Promise<string[]> {
  const rows = await query(
    "SELECT email FROM accounts WHERE id = ?1 AND email IS NOT NULL UNION SELECT email FROM account_identities WHERE account_id = ?1 AND email IS NOT NULL",
    [accountId],
  );
  return [...new Set(rows.map((r) => s(r.email).trim().toLowerCase()).filter(Boolean))];
}

/** Whether any of the account's email addresses belongs to someone banned from Friends before. */
export async function emailBanned(accountId: string): Promise<boolean> {
  const hashes = (await emailsOf(accountId)).map(emailHash);
  if (!hashes.length) return false;
  const [r] = await query(`SELECT 1 AS x FROM social_bans WHERE email_hash IN (${hashes.map(() => "?").join(",")}) LIMIT 1`, hashes);
  return !!r;
}

/** Statements that close the open reports on a lifter: their profile, posts and comments. */
const closeReports = (accountId: string, status: string) => [
  {
    sql: `UPDATE reports SET status = ? WHERE status = 'open' AND (
      (kind = 'profile' AND target_id = ?2)
      OR (kind = 'post' AND target_id IN (SELECT id FROM posts WHERE account_id = ?2))
      OR (kind = 'comment' AND target_id IN (SELECT id FROM post_comments WHERE account_id = ?2)))`,
    args: [status, accountId],
  },
];

/** A handle nobody has: lifter_ and six letters or digits. */
async function freshHandle(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const h = `lifter_${randomBytes(6)
      .toString("base64url")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 6)
      .padEnd(6, "0")}`;
    const [taken] = await query("SELECT 1 AS x FROM social_profiles WHERE handle = ?", [h]);
    if (!taken) return h;
  }
  return `lifter_${Date.now().toString(36)}`;
}

/**
 * Does what staff picked. False when the lifter has no Friends profile (nothing to moderate) or the action is unknown.
 * Every call is put in the audit log by the route, with who did it.
 */
export async function moderate(accountId: string, a: ModAction, now = Date.now()): Promise<boolean> {
  const [p] = await query("SELECT handle, name, suspended FROM social_profiles WHERE account_id = ?", [accountId]);
  if (!p) return false;
  const set = (sql: string, args: (string | number)[] = []) => ({
    sql: `UPDATE social_profiles SET ${sql} WHERE account_id = ?`,
    args: [...args, accountId],
  });
  const tell = (kind: string, reason: string) => set("notice = ?, notice_reason = ?, notice_at = ?", [kind, reasonOf(reason), now]);
  switch (a.action) {
    case "warn":
      await batch([tell("warn", a.reason)]);
      return true;
    case "suspend": {
      const days = SUSPEND_DAYS.find((d) => d === Number(a.days));
      if (!days) return false;
      await batch([
        set("suspended = 1, suspended_until = ?", [now + days * DAY]),
        tell("suspend", a.reason),
        { sql: "DELETE FROM live_sessions WHERE account_id = ?", args: [accountId] },
      ]);
      return true;
    }
    case "ban": {
      const hashes = (await emailsOf(accountId)).map(emailHash);
      await batch([
        set("suspended = 1, suspended_until = 0"),
        tell("ban", a.reason),
        { sql: "DELETE FROM live_sessions WHERE account_id = ?", args: [accountId] },
        ...hashes.map((h) => ({ sql: "INSERT OR IGNORE INTO social_bans (email_hash, at) VALUES (?, ?)", args: [h, now] })),
      ]);
      return true;
    }
    case "shadow":
      // Nothing is said, and a warning or suspension notice still showing is cleared so nothing hints at it.
      await batch([
        set("suspended = 2, suspended_until = 0, notice = '', notice_reason = '', notice_at = 0"),
        { sql: "DELETE FROM live_sessions WHERE account_id = ?", args: [accountId] },
      ]);
      return true;
    case "unban": {
      const hashes = (await emailsOf(accountId)).map(emailHash);
      await batch([
        set("suspended = 0, suspended_until = 0, notice = '', notice_reason = '', notice_at = 0"),
        ...hashes.map((h) => ({ sql: "DELETE FROM social_bans WHERE email_hash = ?", args: [h] })),
      ]);
      return true;
    }
    case "boardsOff":
    case "boardsOn":
      await batch([set("boards_off = ?", [a.action === "boardsOff" ? 1 : 0])]);
      return true;
    case "resetName":
      await batch([set("name = handle")]);
      return true;
    case "resetHandle": {
      const h = await freshHandle();
      // A name that was just the old handle follows it, so the old handle doesn't stay on show.
      await batch([set("name = CASE WHEN name = handle THEN ? ELSE name END, handle = ?", [h, h])]);
      return true;
    }
    case "dismiss":
      await batch([
        ...closeReports(accountId, "dismissed"),
        // Posts and comments hidden by reports show again, the same as Dismiss on the Reports tab.
        { sql: "UPDATE posts SET hidden = 0 WHERE account_id = ? AND hidden = 1", args: [accountId] },
        { sql: "UPDATE post_comments SET hidden = 0 WHERE account_id = ? AND hidden = 1", args: [accountId] },
      ]);
      return true;
    default:
      return false;
  }
}

/** Reads an action from the admin route's body, or null when it's incomplete. */
export function parseAction(b: Record<string, unknown>): ModAction | null {
  const action = MOD_ACTIONS.find((x) => x === b.what);
  const reason = s(b.reason);
  switch (action) {
    case "warn":
    case "ban":
      return { action, reason };
    case "suspend":
      return SUSPEND_DAYS.some((d) => d === Number(b.days)) ? { action, days: Number(b.days), reason } : null;
    case undefined:
      return null;
    default:
      return { action };
  }
}

// --- What the Users tab shows ---

export interface ReportLine {
  id: number;
  at: number;
  kind: ReportKind;
  reason: string;
  note: string;
  status: string;
  /** What was reported: the comment, the post's exercises, or "Profile". */
  content: string;
  reporter: { accountId: string; handle: string; email: string | null; minor: boolean } | null;
}

export interface ModerationDetail {
  profile: { handle: string; name: string; public: boolean; joinedAt: number } | null;
  state: ModState;
  until: number | null;
  boardsOff: boolean;
  notice: ModerationNotice | null;
  /** Under 18 (school teams or the birth year in their settings): teen-safe defaults apply. */
  minor: boolean;
  /** Their email is on the ban list (it stays there after the account is deleted, until an Unban). */
  emailBanned: boolean;
  counts: { open: number; total: number; reporters: number };
  /** Reports about this lifter: their profile, posts and comments, newest first. */
  reports: ReportLine[];
  /** Reports this lifter made, and how many staff dismissed, which can show someone reporting in bad faith. */
  made: { total: number; dismissed: number };
  history: { at: number; admin: string; action: string; detail: string | null }[];
}

const AGAINST = `SELECT r.id, r.created_at, r.kind, r.target_id, r.reason, r.note, r.status, r.reporter_id,
    rp.handle AS reporter_handle, ra.email AS reporter_email,
    CASE r.kind WHEN 'post' THEN p.body WHEN 'comment' THEN c.body ELSE '' END AS content
  FROM reports r
  LEFT JOIN posts p ON r.kind = 'post' AND p.id = r.target_id
  LEFT JOIN post_comments c ON r.kind = 'comment' AND c.id = r.target_id
  LEFT JOIN social_profiles rp ON rp.account_id = r.reporter_id
  LEFT JOIN accounts ra ON ra.id = r.reporter_id
  WHERE (r.kind = 'profile' AND r.target_id = ?1) OR p.account_id = ?1 OR c.account_id = ?1`;

function contentOf(kind: string, raw: unknown): string {
  if (kind === "profile") return "Profile";
  if (kind === "comment") return s(raw) || "(deleted)";
  try {
    const body = JSON.parse(s(raw)) as { exercises?: { name?: string; id?: string }[] };
    return `Workout: ${(body.exercises ?? []).map((e) => e.name || e.id).join(", ")}`;
  } catch {
    return "(deleted)";
  }
}

export async function moderationFor(accountId: string, now = Date.now()): Promise<ModerationDetail> {
  const [[row], reports, [made], history, minor, banned] = await Promise.all([
    query("SELECT * FROM social_profiles WHERE account_id = ?", [accountId]),
    query(`${AGAINST} ORDER BY r.created_at DESC LIMIT 200`, [accountId]),
    query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed FROM reports WHERE reporter_id = ?",
      [accountId],
    ),
    query(
      `SELECT at, admin, action, detail FROM admin_audit WHERE (target = ?1 OR target = 'profile:' || ?1)
         AND (action LIKE 'mod.%' OR action LIKE 'report.%') ORDER BY at DESC LIMIT 50`,
      [accountId],
    ),
    isMinor(accountId, now),
    emailBanned(accountId),
  ]);
  const p = row as Row | undefined;
  // Under 18 reporters are marked, so a report from a teen is easy to spot (and read with care).
  const reporterIds = [...new Set(reports.map((r) => s(r.reporter_id)))].slice(0, 50);
  const minors = new Set<string>();
  await Promise.all(reporterIds.map(async (id) => (await isMinor(id, now)) && minors.add(id)));
  const lines: ReportLine[] = reports.map((r) => ({
    id: n(r.id),
    at: n(r.created_at),
    kind: s(r.kind) as ReportKind,
    reason: s(r.reason),
    note: s(r.note),
    status: s(r.status),
    content: contentOf(s(r.kind), r.content),
    reporter: r.reporter_id
      ? {
          accountId: s(r.reporter_id),
          handle: s(r.reporter_handle),
          email: r.reporter_email == null ? null : s(r.reporter_email),
          minor: minors.has(s(r.reporter_id)),
        }
      : null,
  }));
  const state = p ? stateOf(p) : "ok";
  return {
    profile: p ? { handle: s(p.handle), name: s(p.name), public: !!n(p.public), joinedAt: n(p.created_at) } : null,
    state,
    until: state === "suspended" ? n(p?.suspended_until) : null,
    boardsOff: !!n(p?.boards_off),
    notice: p ? noticeOf(p) : null,
    minor,
    emailBanned: banned,
    counts: {
      open: lines.filter((l) => l.status === "open").length,
      total: lines.length,
      reporters: new Set(lines.map((l) => l.reporter?.accountId ?? "")).size,
    },
    reports: lines,
    made: { total: n(made?.total), dismissed: n(made?.dismissed) },
    history: history.map((h) => ({ at: n(h.at), admin: s(h.admin), action: s(h.action), detail: h.detail == null ? null : s(h.detail) })),
  };
}
