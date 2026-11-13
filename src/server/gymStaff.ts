// Staff accounts for an official gym (Melvin, 2026-11-13, docs/decisions/gyms.md "Staff and the starter program").
// The owner who claimed the gym invites managers and front-desk staff with a one-time link; each joins with their own
// Liftsmith account and can then keep the gym's page up to date (details, pictures, announcements, problem reports,
// trainers, the starter program, the club and the poster). Only the owner invites or removes staff and lets the gym
// go, and letting it go (or deleting the owner's account) ends every staff place with it.
import { createHash, randomInt } from "node:crypto";

import { query, rateLimit, run } from "./db";
import { isPlaceId } from "./gymPlaces";
import { checkText } from "./moderation";

export const STAFF_LIMITS = {
  /** People besides the owner who can manage one gym. */
  perGym: 10,
  /** Invites still open for one gym. */
  openInvites: 5,
  /** How long an invite link works. */
  inviteMs: 7 * 86_400_000,
  /** Invites an owner makes per day. */
  invitesPerDay: 20,
  /** Join tries (right or wrong) per account per day. */
  joinsPerDay: 20,
  /** Gyms one account can be staff at. */
  gymsEach: 10,
};

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const isInvite = (x: unknown): x is string => typeof x === "string" && /^[2-9A-HJ-NP-Z]{10}$/.test(x);

/**
 * SQL that's true when the account (bound twice, as `?, ?`) manages gym row `p`: its owner or one of its staff. Used
 * by every owner action, so staff can do what the owner does on the gym's page.
 */
export const MANAGES = "(p.claimed_by = ? OR EXISTS (SELECT 1 FROM gym_staff st WHERE st.place_id = p.id AND st.account_id = ?))";

/** True when the account owns the gym or is on its staff (and the gym is still official). */
export async function canManage(accountId: string, placeId: unknown): Promise<boolean> {
  if (!isPlaceId(placeId) || !accountId) return false;
  const [p] = await query(`SELECT p.id FROM gym_places p WHERE p.id = ? AND p.claimed_by <> '' AND ${MANAGES}`, [
    placeId,
    accountId,
    accountId,
  ]);
  return !!p;
}

/** Everyone who manages a gym: the owner first, then staff. For telling them about a problem report or a trainer. */
export async function managersOf(placeId: string): Promise<string[]> {
  const rows = await query(
    `SELECT claimed_by AS id, 0 AS o FROM gym_places WHERE id = ? AND claimed_by <> ''
     UNION ALL SELECT account_id AS id, 1 AS o FROM gym_staff WHERE place_id = ? ORDER BY o`,
    [placeId, placeId],
  );
  return rows.map((r) => s(r.id)).filter(Boolean);
}

export interface StaffMember {
  /** A stable id for the row (never the account id): the owner removes by it. */
  id: string;
  name: string;
  at: number;
  /** True for the person looking. */
  me: boolean;
}

export interface StaffView {
  staff: StaffMember[];
  /** Open invites, only for the owner. */
  invites: { code: string; expiresAt: number }[];
}

const rowId = (placeId: string, accountId: string) =>
  // Short and one-way, so the list never hands out account ids.
  createHash("sha256").update(`staff:${placeId}:${accountId}`).digest("hex").slice(0, 12);

/** The gym's staff, for anyone who manages it; open invites only for the owner. */
export async function staffOf(accountId: string, placeId: unknown, now = Date.now()): Promise<StaffView | null> {
  if (!(await canManage(accountId, placeId))) return null;
  const id = placeId as string;
  const [rows, owner] = await Promise.all([
    query("SELECT account_id, name, created_at FROM gym_staff WHERE place_id = ? ORDER BY created_at, name", [id]),
    query("SELECT claimed_by FROM gym_places WHERE id = ?", [id]),
  ]);
  const isOwner = s(owner[0]?.claimed_by) === accountId;
  const invites = isOwner
    ? await query("SELECT code, expires_at FROM gym_staff_invites WHERE place_id = ? AND expires_at > ? ORDER BY created_at", [id, now])
    : [];
  return {
    staff: rows.map((r) => ({ id: rowId(id, s(r.account_id)), name: s(r.name), at: n(r.created_at), me: s(r.account_id) === accountId })),
    invites: invites.map((r) => ({ code: s(r.code), expiresAt: n(r.expires_at) })),
  };
}

type Fail<E extends string> = { ok: false; error: E };
export type InviteResult = { ok: true; code: string; expiresAt: number } | Fail<"owner" | "full" | "slow">;

/** The owner makes a one-time invite (`XXXXXXXXXX`), good for a week. */
export async function inviteStaff(accountId: string, placeId: unknown, now = Date.now()): Promise<InviteResult> {
  if (!isPlaceId(placeId)) return { ok: false, error: "owner" };
  const [p] = await query(
    `SELECT p.id,
       (SELECT COUNT(*) FROM gym_staff WHERE place_id = p.id) AS staff,
       (SELECT COUNT(*) FROM gym_staff_invites WHERE place_id = p.id AND expires_at > ?) AS invites
     FROM gym_places p WHERE p.id = ? AND p.claimed_by = ?`,
    [now, placeId, accountId],
  );
  if (!p) return { ok: false, error: "owner" };
  if (n(p.staff) >= STAFF_LIMITS.perGym || n(p.invites) >= STAFF_LIMITS.openInvites) return { ok: false, error: "full" };
  if (!(await rateLimit(`gyms:staffInvite:${accountId}`, STAFF_LIMITS.invitesPerDay, 86_400_000, now))) return { ok: false, error: "slow" };
  await run("DELETE FROM gym_staff_invites WHERE place_id = ? AND expires_at <= ?", [placeId, now]);
  const code = Array.from({ length: 10 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join("");
  const expiresAt = now + STAFF_LIMITS.inviteMs;
  await run("INSERT INTO gym_staff_invites (code, place_id, created_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [
    code,
    placeId,
    accountId,
    expiresAt,
    now,
  ]);
  return { ok: true, code, expiresAt };
}

/** The owner takes back an invite nobody has used. */
export async function cancelInvite(accountId: string, placeId: unknown, code: unknown): Promise<boolean> {
  if (!isPlaceId(placeId) || !isInvite(code)) return false;
  return (
    (await run(
      "DELETE FROM gym_staff_invites WHERE code = ? AND place_id = ? AND place_id IN (SELECT id FROM gym_places WHERE claimed_by = ?)",
      [code, placeId, accountId],
    )) > 0
  );
}

/** What an invite is for, so the person opening it sees the gym's name before joining. */
export async function invitePreview(code: unknown, now = Date.now()): Promise<{ place: string; name: string } | null> {
  if (!isInvite(code)) return null;
  const [r] = await query(
    `SELECT p.id, p.name FROM gym_staff_invites i JOIN gym_places p ON p.id = i.place_id
     WHERE i.code = ? AND i.expires_at > ? AND p.claimed_by <> ''`,
    [code, now],
  );
  return r ? { place: s(r.id), name: s(r.name) } : null;
}

export type JoinResult =
  { ok: true; place: string; name: string } | Fail<"gone" | "owner" | "full" | "slow" | "name" | "words" | "link" | "empty">;

/**
 * Joins a gym's staff with an invite. The invite is used up in one conditional delete, so two people racing with one
 * link can't both get in. The name is what the owner sees in the staff list.
 */
export async function joinStaff(accountId: string, code: unknown, name: unknown, now = Date.now()): Promise<JoinResult> {
  if (!isInvite(code)) return { ok: false, error: "gone" };
  if (!(await rateLimit(`gyms:staffJoin:${accountId}`, STAFF_LIMITS.joinsPerDay, 86_400_000, now))) return { ok: false, error: "slow" };
  const who = checkText(name, 60);
  if (!who.ok) return { ok: false, error: who.error === "empty" ? "name" : who.error };
  const preview = await invitePreview(code, now);
  if (!preview) return { ok: false, error: "gone" };
  const [p] = await query(
    `SELECT p.claimed_by, (SELECT COUNT(*) FROM gym_staff WHERE place_id = p.id) AS staff,
       (SELECT COUNT(*) FROM gym_staff WHERE account_id = ?) AS mine,
       (SELECT COUNT(*) FROM gym_staff WHERE place_id = p.id AND account_id = ?) AS already
     FROM gym_places p WHERE p.id = ?`,
    [accountId, accountId, preview.place],
  );
  if (!p) return { ok: false, error: "gone" };
  // The owner already manages it; someone already on the staff keeps their place (and the invite stays for another).
  if (s(p.claimed_by) === accountId || n(p.already) > 0) return { ok: false, error: "owner" };
  if (n(p.staff) >= STAFF_LIMITS.perGym || n(p.mine) >= STAFF_LIMITS.gymsEach) return { ok: false, error: "full" };
  const used = await query("DELETE FROM gym_staff_invites WHERE code = ? AND expires_at > ? RETURNING place_id", [code, now]);
  if (!used.length) return { ok: false, error: "gone" };
  await run("INSERT OR IGNORE INTO gym_staff (place_id, account_id, name, invited_by, created_at) VALUES (?, ?, ?, ?, ?)", [
    preview.place,
    accountId,
    who.text,
    s(p.claimed_by),
    now,
  ]);
  return { ok: true, ...preview };
}

/** The owner takes someone off the staff (by the list's row id), or a staff member leaves (`id` omitted). */
export async function removeStaff(accountId: string, placeId: unknown, id?: unknown): Promise<boolean> {
  if (!isPlaceId(placeId)) return false;
  if (id === undefined) return (await run("DELETE FROM gym_staff WHERE place_id = ? AND account_id = ?", [placeId, accountId])) > 0;
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND claimed_by = ?", [placeId, accountId]);
  if (!p || typeof id !== "string") return false;
  const rows = await query("SELECT account_id FROM gym_staff WHERE place_id = ?", [placeId]);
  const hit = rows.find((r) => rowId(placeId, s(r.account_id)) === id);
  if (!hit) return false;
  return (await run("DELETE FROM gym_staff WHERE place_id = ? AND account_id = ?", [placeId, s(hit.account_id)])) > 0;
}

/** When a gym stops being official (the owner lets it go, staff delete it): its staff and invites go with it. */
export const staffEnds = (placeId: string) => [
  { sql: "DELETE FROM gym_staff WHERE place_id = ?", args: [placeId] },
  { sql: "DELETE FROM gym_staff_invites WHERE place_id = ?", args: [placeId] },
];

/** Account deletion: their staff places, and the staff and invites of gyms they own (which go back to unofficial). */
export const staffDeletes = (accountId: string) => [
  { sql: "DELETE FROM gym_staff WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM gym_staff WHERE place_id IN (SELECT id FROM gym_places WHERE claimed_by = ?)", args: [accountId] },
  { sql: "DELETE FROM gym_staff_invites WHERE place_id IN (SELECT id FROM gym_places WHERE claimed_by = ?)", args: [accountId] },
];
