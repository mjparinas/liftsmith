// Codes on the server (docs/decisions/marketing-and-growth.md). The app claims a code for its install
// (POST /api/creator/), the RevenueCat webhook backs that up from the subscriber attribute, and the admin
// panel's Codes tab adds codes, shows what each creator is owed and records payouts.
//
// Two kinds share one table (Melvin, 2026-11-10): a creator's code earns them commission; a promo code is our
// own, with no commission. Either can set its own trial length and RevenueCat offering (a longer trial, or a
// discount through the offering's store products), an end date and a limit on how many installs may use it.
// A third kind, lifetime (Melvin, 2026-11-11: "a coupon code … that gives the user a free lifetime pro account"),
// is redeemed by a signed-in account and gives that account Pro for good (table pro_grants); its use limit
// counts accounts, not installs.
import type { SubEvent } from "@/lib/adminMetrics";
import {
  codeKind,
  DEFAULT_OFFERING,
  DEFAULT_TRIAL_DAYS,
  normalizeCode,
  OFFERING_ID,
  type CodeInfo,
  type CodeKind,
} from "@/lib/creatorCode";
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
/** Shortest lifetime code the admin form takes, dashes not counted. */
export const LIFETIME_MIN = 10;

export type ClaimResult = { ok: true; info: CodeInfo } | { ok: false; status: 400 | 404 | 410; error: string };

type Found = { ok: true; info: CodeInfo } | { ok: false; status: 404 | 410 };

const infoOf = (r: Record<string, unknown>): CodeInfo => {
  const kind = codeKind(r.kind);
  return {
    code: String(r.code),
    kind,
    name: kind === "creator" ? String(r.name) : null,
    // A creator's code always gives a trial; a promo code without one gives what its offering gives; a lifetime
    // code gives Pro itself, so no trial.
    trialDays: kind === "lifetime" ? null : r.trial_days == null ? (kind === "creator" ? DEFAULT_TRIAL_DAYS : null) : n(r.trial_days),
    offering: typeof r.offering === "string" && OFFERING_ID.test(r.offering) ? r.offering : DEFAULT_OFFERING,
  };
};

/**
 * A code by name. 404 when there's no such code or it's paused; 410 when it has ended or every use is taken.
 * An install that already holds the code keeps it past the end date and the limit (`installId`), and the
 * store webhook (`limits: false`) always records the code a purchase was made with.
 */
export async function findCode(
  raw: unknown,
  opts: { now?: number; installId?: string; accountId?: string; limits?: boolean } = {},
): Promise<Found> {
  const code = typeof raw === "string" ? normalizeCode(raw) : null;
  if (!code) return { ok: false, status: 404 };
  const rows = await query("SELECT * FROM creators WHERE code = ? AND active = 1", [code]);
  const r = rows[0];
  if (!r) return { ok: false, status: 404 };
  if (opts.limits !== false) {
    // A lifetime code's uses are the accounts that redeemed it; every other code's are the installs that hold it.
    const lifetime = codeKind(r.kind) === "lifetime";
    const held = lifetime
      ? !!opts.accountId && (await query("SELECT 1 FROM pro_grants WHERE account_id = ? AND code = ?", [opts.accountId, code])).length > 0
      : opts.installId
        ? (await query("SELECT 1 FROM creator_installs WHERE install_id = ? AND code = ?", [opts.installId, code])).length > 0
        : false;
    if (!held) {
      if (r.ends_at != null && n(r.ends_at) <= (opts.now ?? Date.now())) return { ok: false, status: 410 };
      if (r.max_uses != null) {
        const used = await query<{ c: number }>(
          lifetime ? "SELECT COUNT(*) AS c FROM pro_grants WHERE code = ?" : "SELECT COUNT(*) AS c FROM creator_installs WHERE code = ?",
          [code],
        );
        if (n(used[0]?.c) >= n(r.max_uses)) return { ok: false, status: 410 };
      }
    }
  }
  return { ok: true, info: infoOf(r) };
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
  const found = await findCode(b.code, { now, installId: b.installId });
  if (!found.ok) return { ok: false, status: found.status, error: found.status === 410 ? "That code has ended" : "No such code" };
  const held = await query<{ code: string }>("SELECT code FROM creator_installs WHERE install_id = ?", [b.installId]);
  if (held[0] && held[0].code !== found.info.code && (await locked(b.installId))) {
    // The subscription belongs to the first code: answer with that one, whatever has happened to it since.
    const kept = await query("SELECT * FROM creators WHERE code = ?", [held[0].code]);
    return { ok: true, info: kept[0] ? infoOf(kept[0]) : { ...found.info, code: String(held[0].code), name: null } };
  }
  await run(
    `INSERT INTO creator_installs (install_id, code, at, source, platform) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(install_id) DO UPDATE SET code = excluded.code, at = excluded.at, source = excluded.source, platform = excluded.platform
     WHERE creator_installs.code <> excluded.code`,
    [b.installId, found.info.code, now, source, platform],
  );
  return { ok: true, info: found.info };
}

/** From the RevenueCat webhook: the subscriber attribute names the code, in case the app's claim never arrived. */
export async function claimFromStore(installId: string | null, raw: string | null | undefined, now = Date.now()): Promise<void> {
  if (!installId || !SAFE_ID.test(installId)) return;
  const found = await findCode(raw, { limits: false });
  if (!found.ok) return;
  await run("INSERT OR IGNORE INTO creator_installs (install_id, code, at, source, platform) VALUES (?, ?, ?, 'store', NULL)", [
    installId,
    found.info.code,
    now,
  ]);
}

// ---------- Lifetime codes ----------

export type RedeemResult = { ok: true; code: string } | { ok: false; status: 404 | 409 | 410; error: string; held?: string };

/**
 * Gives a signed-in account Pro for good with a lifetime code. 404: no such code (or paused); 409: the code is
 * live but isn't a lifetime code (the app then applies it the usual way), or the account already has Pro from
 * another lifetime code (`held`); 410: ended or every use taken. Redeeming the same code again is a no-op.
 *
 * The use limit holds under parallel redemptions: the insert counts the code's uses in the same statement, so
 * two accounts racing for the last use can't both get it.
 */
export async function redeemLifetime(accountId: string, raw: unknown, now = Date.now()): Promise<RedeemResult> {
  const found = await findCode(raw, { now, accountId });
  if (!found.ok) return { ok: false, status: found.status, error: found.status === 410 ? "That code has ended" : "No such code" };
  if (found.info.kind !== "lifetime") return { ok: false, status: 409, error: "Not a lifetime code" };
  const code = found.info.code;
  const mine = await query<{ code: string }>("SELECT code FROM pro_grants WHERE account_id = ?", [accountId]);
  if (mine[0]) return mine[0].code === code ? { ok: true, code } : { ok: false, status: 409, error: "Already Pro", held: mine[0].code };
  const r = await query<{ max_uses: number | null }>("SELECT max_uses FROM creators WHERE code = ?", [code]);
  const max = r[0]?.max_uses;
  const added = await run(
    `INSERT OR IGNORE INTO pro_grants (account_id, code, at)
     SELECT ?, ?, ? WHERE ? IS NULL OR (SELECT COUNT(*) FROM pro_grants WHERE code = ?) < ?`,
    [accountId, code, now, max ?? null, code, max ?? 0],
  );
  return added > 0 ? { ok: true, code } : { ok: false, status: 410, error: "That code has ended" };
}

/** Whether the account has Pro from a lifetime code. */
export async function hasLifetimePro(accountId: string): Promise<boolean> {
  return (await query("SELECT 1 FROM pro_grants WHERE account_id = ?", [accountId])).length > 0;
}

// ---------- Admin ----------

export interface CreatorInput {
  code: string;
  kind: CodeKind;
  name: string;
  contact: string | null;
  rate: number;
  months: number;
  active: boolean;
  note: string | null;
  trialDays: number | null;
  offering: string;
  endsAt: number | null;
  maxUses: number | null;
}

/** Checks a creator from the admin form. Rates are a share (0.3), not a percentage. */
export function checkCreator(body: unknown): { ok: true; creator: CreatorInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Not a creator" };
  const b = body as Record<string, unknown>;
  const code = normalizeCode(typeof b.code === "string" ? b.code : null);
  if (!code) return { ok: false, error: "A code is 3 to 24 letters, digits or dashes, like LIFT-ALEX." };
  const kind: CodeKind = codeKind(b.kind);
  // A lifetime code is Pro for good to whoever types it first, and the code lookup answers without an account, so
  // it must be too long to guess (security audit, 2026-11-11): 10 or more characters, about 36^10 tries.
  if (kind === "lifetime" && code.replace(/-/g, "").length < LIFETIME_MIN)
    return {
      ok: false,
      error: "A lifetime code gives Pro for good, so make it hard to guess: 10 or more letters and digits, like FRIENDS-7Q4K.",
    };
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 60) : "";
  if (!name)
    return {
      ok: false,
      error: kind === "creator" ? "Give the creator's name or handle." : "Give the code a label, like Black Friday 2026.",
    };
  // Promo and lifetime codes are ours: they never earn commission, whatever the form says.
  const rate = kind !== "creator" ? 0 : b.rate == null ? DEFAULT_RATE : Number(b.rate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.7) return { ok: false, error: "The rate is a share between 0 and 0.7 (0.3 is 30%)." };
  const months = b.months == null ? DEFAULT_MONTHS : Number(b.months);
  if (!Number.isInteger(months) || months < 1 || months > 60) return { ok: false, error: "Months is a whole number from 1 to 60." };
  const blank = (v: unknown) => v == null || v === "";
  // A lifetime code gives Pro itself, never a trial.
  const trialDays = kind === "lifetime" || blank(b.trialDays) ? (kind === "creator" ? DEFAULT_TRIAL_DAYS : null) : Number(b.trialDays);
  if (trialDays != null && (!Number.isInteger(trialDays) || trialDays < 1 || trialDays > 90))
    return { ok: false, error: "The trial is a whole number of days from 1 to 90." };
  const offering = blank(b.offering) ? DEFAULT_OFFERING : String(b.offering).trim();
  if (!OFFERING_ID.test(offering)) return { ok: false, error: "The offering is a RevenueCat offering id, like creator30." };
  const endsAt = blank(b.endsAt) ? null : typeof b.endsAt === "number" ? b.endsAt : Date.parse(String(b.endsAt));
  if (endsAt != null && !Number.isFinite(endsAt)) return { ok: false, error: "The end date should look like 2026-12-31." };
  const maxUses = blank(b.maxUses) ? null : Number(b.maxUses);
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1))
    return { ok: false, error: "The limit is a whole number of uses, 1 or more." };
  const contact = typeof b.contact === "string" && b.contact.trim() ? b.contact.trim().slice(0, 120) : null;
  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 500) : null;
  return {
    ok: true,
    creator: { code, kind, name, contact, rate, months, active: b.active !== false, note, trialDays, offering, endsAt, maxUses },
  };
}

export async function saveCreator(c: CreatorInput, now = Date.now()): Promise<void> {
  await run(
    `INSERT INTO creators (code, kind, name, contact, rate, months, active, note, trial_days, offering, ends_at, max_uses, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET kind = excluded.kind, name = excluded.name, contact = excluded.contact, rate = excluded.rate,
       months = excluded.months, active = excluded.active, note = excluded.note, trial_days = excluded.trial_days,
       offering = excluded.offering, ends_at = excluded.ends_at, max_uses = excluded.max_uses`,
    [c.code, c.kind, c.name, c.contact, c.rate, c.months, c.active ? 1 : 0, c.note, c.trialDays, c.offering, c.endsAt, c.maxUses, now],
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
  const [creators, installs, grants, subs, payouts] = await Promise.all([
    query("SELECT * FROM creators ORDER BY created_at DESC"),
    query("SELECT * FROM creator_installs WHERE install_id NOT IN (SELECT id FROM installs WHERE test = 1)"),
    query("SELECT * FROM pro_grants"),
    // Only store-verified events (the RevenueCat webhook) earn commission. The app's own trial_start and purchase
    // events reach /api/collect/ unauthenticated, so anyone could forge one for an install that carries a code.
    query(
      "SELECT * FROM subscription_events WHERE source = 'store' AND install_id IN (SELECT install_id FROM creator_installs) ORDER BY at",
    ),
    query("SELECT * FROM creator_payouts ORDER BY paid_at DESC"),
  ]);
  const lifetime = new Set(creators.filter((c) => codeKind(c.kind) === "lifetime").map((c) => String(c.code)));
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
      kind: codeKind(c.kind),
      name: String(c.name),
      contact: s(c.contact),
      rate: n(c.rate),
      months: n(c.months),
      active: n(c.active) === 1,
      note: s(c.note),
      createdAt: n(c.created_at),
      trialDays: infoOf(c).trialDays,
      offering: infoOf(c).offering,
      endsAt: c.ends_at == null ? null : n(c.ends_at),
      maxUses: c.max_uses == null ? null : n(c.max_uses),
    })),
    // A lifetime code's sign-ups are the accounts that redeemed it (its uses), not the installs that typed it.
    installs: [
      ...installs
        .filter((i) => !lifetime.has(String(i.code)))
        .map((i): CreatorInstall => ({
          installId: String(i.install_id),
          code: String(i.code),
          at: n(i.at),
          source: String(i.source),
          platform: s(i.platform),
        })),
      ...grants.map((g): CreatorInstall => ({
        installId: `account:${String(g.account_id)}`,
        code: String(g.code),
        at: n(g.at),
        source: "redeemed",
        platform: null,
      })),
    ],
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
