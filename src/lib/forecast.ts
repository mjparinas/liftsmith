// The revenue forecast's gross MRR (conservative, base and optimistic), from the forecast doc's chart
// (https://claude.ai/artifact/CiXkRo29nsLCuTzKYkQfx7, "Liftsmith cohort model, 36 months from launch").
// The admin panel draws real MRR against it. Values are at quarter ends; months between are interpolated on a
// log scale, because the curves grow roughly exponentially.

export const FORECAST_QUARTERS: { m: number; lo: number; mid: number; hi: number }[] = [
  { m: 3, lo: 137, mid: 464, hi: 1752 },
  { m: 6, lo: 308, mid: 1104, hi: 4335 },
  { m: 9, lo: 542, mid: 2048, hi: 8312 },
  { m: 12, lo: 879, mid: 3481, hi: 14566 },
  { m: 15, lo: 1235, mid: 5151, hi: 22204 },
  { m: 18, lo: 1608, mid: 7041, hi: 31086 },
  { m: 21, lo: 2008, mid: 9214, hi: 41531 },
  { m: 24, lo: 2439, mid: 11725, hi: 53851 },
  { m: 27, lo: 2881, mid: 14547, hi: 67754 },
  { m: 30, lo: 3352, mid: 17781, hi: 83512 },
  { m: 33, lo: 3855, mid: 21500, hi: 101444 },
  { m: 36, lo: 4392, mid: 25779, hi: 121854 },
];

/** The forecast's base assumptions, shown beside the real numbers in the admin panel. */
export const ASSUMED = {
  downloadToPaidD35: 0.029,
  annualShare: 0.68,
  monthlyChurn: 0.14,
  annualFirstRenewal: 0.58,
  refundRate: 0.047,
  trialToPaid: 0.399,
  realisedPrice: 0.9,
  revenuePerInstallD60: 0.66,
  storeFee: 0.15,
  vat: 0.06,
} as const;

export const LIST_PRICE = { monthly: 6.99, annual: 39.99 } as const;

/** Forecast gross MRR in USD for month `m` after launch (1 = the first month), or null outside 1 to 36. */
export function forecastAt(m: number): { lo: number; mid: number; hi: number } | null {
  if (m < 1 || m > 36) return null;
  const q = FORECAST_QUARTERS;
  // Before month 3, run the first quarter's growth backwards.
  let a = q[0];
  let b = q[1];
  for (let i = 0; i < q.length - 1; i++) {
    if (m >= q[i].m && m <= q[i + 1].m) {
      a = q[i];
      b = q[i + 1];
      break;
    }
  }
  const t = (m - a.m) / (b.m - a.m);
  const lerp = (x: number, y: number) => Math.round(Math.exp(Math.log(x) + (Math.log(y) - Math.log(x)) * t));
  return { lo: lerp(a.lo, b.lo), mid: lerp(a.mid, b.mid), hi: lerp(a.hi, b.hi) };
}
