// The app-wide count of lifters who finished this month's challenge (Friends gap list 3, item 10;
// docs/decisions/friends.md "Monthly finishers"). A phone that finishes the month's challenge reports it once with a
// random id it made for this alone, and the Awards card shows how many finished. No account, name or usage-stats id
// is involved, and a month can only be reported while it's on (or just after, for a late sync).
import { query, rateLimit, run } from "./db";

const DAY = 86_400_000;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** "2026-11" for the month around `at` (UTC, with a day either side so every time zone's month counts). */
export function openMonths(now: number): Set<string> {
  const key = (t: number) => new Date(t).toISOString().slice(0, 7);
  return new Set([key(now - 3 * DAY), key(now), key(now + DAY)]);
}

export const validMonth = (m: unknown): m is string => typeof m === "string" && MONTH_RE.test(m);

/** Records one device finishing `month`; false when the input is bad or the month isn't open. */
export async function recordFinish(month: unknown, device: unknown, now = Date.now()): Promise<boolean> {
  if (!validMonth(month) || typeof device !== "string" || !DEVICE_RE.test(device) || !openMonths(now).has(month)) return false;
  await run("INSERT OR IGNORE INTO month_finishers (month, device, created_at) VALUES (?, ?, ?)", [month, device, now]);
  return true;
}

export async function finishedCount(month: string): Promise<number> {
  const [r] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM month_finishers WHERE month = ?", [month]);
  return Number(r?.n ?? 0);
}

/** Per address: a phone reports once a month and reads the count now and then. */
export const allowed = (ip: string, now = Date.now()) => rateLimit(`monthly-ip:${ip}`, 120, 3_600_000, now);
