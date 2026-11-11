// The creator program's numbers (AGENTS.md "Marketing and growth"): sign-ups, trials, paying subscribers,
// refunds and commission per creator, for the admin panel's Creators tab. Pure, so it's tested directly;
// src/server/creators.ts loads the rows.
//
// The terms: a creator earns `rate` (30%) of our net revenue (the store's price less its 15% small-business
// fee) from each subscriber who used their code, for that subscriber's first `months` (12) months, counted
// from the subscriber's first payment. Revenue counts once the store's refund window has passed (HOLD_DAYS),
// so we don't pay out on money that comes back. A refund takes its share back off what's earned.
// Payouts go out monthly once a creator is owed at least MIN_PAYOUT.
import type { SubEvent } from "./adminMetrics";
import type { CodeKind } from "./creatorCode";
import { ASSUMED } from "./forecast";

const DAY = 86_400_000;
export const STORE_FEE = ASSUMED.storeFee;
export const HOLD_DAYS = 30;
export const MIN_PAYOUT = 25;
export const DEFAULT_RATE = 0.3;
export const DEFAULT_MONTHS = 12;

const PAID = new Set(["purchase", "trial_convert", "renew"]);

export interface Creator {
  code: string;
  /** A creator's code earns commission; a promo code (our own) has a rate of 0. */
  kind: CodeKind;
  name: string;
  contact: string | null;
  rate: number;
  months: number;
  active: boolean;
  note: string | null;
  createdAt: number;
  /** The trial it gives (days), or null when its offering gives a discount instead. */
  trialDays: number | null;
  /** The RevenueCat offering the app sells from with this code. */
  offering: string;
  /** No new sign-ups after this time, or null for no end. */
  endsAt: number | null;
  /** No new sign-ups once this many installs have used it, or null for no limit. */
  maxUses: number | null;
}

export interface CreatorInstall {
  installId: string;
  code: string;
  at: number;
  source: string;
  platform: string | null;
}

export interface Payout {
  id: number;
  code: string;
  usd: number;
  paidAt: number;
  admin: string;
  note: string | null;
}

export interface CreatorRow extends Creator {
  signups: number;
  /** Sign-ups in the chosen period. */
  signupsPeriod: number;
  trials: number;
  paying: number;
  refunds: number;
  /** Store price paid by this creator's subscribers inside their commission window (USD). */
  gross: number;
  /** Commission earned so far, including revenue still inside the refund window. */
  earned: number;
  /** Commission on revenue past the refund window: what can be paid. */
  cleared: number;
  paid: number;
  /** Cleared less paid. */
  owed: number;
  /** Owed is at least MIN_PAYOUT. */
  payable: boolean;
  lastPayout: number | null;
  /** When the code was last used (an install claimed it, or an account redeemed a lifetime code), or null. */
  lastUsed: number | null;
  /** Uses left under the limit, or null for no limit. */
  usesLeft: number | null;
  /** Whether new people can use it now (codeStatus). */
  status: CodeStatus;
}

/**
 * Whether a code takes new sign-ups (Melvin, 2026-11-11: "what codes are available and their status"): paused
 * (switched off in the admin form), ended (past its end date), used up (every use taken) or live. Same order
 * as findCode in src/server/creators.ts, which answers 404 for paused and 410 for ended or used up.
 */
export type CodeStatus = "live" | "paused" | "ended" | "used-up";

export function codeStatus(c: Pick<Creator, "active" | "endsAt" | "maxUses">, uses: number, now: number): CodeStatus {
  if (!c.active) return "paused";
  if (c.endsAt != null && c.endsAt <= now) return "ended";
  if (c.maxUses != null && uses >= c.maxUses) return "used-up";
  return "live";
}

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Commission on one subscription event, before the hold: positive for payments, negative for refunds. */
export function commissionOn(e: Pick<SubEvent, "kind" | "usd">, rate: number): number {
  if (e.usd == null) return 0;
  const net = e.usd * (1 - STORE_FEE) * rate;
  if (PAID.has(e.kind)) return net;
  if (e.kind === "refund") return -net;
  return 0;
}

/** Adds `months` calendar months to a time. */
export function addMonths(t: number, months: number): number {
  const d = new Date(t);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.getTime();
}

export function creatorRows(input: {
  creators: Creator[];
  installs: CreatorInstall[];
  subs: SubEvent[];
  payouts: Payout[];
  now: number;
  since?: number;
}): CreatorRow[] {
  const { creators, installs, subs, payouts, now } = input;
  const since = input.since ?? 0;
  const codeOf = new Map(installs.map((i) => [i.installId, i.code]));
  const byInstall = new Map<string, SubEvent[]>();
  for (const e of subs) {
    if (!e.installId || !codeOf.has(e.installId)) continue;
    const list = byInstall.get(e.installId) ?? [];
    list.push(e);
    byInstall.set(e.installId, list);
  }
  const holdUntil = now - HOLD_DAYS * DAY;

  return creators.map((c): CreatorRow => {
    const mine = installs.filter((i) => i.code === c.code);
    let trials = 0;
    let paying = 0;
    let refunds = 0;
    let gross = 0;
    let earned = 0;
    let cleared = 0;
    for (const i of mine) {
      const evs = (byInstall.get(i.installId) ?? []).slice().sort((a, b) => a.at - b.at);
      if (evs.some((e) => e.kind === "trial_start")) trials++;
      const firstPaid = evs.find((e) => PAID.has(e.kind) && e.usd != null);
      if (!firstPaid) continue;
      paying++;
      const end = addMonths(firstPaid.at, c.months);
      for (const e of evs) {
        // Payments inside the window count; a refund takes back whatever it refunds, whenever it comes.
        if (PAID.has(e.kind) && (e.at < firstPaid.at || e.at >= end)) continue;
        if (e.kind === "refund") refunds++;
        const k = commissionOn(e, c.rate);
        if (!k) continue;
        if (PAID.has(e.kind)) gross += e.usd ?? 0;
        earned += k;
        if (e.kind === "refund" || e.at <= holdUntil) cleared += k;
      }
    }
    const mineOut = payouts.filter((p) => p.code === c.code);
    const paid = mineOut.reduce((t, p) => t + p.usd, 0);
    const owed = round2(cleared - paid);
    return {
      ...c,
      signups: mine.length,
      signupsPeriod: mine.filter((i) => i.at >= since).length,
      trials,
      paying,
      refunds,
      gross: round2(gross),
      earned: round2(earned),
      cleared: round2(cleared),
      paid: round2(paid),
      owed,
      payable: owed >= MIN_PAYOUT,
      lastPayout: mineOut.length ? Math.max(...mineOut.map((p) => p.paidAt)) : null,
      lastUsed: mine.length ? Math.max(...mine.map((i) => i.at)) : null,
      usesLeft: c.maxUses == null ? null : Math.max(0, c.maxUses - mine.length),
      status: codeStatus(c, mine.length, now),
    };
  });
}

const csvCell = (v: string | number) => {
  // A leading = + - or @ would run as a formula in a spreadsheet.
  const s = typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The month's payout list: every creator owed at least MIN_PAYOUT. */
export function payoutCsv(rows: CreatorRow[]): string {
  const lines = [["code", "name", "contact", "owed_usd", "paying_subscribers", "paid_to_date_usd"].join(",")];
  for (const r of rows.filter((x) => x.payable))
    lines.push([r.code, r.name, r.contact ?? "", r.owed.toFixed(2), r.paying, r.paid.toFixed(2)].map(csvCell).join(","));
  return lines.join("\n") + "\n";
}
