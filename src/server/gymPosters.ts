// Posters and table stands for gyms (docs/decisions/gyms.md, step 4). Any gym prints its own poster from its public
// poster page (gymPrint.ts); this file is the mailing queue. An order is one gym's poster, stand or both, to print from
// Admin › Gyms and mail to the gym. A claimed gym with 20+ lifters asks for a stand in the app; staff can add an order
// for any gym. Printing an unclaimed gym's order makes its claim code (gymClaims.ts), printed
// on a letter that goes in the envelope, never on the poster itself, so only whoever opens the gym's mail can claim it.
import { randomBytes } from "node:crypto";

import { isMsgLang, type MsgLang } from "@/lib/messageText";

import { query, rateLimit, run } from "./db";
import { newPosterCode } from "./gymClaims";
import { isPlaceId } from "./gymPlaces";
import { checkText } from "./moderation";

export const POSTER_ITEMS = ["both", "poster", "stand"] as const;
export type PosterItems = (typeof POSTER_ITEMS)[number];
export type PosterStatus = "requested" | "printed" | "shipped" | "cancelled";
export type PosterAction = "printed" | "shipped" | "cancel" | "reopen";

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const isOrderId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);
const DAY = 86_400_000;

export interface PosterOrder {
  id: string;
  placeId: string;
  items: PosterItems;
  shipTo: string;
  address: string;
  lang: MsgLang;
  status: PosterStatus;
  /** True when the order came from the gym in the app (else staff added it). */
  fromGym: boolean;
  createdAt: number;
  printedAt: number;
  shippedAt: number;
}

/** An order with the gym's details, for the admin queue and the print sheet. */
export interface PosterRow extends PosterOrder {
  placeName: string;
  citySlug: string;
  slug: string;
  city: string;
  region: string;
  country: string;
  official: boolean;
  qrScans: number;
}

const toOrder = (r: Record<string, unknown>): PosterOrder => ({
  id: s(r.id),
  placeId: s(r.place_id),
  items: POSTER_ITEMS.find((i) => i === r.items) ?? "both",
  shipTo: s(r.ship_to),
  address: s(r.address),
  lang: isMsgLang(r.lang) ? r.lang : "en",
  status: (["requested", "printed", "shipped", "cancelled"] as const).find((x) => x === r.status) ?? "requested",
  fromGym: !!s(r.requested_by),
  createdAt: n(r.created_at),
  printedAt: n(r.printed_at),
  shippedAt: n(r.shipped_at),
});

const toRow = (r: Record<string, unknown>): PosterRow => ({
  ...toOrder(r),
  placeName: s(r.place_name),
  citySlug: s(r.city_slug),
  slug: s(r.slug),
  city: s(r.city),
  region: s(r.region),
  country: s(r.country),
  official: !!s(r.claimed_by),
  qrScans: n(r.qr_scans),
});

export type OrderResult =
  { ok: true; order: string } | { ok: false; error: "place" | "owner" | "lifters" | "address" | "open" | "slow" | "words" | "link" };

/** Checks an order's fields: what to send, who it's for, and the gym's mailing address (lines, 300 characters). */
function readOrder(body: Record<string, unknown>) {
  const items = POSTER_ITEMS.find((i) => i === body.items) ?? "both";
  const address = s(body.address)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join("\n")
    .slice(0, 300);
  const shipTo = s(body.shipTo).trim().slice(0, 80);
  const lang: MsgLang = isMsgLang(body.lang) ? body.lang : "en";
  return { items, address, shipTo, lang };
}

async function place(id: string) {
  const [p] = await query("SELECT id, claimed_by, lifters FROM gym_places WHERE id = ? AND hidden = 0", [id]);
  return p ?? null;
}

async function insert(placeId: string, o: ReturnType<typeof readOrder>, requestedBy: string, now: number): Promise<OrderResult> {
  // One order in the works per gym: a second ask while one is waiting or printed changes nothing.
  const [open] = await query("SELECT id FROM gym_posters WHERE place_id = ? AND status IN ('requested', 'printed')", [placeId]);
  if (open) return { ok: false, error: "open" };
  const id = randomBytes(8).toString("hex");
  await run(
    `INSERT INTO gym_posters (id, place_id, items, ship_to, address, lang, status, requested_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'requested', ?, ?)`,
    [id, placeId, o.items, o.shipTo, o.address, o.lang, requestedBy, now],
  );
  return { ok: true, order: id };
}

/** A claimed gym earns a mailed stand once this many lifters have added it (Melvin, 2026-11-12, growth plan item 4). */
export const STAND_MIN_LIFTERS = 20;

/**
 * A gym's owner asks for a free table stand in the app. Every gym can print its own poster (the public poster page);
 * the stand costs real money to make and mail, so it goes only to claimed gyms with STAND_MIN_LIFTERS lifters or
 * more, and spend follows proof. Three asks per account a day.
 */
export async function requestPosters(accountId: string, body: Record<string, unknown>, now = Date.now()): Promise<OrderResult> {
  if (!isPlaceId(body.place)) return { ok: false, error: "place" };
  const p = await place(body.place);
  if (!p) return { ok: false, error: "place" };
  if (s(p.claimed_by) !== accountId) return { ok: false, error: "owner" };
  if (n(p.lifters) < STAND_MIN_LIFTERS) return { ok: false, error: "lifters" };
  const o = { ...readOrder(body), items: "stand" as const };
  if (o.address.length < 8) return { ok: false, error: "address" };
  for (const text of [o.address, o.shipTo].filter(Boolean)) {
    const c = checkText(text, 300);
    if (!c.ok) return { ok: false, error: c.error === "empty" ? "address" : c.error };
  }
  if (!(await rateLimit(`gyms:posters:${accountId}`, 3, DAY, now))) return { ok: false, error: "slow" };
  return insert(body.place, o, accountId, now);
}

/** Staff add an order for any gym (from the gym list in admin). */
export async function staffOrder(body: Record<string, unknown>, now = Date.now()): Promise<OrderResult> {
  if (!isPlaceId(body.place) || !(await place(body.place))) return { ok: false, error: "place" };
  const o = readOrder(body);
  if (o.address.length < 8) return { ok: false, error: "address" };
  return insert(body.place, o, "", now);
}

/** The latest order for a gym this account asked for or owns, for the owner's page. */
export async function latestOrder(accountId: string, placeId: unknown): Promise<PosterOrder | null> {
  if (!isPlaceId(placeId)) return null;
  const [r] = await query(
    `SELECT o.* FROM gym_posters o JOIN gym_places p ON p.id = o.place_id
     WHERE o.place_id = ? AND (o.requested_by = ? OR p.claimed_by = ?) AND o.status <> 'cancelled'
     ORDER BY o.created_at DESC LIMIT 1`,
    [placeId, accountId, accountId],
  );
  return r ? toOrder(r) : null;
}

const ROW_SQL = `SELECT o.*, p.name AS place_name, p.city_slug, p.slug, p.city, p.region, p.country, p.claimed_by, p.qr_scans
  FROM gym_posters o JOIN gym_places p ON p.id = o.place_id`;

/** The admin queue: everything to print or mail, then what shipped or was cancelled in the last 60 days. */
export async function posterQueue(now = Date.now()): Promise<PosterRow[]> {
  const rows = await query(
    `${ROW_SQL} WHERE o.status IN ('requested', 'printed') OR o.created_at > ?
     ORDER BY CASE o.status WHEN 'requested' THEN 0 WHEN 'printed' THEN 1 ELSE 2 END, o.created_at DESC LIMIT 300`,
    [now - 60 * DAY],
  );
  return rows.map(toRow);
}

/** How many orders wait to be printed and to be mailed, for the admin To Do list. */
export async function posterCounts(): Promise<{ toPrint: number; toShip: number; oldest: number | null }> {
  const [r] = await query(
    `SELECT SUM(status = 'requested') AS print, SUM(status = 'printed') AS ship, MIN(created_at) AS oldest
     FROM gym_posters WHERE status IN ('requested', 'printed')`,
  );
  return { toPrint: n(r?.print), toShip: n(r?.ship), oldest: r?.oldest == null ? null : n(r.oldest) };
}

/** Moves an order along: printed, shipped, cancelled, or back to waiting. A shipped order forgets its claim code. */
export async function actOnOrder(id: unknown, action: unknown, now = Date.now()): Promise<boolean> {
  if (!isOrderId(id)) return false;
  const sql: Record<PosterAction, [string, unknown[]]> = {
    printed: ["UPDATE gym_posters SET status = 'printed', printed_at = ? WHERE id = ? AND status = 'requested'", [now, id]],
    shipped: [
      "UPDATE gym_posters SET status = 'shipped', shipped_at = ?, claim_code = '' WHERE id = ? AND status IN ('requested', 'printed')",
      [now, id],
    ],
    cancel: ["UPDATE gym_posters SET status = 'cancelled' WHERE id = ? AND status IN ('requested', 'printed')", [id]],
    reopen: ["UPDATE gym_posters SET status = 'requested', printed_at = 0, shipped_at = 0 WHERE id = ? AND status = 'cancelled'", [id]],
  };
  const step = (Object.keys(sql) as PosterAction[]).find((a) => a === action);
  if (!step) return false;
  const [q, args] = sql[step];
  return (await run(q, args as (string | number)[])) > 0;
}

/**
 * What the print sheet needs. For an unclaimed gym, the order's claim code, made on the first print and kept until the
 * order ships, so printing again shows the same code. A claimed gym needs none.
 */
export async function printOrder(id: unknown): Promise<{ row: PosterRow; code: string | null } | null> {
  if (!isOrderId(id)) return null;
  const [r] = await query(`${ROW_SQL} WHERE o.id = ?`, [id]);
  if (!r) return null;
  const row = toRow(r);
  if (row.official || row.status === "cancelled") return { row, code: null };
  let code = s(r.claim_code);
  if (!code && row.status !== "shipped") {
    code = await newPosterCode(row.placeId);
    await run("UPDATE gym_posters SET claim_code = ? WHERE id = ?", [code, id]);
  }
  return { row, code: code || null };
}

/** A visit from a poster's QR code, counted once per address and gym a day. */
export async function countScan(placeId: string, who: string, now = Date.now()): Promise<void> {
  if (!(await rateLimit(`gyms:scan:${placeId}:${who}`, 1, DAY, now))) return;
  await run("UPDATE gym_places SET qr_scans = qr_scans + 1 WHERE id = ?", [placeId]);
}

/** Account deletion: the account's name comes off its orders (the gym's address stays for the mailing record). */
export const posterDeletes = (accountId: string) => [
  { sql: "UPDATE gym_posters SET requested_by = '', ship_to = '' WHERE requested_by = ?", args: [accountId] },
];
