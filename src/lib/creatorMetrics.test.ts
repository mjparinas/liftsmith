import { describe, expect, it } from "vitest";

import type { SubEvent } from "./adminMetrics";
import { addMonths, commissionOn, creatorRows, HOLD_DAYS, payoutCsv, STORE_FEE, type Creator } from "./creatorMetrics";

const DAY = 86_400_000;
const NOW = Date.UTC(2027, 5, 1);
const creator = (over: Partial<Creator> = {}): Creator => ({
  code: "LIFT-ALEX",
  kind: "creator",
  name: "Alex",
  contact: null,
  rate: 0.3,
  months: 12,
  active: true,
  note: null,
  createdAt: 0,
  trialDays: 30,
  offering: "creator30",
  endsAt: null,
  maxUses: null,
  ...over,
});
let seq = 0;
const sub = (installId: string, kind: string, at: number, usd: number | null = null): SubEvent => ({
  id: `s${seq++}`,
  at,
  installId,
  subscription: null,
  store: "play",
  kind,
  plan: "annual",
  usd,
  priceLocal: usd,
  currency: "USD",
  reason: null,
});

describe("creator commission", () => {
  it("is the rate times net revenue, and refunds take it back", () => {
    expect(commissionOn({ kind: "purchase", usd: 100 }, 0.3)).toBeCloseTo(100 * (1 - STORE_FEE) * 0.3);
    expect(commissionOn({ kind: "refund", usd: 100 }, 0.3)).toBeCloseTo(-25.5);
    expect(commissionOn({ kind: "trial_start", usd: null }, 0.3)).toBe(0);
    expect(commissionOn({ kind: "cancel", usd: 39.99 }, 0.3)).toBe(0);
  });

  it("counts sign-ups, trials and payers, pays only past the refund window and only for the first 12 months", () => {
    const start = NOW - 400 * DAY;
    const rows = creatorRows({
      now: NOW,
      since: NOW - 28 * DAY,
      creators: [creator(), creator({ code: "LIFT-SAM", name: "Sam" })],
      installs: [
        { installId: "a", code: "LIFT-ALEX", at: start, source: "link", platform: "play" },
        { installId: "b", code: "LIFT-ALEX", at: NOW - 10 * DAY, source: "typed", platform: "appstore" },
        { installId: "c", code: "LIFT-ALEX", at: NOW - 5 * DAY, source: "referrer", platform: "play" },
      ],
      subs: [
        sub("a", "trial_start", start),
        sub("a", "trial_convert", start + 30 * DAY, 39.99),
        // Renews after 12 months: outside the window, so it earns nothing.
        sub("a", "renew", addMonths(start + 30 * DAY, 12) + DAY, 39.99),
        sub("b", "trial_start", NOW - 10 * DAY),
        sub("c", "purchase", NOW - 5 * DAY, 6.99), // inside the refund window: earned, not cleared
        sub("z", "purchase", NOW - 50 * DAY, 39.99), // no code
      ],
      payouts: [],
    });
    const alex = rows[0];
    expect(alex).toMatchObject({ signups: 3, signupsPeriod: 2, trials: 2, paying: 2, refunds: 0 });
    expect(alex.gross).toBeCloseTo(39.99 + 6.99);
    expect(alex.cleared).toBeCloseTo(39.99 * 0.85 * 0.3, 2);
    expect(alex.earned).toBeCloseTo((39.99 + 6.99) * 0.85 * 0.3, 2);
    expect(alex.owed).toBeCloseTo(10.2, 2);
    expect(alex.payable).toBe(false); // under $25
    expect(rows[1]).toMatchObject({ signups: 0, paying: 0, owed: 0 });
  });

  it("subtracts payouts and refunds, and lists only payable creators", () => {
    const t0 = NOW - 200 * DAY;
    const installs = Array.from({ length: 4 }, (_, i) => ({
      installId: `i${i}`,
      code: "LIFT-ALEX",
      at: t0,
      source: "link",
      platform: "play",
    }));
    const subs = [...installs.map((i) => sub(i.installId, "purchase", t0, 39.99)), sub("i0", "refund", NOW - 2 * DAY, 39.99)];
    const [row] = creatorRows({
      now: NOW,
      creators: [creator({ name: "=Alex" })],
      installs,
      subs,
      payouts: [{ id: 1, code: "LIFT-ALEX", usd: 5, paidAt: NOW - 20 * DAY, admin: "m@x", note: null }],
    });
    expect(row.refunds).toBe(1);
    expect(row.cleared).toBeCloseTo(3 * 39.99 * 0.85 * 0.3, 2);
    expect(row.owed).toBeCloseTo(row.cleared - 5, 2);
    expect(row.payable).toBe(true);
    expect(row.lastPayout).toBe(NOW - 20 * DAY);
    const csv = payoutCsv([row, { ...row, code: "LIFT-LOW", owed: 3, payable: false }]);
    expect(csv.trim().split("\n")).toHaveLength(2);
    // A name that looks like a formula can't run in a spreadsheet.
    expect(csv).toContain("'=Alex");
  });

  it("holds revenue for the refund window", () => {
    const at = NOW - (HOLD_DAYS - 1) * DAY;
    const [row] = creatorRows({
      now: NOW,
      creators: [creator()],
      installs: [{ installId: "x", code: "LIFT-ALEX", at, source: "link", platform: "play" }],
      subs: [sub("x", "purchase", at, 39.99)],
      payouts: [],
    });
    expect(row.cleared).toBe(0);
    expect(row.earned).toBeGreaterThan(0);
  });
});
