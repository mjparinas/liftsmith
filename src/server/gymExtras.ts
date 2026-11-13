// More on a real gym (Melvin, 2026-11-13, docs/decisions/gyms.md "Round 3"):
//   - Announcements: the owner of an official gym posts a short update (holiday hours, new racks). It shows on the
//     gym's page in the app and on the website for 60 days, and members of the gym's club get a push.
//   - Equipment problems: a lifter says a piece of the gym's equipment is broken or missing. Lifters who train there
//     get a plan that works around it, and the owner sees it with a Fixed button. Anyone can say it works again, and
//     a report runs out after 14 days.
//   - Trainers: a coach (trainer mode) says they train clients at a gym. On an official gym the owner approves them
//     first; on one nobody has claimed they show at once, and the owner can remove them once they claim it. Each
//     listing has its own join code, so "Train with me" opens the usual "Share my workouts" screen (coach.ts).
import { randomBytes } from "node:crypto";

import { EXTRA_LIMITS, isEquipment, ISSUE_KINDS, type GymIssue, type GymNews, type GymTrainer, type IssueKind } from "@/lib/gymExtras";

import { newCode, roleOf } from "./coach";
import { query, rateLimit, run } from "./db";
import { isPlaceId } from "./gymPlaces";
import { checkText } from "./moderation";
import { notifyPlain } from "./push";

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const newId = () => randomBytes(8).toString("hex");
const isId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

type Fail<E extends string> = { ok: false; error: E };

async function ownerOf(placeId: unknown): Promise<{ id: string; name: string; owner: string } | null> {
  if (!isPlaceId(placeId)) return null;
  const [p] = await query("SELECT id, name, claimed_by FROM gym_places WHERE id = ? AND hidden = 0", [placeId]);
  return p ? { id: s(p.id), name: s(p.name), owner: s(p.claimed_by) } : null;
}

// --- Announcements ---

/** The gym's announcements still showing, newest first. */
export async function newsOf(placeId: string, now = Date.now()): Promise<GymNews[]> {
  const rows = await query(
    "SELECT id, text, created_at FROM gym_news WHERE place_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?",
    [placeId, now - EXTRA_LIMITS.newsMs, EXTRA_LIMITS.newsShown],
  );
  return rows.map((r) => ({ id: s(r.id), text: s(r.text), at: n(r.created_at) }));
}

export type NewsResult = { ok: true; id: string; pushed: number } | Fail<"owner" | "slow" | "words" | "link" | "empty">;

/** The owner posts an announcement; members of the gym's club who left workout pushes on are told. */
export async function postNews(accountId: string, placeId: unknown, text: unknown, now = Date.now()): Promise<NewsResult> {
  const p = await ownerOf(placeId);
  if (!p || !p.owner || p.owner !== accountId) return { ok: false, error: "owner" };
  const c = checkText(text, EXTRA_LIMITS.news);
  if (!c.ok) return { ok: false, error: c.error };
  if (!(await rateLimit(`gyms:news:${p.id}`, EXTRA_LIMITS.newsPerDay, 86_400_000, now))) return { ok: false, error: "slow" };
  const id = newId();
  await run("INSERT INTO gym_news (id, place_id, account_id, text, created_at) VALUES (?, ?, ?, ?, ?)", [id, p.id, accountId, c.text, now]);
  // Club members opted in to the gym; the Friends switch for workouts from people they follow covers this too.
  const members = await query(
    `SELECT m.account_id AS id FROM clubs c JOIN club_members m ON m.club_id = c.id
       JOIN social_profiles sp ON sp.account_id = m.account_id
     WHERE c.place_id = ? AND m.account_id <> ? AND sp.suspended = 0 AND sp.push_posts = 1 LIMIT 1000`,
    [p.id, accountId],
  );
  await Promise.all(members.map((m) => notifyPlain(s(m.id), "gymNews", { name: p.name, text: c.text }, `#/gymplace/${p.id}`)));
  return { ok: true, id, pushed: members.length };
}

export async function deleteNews(accountId: string, placeId: unknown, id: unknown): Promise<boolean> {
  const p = await ownerOf(placeId);
  if (!p || p.owner !== accountId || !isId(id)) return false;
  return (await run("DELETE FROM gym_news WHERE id = ? AND place_id = ?", [id, p.id])) > 0;
}

// --- Equipment problems ---

/** Problems still open at a gym: not fixed and reported in the last 14 days, oldest equipment first. */
export async function issuesOf(placeId: string, now = Date.now()): Promise<GymIssue[]> {
  const rows = await query(
    `SELECT id, equipment, kind, note, created_at, reports FROM gym_issues
     WHERE place_id = ? AND fixed_at = 0 AND last_at > ? ORDER BY created_at LIMIT 50`,
    [placeId, now - EXTRA_LIMITS.issueMs],
  );
  return rows.flatMap((r) => {
    const equipment = s(r.equipment);
    if (!isEquipment(equipment)) return [];
    const kind: IssueKind = s(r.kind) === "missing" ? "missing" : "broken";
    return [{ id: s(r.id), equipment, kind, note: s(r.note), at: n(r.created_at), reports: Math.max(1, n(r.reports)) }];
  });
}

export type IssueResult = { ok: true; id: string } | Fail<"gone" | "equipment" | "slow" | "words" | "link">;

/**
 * A lifter reports a piece of equipment broken or missing. A second report of the same thing adds to the open one
 * (and keeps it from running out) instead of making another. The owner is told the first time.
 */
export async function reportIssue(who: string, b: Record<string, unknown>, now = Date.now()): Promise<IssueResult> {
  const p = await ownerOf(b.place);
  if (!p) return { ok: false, error: "gone" };
  if (!isEquipment(b.equipment)) return { ok: false, error: "equipment" };
  const kind: IssueKind = ISSUE_KINDS.find((k) => k === b.kind) ?? "broken";
  let note = "";
  if (s(b.note).trim()) {
    const c = checkText(b.note, EXTRA_LIMITS.issueNote);
    if (!c.ok) return { ok: false, error: c.error === "empty" ? "words" : c.error };
    note = c.text;
  }
  if (!(await rateLimit(`gyms:issue:${who}`, EXTRA_LIMITS.issuesPerDay, 86_400_000, now))) return { ok: false, error: "slow" };
  const [open] = await query("SELECT id FROM gym_issues WHERE place_id = ? AND equipment = ? AND fixed_at = 0 AND last_at > ?", [
    p.id,
    b.equipment,
    now - EXTRA_LIMITS.issueMs,
  ]);
  if (open) {
    await run(
      `UPDATE gym_issues SET reports = reports + 1, last_at = ?, kind = ?, note = CASE WHEN ? <> '' THEN ? ELSE note END WHERE id = ?`,
      [now, kind, note, note, s(open.id)],
    );
    return { ok: true, id: s(open.id) };
  }
  const id = newId();
  await run(
    `INSERT INTO gym_issues (id, place_id, equipment, kind, note, who, reports, created_at, last_at, fixed_at, fixed_by)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 0, '')`,
    [id, p.id, b.equipment, kind, note, who, now, now],
  );
  if (p.owner) await notifyPlain(p.owner, "gymIssue", { name: p.name }, `#/gymedit/${p.id}`);
  return { ok: true, id };
}

/** "It works again" or the owner's Fixed: the report closes for everyone. */
export async function fixIssue(who: string, placeId: unknown, id: unknown, now = Date.now()): Promise<boolean> {
  if (!isPlaceId(placeId) || !isId(id)) return false;
  return (
    (await run("UPDATE gym_issues SET fixed_at = ?, fixed_by = ? WHERE id = ? AND place_id = ? AND fixed_at = 0", [
      now,
      who,
      id,
      placeId,
    ])) > 0
  );
}

// --- Trainers ---

export interface TrainerRow extends GymTrainer {
  status: "listed" | "pending";
}

async function trainersWhere(placeId: string, statuses: string[]): Promise<TrainerRow[]> {
  const rows = await query(
    `SELECT t.account_id, t.code, t.bio, t.status, t.created_at, r.body AS profile FROM gym_trainers t
       LEFT JOIN sync_records r ON r.account_id = t.account_id AND r.key = 'profile'
     WHERE t.place_id = ? AND t.status IN (${statuses.map(() => "?").join(", ")}) ORDER BY t.created_at LIMIT ?`,
    [placeId, ...statuses, EXTRA_LIMITS.trainersShown],
  );
  return Promise.all(
    rows.map(async (r) => ({
      code: s(r.code),
      name: profileName(s(r.profile)),
      role: (await roleOf(s(r.account_id))) ?? "",
      bio: s(r.bio),
      status: s(r.status) === "pending" ? "pending" : "listed",
    })),
  );
}

function profileName(body: string): string {
  try {
    const name = (JSON.parse(body || "{}") as { name?: unknown }).name;
    return typeof name === "string" ? name.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}

/** The trainers a gym's page lists (approved, or on a gym nobody has claimed). Nameless profiles are left out. */
export async function trainersOf(placeId: string): Promise<GymTrainer[]> {
  return (await trainersWhere(placeId, ["listed"])).filter((x) => x.name).map(({ code, name, role, bio }) => ({ code, name, role, bio }));
}

export type TrainerResult = { ok: true; status: "listed" | "pending" } | Fail<"gone" | "coach" | "full" | "words" | "link" | "name">;

/** A coach says they train clients at this gym (or changes their line about themselves). */
export async function joinAsTrainer(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<TrainerResult> {
  const p = await ownerOf(b.place);
  if (!p) return { ok: false, error: "gone" };
  const [coach] = await query("SELECT account_id FROM coach_accounts WHERE account_id = ?", [accountId]);
  if (!coach) return { ok: false, error: "coach" };
  const [profile] = await query("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  if (!profileName(s(profile?.body))) return { ok: false, error: "name" };
  let bio = "";
  if (s(b.bio).trim()) {
    const c = checkText(b.bio, EXTRA_LIMITS.bio);
    if (!c.ok) return { ok: false, error: c.error === "empty" ? "words" : c.error };
    bio = c.text;
  }
  const [had] = await query("SELECT status FROM gym_trainers WHERE place_id = ? AND account_id = ?", [p.id, accountId]);
  if (had) {
    await run("UPDATE gym_trainers SET bio = ? WHERE place_id = ? AND account_id = ?", [bio, p.id, accountId]);
    return { ok: true, status: s(had.status) === "pending" ? "pending" : "listed" };
  }
  const [count] = await query("SELECT COUNT(*) AS n FROM gym_trainers WHERE account_id = ?", [accountId]);
  if (n(count?.n) >= EXTRA_LIMITS.trainerGyms) return { ok: false, error: "full" };
  // The gym's own owner listing themselves needs nobody's say-so.
  const status = p.owner && p.owner !== accountId ? "pending" : "listed";
  await run("INSERT INTO gym_trainers (place_id, account_id, code, bio, status, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    p.id,
    accountId,
    newCode(),
    bio,
    status,
    now,
  ]);
  if (status === "pending") await notifyPlain(p.owner, "gymTrainer", { name: p.name }, `#/gymedit/${p.id}`);
  return { ok: true, status };
}

export async function leaveAsTrainer(accountId: string, placeId: unknown): Promise<boolean> {
  if (!isPlaceId(placeId)) return false;
  return (await run("DELETE FROM gym_trainers WHERE place_id = ? AND account_id = ?", [placeId, accountId])) > 0;
}

export interface MyTrainerGym {
  place: string;
  name: string;
  status: "listed" | "pending";
  bio: string;
  code: string;
}

/** The gyms this coach is listed at. */
export async function myTrainerGyms(accountId: string): Promise<MyTrainerGym[]> {
  const rows = await query(
    `SELECT t.place_id, p.name, t.status, t.bio, t.code FROM gym_trainers t JOIN gym_places p ON p.id = t.place_id
     WHERE t.account_id = ? ORDER BY p.name`,
    [accountId],
  );
  return rows.map((r) => ({
    place: s(r.place_id),
    name: s(r.name),
    status: s(r.status) === "pending" ? "pending" : "listed",
    bio: s(r.bio),
    code: s(r.code),
  }));
}

/** The owner approves a trainer waiting for them, or takes one off the gym's page. */
export async function decideTrainer(accountId: string, placeId: unknown, code: unknown, approve: boolean): Promise<boolean> {
  const p = await ownerOf(placeId);
  if (!p || p.owner !== accountId || typeof code !== "string" || !/^[2-9A-HJ-NP-Z]{8}$/.test(code)) return false;
  return approve
    ? (await run("UPDATE gym_trainers SET status = 'listed' WHERE place_id = ? AND code = ?", [p.id, code])) > 0
    : (await run("DELETE FROM gym_trainers WHERE place_id = ? AND code = ?", [p.id, code])) > 0;
}

/** A gym listing's join code → the coach it belongs to (coach.ts previewInvite), when the listing shows. */
export async function trainerByCode(code: string): Promise<string | null> {
  const [r] = await query("SELECT account_id FROM gym_trainers WHERE code = ? AND status = 'listed'", [code]);
  return r ? s(r.account_id) : null;
}

// --- The owner's view ---

export interface OwnerExtras {
  news: GymNews[];
  issues: GymIssue[];
  trainers: TrainerRow[];
}

export async function ownerExtras(accountId: string, placeId: unknown, now = Date.now()): Promise<OwnerExtras | null> {
  const p = await ownerOf(placeId);
  if (!p || p.owner !== accountId) return null;
  const [news, issues, trainers] = await Promise.all([newsOf(p.id, now), issuesOf(p.id, now), trainersWhere(p.id, ["pending", "listed"])]);
  return { news, issues, trainers };
}

/** Account deletion: their announcements and trainer listings go; their problem reports stay without them. */
export const extrasDeletes = (accountId: string) => [
  { sql: "DELETE FROM gym_news WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM gym_trainers WHERE account_id = ?", args: [accountId] },
  { sql: "UPDATE gym_issues SET who = '' WHERE who = ?", args: [`acc:${accountId}`] },
  { sql: "UPDATE gym_issues SET fixed_by = '' WHERE fixed_by = ?", args: [`acc:${accountId}`] },
];
