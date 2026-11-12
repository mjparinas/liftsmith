// Find a gym near you (Melvin, 2026-11-12, step 2 of docs/decisions/gym-sharing.md). A signed-in lifter can list
// one of their gyms so others nearby can add its setup in one tap, which is the part of setup nobody likes typing.
//
// Privacy: only a gym the lifter lists ever reaches the server, and only its share code (gymShare.ts: name, unit,
// equipment and weights, never machine settings) and a position rounded to 0.01° (about 1 km). The app rounds it
// before sending, and the server rounds again. Listings are opt-in per gym, removable any time, and gone with
// the account. Looking for gyms needs no account: the app sends a position rounded the same way, and nothing
// about the search is kept. Reports from three people hide a listing until staff decide it in the admin panel.
import { createHash, randomBytes } from "node:crypto";

import { decodeGym, encodeGym, GYM_NAME_MAX } from "@/lib/gymShare";

import { batch, query, rateLimit, run, type Row } from "./db";
import { checkText } from "./moderation";

export const LIMITS = {
  /** Gyms one account can list. */
  perAccount: 5,
  /** Listing changes per account per day. */
  perDay: 20,
  /** Searches per address per hour. */
  searchesPerHour: 60,
  /** How far a search looks, in km. */
  radiusKm: 15,
  /** Gyms one search returns. */
  results: 20,
  /** Reports that hide a listing until it's reviewed. */
  hideAfter: 3,
};
export const REPORT_REASONS = ["wrong", "private", "spam", "offensive"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** A position rounded to 0.01° (about 1.1 km north to south), the only precision the server ever keeps. */
export const cell = (x: number) => Math.round(x * 100) / 100;

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const validLat = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= -90 && x <= 90;
const validLon = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= -180 && x <= 180;
const isLocalId = (x: unknown): x is string => typeof x === "string" && /^[\w-]{1,64}$/.test(x);
export const isId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** A one-way key for an address, so reports from signed-out lifters can be counted without keeping the address. */
export const addressKey = (ip: string) => `ip:${createHash("sha256").update(`gyms:${ip}`).digest("hex").slice(0, 24)}`;

export interface Listing {
  id: string;
  name: string;
  code: string;
  unit: "kg" | "lb";
  /** Rounded to 0.5 km, so the answer can't place a gym more precisely than its cell. */
  km: number;
  /** How many lifters added it from the list. */
  adds: number;
}

export interface Mine {
  id: string;
  localId: string;
  name: string;
  hidden: boolean;
}

export type PublishResult =
  { ok: true; id: string } | { ok: false; error: "code" | "place" | "empty" | "link" | "words" | "full" | "slow" };

/** Lists a gym, or updates the listing of the same gym (`localId`, the gym's id on the lifter's device). */
export async function publish(accountId: string, body: Record<string, unknown>, now = Date.now()): Promise<PublishResult> {
  const kit = typeof body.code === "string" && body.code.length <= 20_000 ? decodeGym(body.code) : null;
  if (!kit || !isLocalId(body.localId)) return { ok: false, error: "code" };
  if (!validLat(body.lat) || !validLon(body.lon)) return { ok: false, error: "place" };
  const name = checkText(body.name ?? kit.name, GYM_NAME_MAX);
  if (!name.ok) return { ok: false, error: name.error };
  const [had] = await query("SELECT id FROM public_gyms WHERE account_id = ? AND local_id = ?", [accountId, body.localId]);
  if (!had) {
    const [c] = await query("SELECT COUNT(*) AS n FROM public_gyms WHERE account_id = ?", [accountId]);
    if (n(c?.n) >= LIMITS.perAccount) return { ok: false, error: "full" };
  }
  if (!(await rateLimit(`gyms:publish:${accountId}`, LIMITS.perDay, 86_400_000, now))) return { ok: false, error: "slow" };
  // Stored as the server reads it, so anything it dropped from the code never goes out to others.
  const code = encodeGym({ ...kit, name: name.text });
  const lat = cell(body.lat);
  const lon = cell(body.lon);
  if (had) {
    await run("UPDATE public_gyms SET name = ?, code = ?, unit = ?, lat = ?, lon = ?, updated_at = ? WHERE id = ?", [
      name.text,
      code,
      kit.unit,
      lat,
      lon,
      now,
      s(had.id),
    ]);
    return { ok: true, id: s(had.id) };
  }
  const id = randomBytes(8).toString("hex");
  await run(
    `INSERT INTO public_gyms (id, account_id, local_id, name, code, unit, lat, lon, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, accountId, body.localId, name.text, code, kit.unit, lat, lon, now, now],
  );
  return { ok: true, id };
}

export async function unpublish(accountId: string, localId: unknown): Promise<void> {
  if (!isLocalId(localId)) return;
  const rows = await query("SELECT id FROM public_gyms WHERE account_id = ? AND local_id = ?", [accountId, localId]);
  for (const r of rows)
    await batch([
      { sql: "DELETE FROM gym_reports WHERE gym_id = ?", args: [s(r.id)] },
      { sql: "DELETE FROM public_gyms WHERE id = ?", args: [s(r.id)] },
    ]);
}

export async function mine(accountId: string): Promise<Mine[]> {
  const rows = await query("SELECT id, local_id, name, hidden FROM public_gyms WHERE account_id = ? ORDER BY created_at", [accountId]);
  return rows.map((r) => ({ id: s(r.id), localId: s(r.local_id), name: s(r.name), hidden: !!n(r.hidden) }));
}

/** Gyms listed within `LIMITS.radiusKm` of a position, nearest first. */
export async function nearby(lat: unknown, lon: unknown): Promise<Listing[] | null> {
  if (!validLat(lat) || !validLon(lon)) return null;
  const here = { lat: cell(lat), lon: cell(lon) };
  const dLat = LIMITS.radiusKm / 111;
  const dLon = LIMITS.radiusKm / (111 * Math.max(0.05, Math.cos((here.lat * Math.PI) / 180)));
  const rows = await query(
    `SELECT id, name, code, unit, lat, lon, adds FROM public_gyms
     WHERE hidden = 0 AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ? LIMIT 500`,
    [here.lat - dLat, here.lat + dLat, here.lon - dLon, here.lon + dLon],
  );
  return rows
    .map((r: Row) => ({ r, km: distanceKm(here, { lat: n(r.lat), lon: n(r.lon) }) }))
    .filter((x) => x.km <= LIMITS.radiusKm)
    .sort((a, b) => a.km - b.km || n(b.r.adds) - n(a.r.adds))
    .slice(0, LIMITS.results)
    .map(({ r, km }) => ({
      id: s(r.id),
      name: s(r.name),
      code: s(r.code),
      unit: s(r.unit) === "lb" ? "lb" : "kg",
      km: Math.round(km * 2) / 2,
      adds: n(r.adds),
    }));
}

/** Someone added a listed gym: counted once per lifter (account or address) per gym. */
export async function added(who: string, id: unknown, now = Date.now()): Promise<void> {
  if (!isId(id)) return;
  if (!(await rateLimit(`gyms:add:${who}:${id}`, 1, 365 * 86_400_000, now))) return;
  await run("UPDATE public_gyms SET adds = adds + 1 WHERE id = ?", [id]);
}

/** A report on a listing. Three different people hide it until staff decide. */
export async function report(who: string, id: unknown, reason: unknown, now = Date.now()): Promise<boolean> {
  const why = REPORT_REASONS.find((r) => r === reason);
  if (!isId(id) || !why) return false;
  const [g] = await query("SELECT id FROM public_gyms WHERE id = ?", [id]);
  if (!g) return false;
  await run("INSERT OR IGNORE INTO gym_reports (reporter, gym_id, reason, created_at, status) VALUES (?, ?, ?, ?, 'open')", [
    who,
    id,
    why,
    now,
  ]);
  const [c] = await query("SELECT COUNT(*) AS n FROM gym_reports WHERE gym_id = ? AND status = 'open'", [id]);
  if (n(c?.n) >= LIMITS.hideAfter) await run("UPDATE public_gyms SET hidden = 1 WHERE id = ?", [id]);
  return true;
}

// --- Staff: the gym list on the admin Reports tab ---

export interface ReportedGym {
  id: string;
  name: string;
  accountId: string;
  reports: number;
  reasons: Record<string, number>;
  hidden: boolean;
  adds: number;
  lastAt: number;
  /** What the listing carries, so staff can see it's a real gym setup. */
  equipment: number;
}

export async function reportedGyms(): Promise<ReportedGym[]> {
  const rows = await query(
    `SELECT g.id, g.name, g.account_id, g.hidden, g.adds, g.code, COUNT(r.reporter) AS n, MAX(r.created_at) AS last_at,
       GROUP_CONCAT(r.reason) AS reasons
     FROM public_gyms g JOIN gym_reports r ON r.gym_id = g.id AND r.status = 'open'
     GROUP BY g.id ORDER BY n DESC, last_at DESC LIMIT 200`,
  );
  return rows.map((r) => {
    const reasons: Record<string, number> = {};
    for (const x of s(r.reasons).split(",").filter(Boolean)) reasons[x] = (reasons[x] ?? 0) + 1;
    return {
      id: s(r.id),
      name: s(r.name),
      accountId: s(r.account_id),
      reports: n(r.n),
      reasons,
      hidden: !!n(r.hidden),
      adds: n(r.adds),
      lastAt: n(r.last_at),
      equipment: decodeGym(s(r.code))?.equipment.length ?? 0,
    };
  });
}

export type GymAction = "remove" | "dismiss";

/** `remove` deletes the listing; `dismiss` closes its reports and shows it again. */
export async function resolveGym(id: unknown, action: unknown): Promise<boolean> {
  if (!isId(id)) return false;
  if (action === "remove") {
    await batch([
      { sql: "DELETE FROM gym_reports WHERE gym_id = ?", args: [id] },
      { sql: "DELETE FROM public_gyms WHERE id = ?", args: [id] },
    ]);
    return true;
  }
  if (action === "dismiss") {
    await batch([
      { sql: "UPDATE gym_reports SET status = 'dismissed' WHERE gym_id = ? AND status = 'open'", args: [id] },
      { sql: "UPDATE public_gyms SET hidden = 0 WHERE id = ?", args: [id] },
    ]);
    return true;
  }
  return false;
}

export async function openGymReportCount(): Promise<number> {
  const [r] = await query("SELECT COUNT(DISTINCT gym_id) AS n FROM gym_reports WHERE status = 'open'");
  return n(r?.n);
}

/** Account deletion: the lifter's listings and the reports on them go with it. */
export const gymDeletes = (accountId: string) => [
  { sql: "DELETE FROM gym_reports WHERE gym_id IN (SELECT id FROM public_gyms WHERE account_id = ?)", args: [accountId] },
  { sql: "DELETE FROM public_gyms WHERE account_id = ?", args: [accountId] },
];
