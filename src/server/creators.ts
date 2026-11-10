// The creator program on the server (AGENTS.md "Marketing and growth"). The app claims a code for its
// install (POST /api/creator/), the RevenueCat webhook backs that up from the subscriber attribute, and the
// admin panel's Creators tab adds creators, shows what each is owed and records payouts.
import type { SubEvent } from "@/lib/adminMetrics";
import { normalizeCode } from "@/lib/creatorCode";
import {
  creatorRows,
  DEFAULT_MONTHS,
  DEFAULT_RATE,
  type Creator,
  type CreatorInstall,
  type CreatorRow,
  type Payout,
} from "@/lib/creatorMetrics";

import { query, run } from "./db";

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? null : String(v));
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const SOURCES = new Set(["link", "referrer", "typed", "store"]);

export type ClaimResult = { ok: true; code: string; name: string } | { ok: false; status: 400 | 404; error: string };

/** A live creator by code, or null. */
export async function findCreator(raw: unknown): Promise<{ code: string; name: string } | null> {
  const code = typeof raw === "string" ? normalizeCode(raw) : null;
  if (!code) return null;
  const rows = await query<{ code: string; name: string }>("SELECT code, name FROM creators WHERE code = ? AND active = 1", [code]);
  return rows[0] ? { code: String(rows[0].code), name: String(rows[0].name) } : null;
}

/** Whether this install has started a trial or bought: its code is fixed from then on. */
async function locked(installId: string): Promise<boolean> {
  const rows = await query("SELECT 1 FROM subscription_events WHERE install_id = ? LIMIT 1", [installId]);
  return rows.length > 0;
}

/**
 * Records the code an install came with. A new code replaces the old one until the install has a trial or a
 * subscription; after that the first code stays, and the answer says which one (the app shows it).
 */
export async function claimCode(body: unknown, now = Date.now()): Promise<ClaimResult> {
  if (!body || typeof body !== "object") return { ok: false, status: 400, error: "Not a claim" };
  const b = body as Record<string, unknown>;
  if (typeof b.installId !== "string" || !SAFE_ID.test(b.installId)) return { ok: false, status: 400, error: "Bad install id" };
  const source = typeof b.source === "string" && SOURCES.has(b.source) ? b.source : "typed";
  const platform = typeof b.platform === "string" ? b.platform.slice(0, 16) : null;
  const creator = await findCreator(b.code);
  if (!creator) return { ok: false, status: 404, error: "No such code" };
  const held = await query<{ code: string }>("SELECT code FROM creator_installs WHERE install_id = ?", [b.installId]);
  if (held[0] && held[0].code !== creator.code && (await locked(b.installId))) {
    const kept = await findCreator(held[0].code);
    return { ok: true, code: String(held[0].code), name: kept?.name ?? String(held[0].code) };
  }
  await run(
    `INSERT INTO creator_installs (install_id, code, at, source, platform) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(install_id) DO UPDATE SET code = excluded.code, at = excluded.at, source = excluded.source, platform = excluded.platform
     WHERE creator_installs.code <> excluded.code`,
    [b.installId, creator.code, now, source, platform],
  );
  return { ok: true, ...creator };
}

/** From the RevenueCat webhook: the subscriber attribute names the code, in case the app's claim never arrived. */
export async function claimFromStore(installId: string | null, raw: string | null | undefined, now = Date.now()): Promise<void> {
  if (!installId || !SAFE_ID.test(installId)) return;
  const creator = await findCreator(raw);
  if (!creator) return;
  await run("INSERT OR IGNORE INTO creator_installs (install_id, code, at, source, platform) VALUES (?, ?, ?, 'store', NULL)", [
    installId,
    creator.code,
    now,
  ]);
}

// ---------- Admin ----------

export interface CreatorInput {
  code: string;
  name: string;
  contact: string | null;
  rate: number;
  months: number;
  active: boolean;
  note: string | null;
}

/** Checks a creator from the admin form. Rates are a share (0.3), not a percentage. */
export function checkCreator(body: unknown): { ok: true; creator: CreatorInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Not a creator" };
  const b = body as Record<string, unknown>;
  const code = normalizeCode(typeof b.code === "string" ? b.code : null);
  if (!code) return { ok: false, error: "A code is 3 to 24 letters, digits or dashes, like LIFT-ALEX." };
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 60) : "";
  if (!name) return { ok: false, error: "Give the creator's name or handle." };
  const rate = b.rate == null ? DEFAULT_RATE : Number(b.rate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.7) return { ok: false, error: "The rate is a share between 0 and 0.7 (0.3 is 30%)." };
  const months = b.months == null ? DEFAULT_MONTHS : Number(b.months);
  if (!Number.isInteger(months) || months < 1 || months > 60) return { ok: false, error: "Months is a whole number from 1 to 60." };
  const contact = typeof b.contact === "string" && b.contact.trim() ? b.contact.trim().slice(0, 120) : null;
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 500) : null;
  return { ok: true, creator: { code, name, contact, rate, months, active: b.active !== false, note } };
}

export async function saveCreator(c: CreatorInput, now = Date.now()): Promise<void> {
  await run(
    `INSERT INTO creators (code, name, contact, rate, months, active, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET name = excluded.name, contact = excluded.contact, rate = excluded.rate, months = excluded.months, active = excluded.active, note = excluded.note`,
    [c.code, c.name, c.contact, c.rate, c.months, c.active ? 1 : 0, c.note, now],
  );
}

export async function recordPayout(code: string, usd: number, admin: string, note: string | null, now = Date.now()): Promise<boolean> {
  if (!(await query("SELECT 1 FROM creators WHERE code = ?", [code])).length) return false;
  await run("INSERT INTO creator_payouts (code, usd_micros, paid_at, admin, note) VALUES (?, ?, ?, ?, ?)", [
    code,
    Math.round(usd * 1e6),
    now,
    admin,
    note,
  ]);
  return true;
}

export async function loadCreators(now = Date.now(), since = 0): Promise<{ rows: CreatorRow[]; payouts: Payout[] }> {
  const [creators, installs, subs, payouts] = await Promise.all([
    query("SELECT * FROM creators ORDER BY created_at DESC"),
    query("SELECT * FROM creator_installs WHERE install_id NOT IN (SELECT id FROM installs WHERE test = 1)"),
    // Only store-verified events (the RevenueCat webhook) earn commission. The app's own trial_start and purchase
    // events reach /api/collect/ unauthenticated, so anyone could forge one for an install that carries a code.
    query(
      "SELECT * FROM subscription_events WHERE source = 'store' AND install_id IN (SELECT install_id FROM creator_installs) ORDER BY at",
    ),
    query("SELECT * FROM creator_payouts ORDER BY paid_at DESC"),
  ]);
  const payoutList = payouts.map((p): Payout => ({
    id: n(p.id),
    code: String(p.code),
    usd: n(p.usd_micros) / 1e6,
    paidAt: n(p.paid_at),
    admin: String(p.admin),
    note: s(p.note),
  }));
  const rows = creatorRows({
    now,
    since,
    creators: creators.map((c): Creator => ({
      code: String(c.code),
      name: String(c.name),
      contact: s(c.contact),
      rate: n(c.rate),
      months: n(c.months),
      active: n(c.active) === 1,
      note: s(c.note),
      createdAt: n(c.created_at),
    })),
    installs: installs.map((i): CreatorInstall => ({
      installId: String(i.install_id),
      code: String(i.code),
      at: n(i.at),
      source: String(i.source),
      platform: s(i.platform),
    })),
    subs: subs.map((e): SubEvent => ({
      id: String(e.id),
      at: n(e.at),
      installId: s(e.install_id),
      subscription: s(e.subscription),
      store: String(e.store),
      kind: String(e.kind),
      plan: s(e.plan),
      usd: e.usd_micros == null ? null : n(e.usd_micros) / 1e6,
      priceLocal: e.price_micros == null ? null : n(e.price_micros) / 1e6,
      currency: s(e.currency),
      reason: s(e.reason),
    })),
    payouts: payoutList,
  });
  return { rows, payouts: payoutList };
}
