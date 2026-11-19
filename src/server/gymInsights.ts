// Owner insights for a claimed gym (Melvin, 2026-11-19, gap item 8; docs/decisions/gyms.md "Owner insights").
// The app sends one anonymous visit when a workout ends at a gym added from the map (src/lib/gymVisits.ts): weekday,
// hour, length and the kinds of equipment used. Who it was is kept only as a one-way code, so the gym's lifters can be
// counted without being known, and visits go after KEEP_DAYS. The owner and the gym's staff see totals and shares only
// (src/lib/gymInsights.ts summarize), and nothing but a lifter count until MIN_LIFTERS lifters trained there.
import { createHash } from "node:crypto";

import { cleanVisit, KEEP_DAYS, summarize, WINDOW_DAYS, type GymInsights, type VisitRow } from "@/lib/gymInsights";

import { query, rateLimit, run } from "./db";
import { issuesOf } from "./gymExtras";
import { isPlaceId } from "./gymPlaces";
import { canManage } from "./gymStaff";

const DAY = 86_400_000;
const hash = (x: string) => createHash("sha256").update(`gymvisit:${x}`).digest("hex").slice(0, 24);

/** The one-way code for a lifter: the account when signed in, else the install. */
export const visitWho = (who: string) => hash(who);

export type VisitResult = { ok: true; counted: boolean } | { ok: false; error: "bad" | "slow" };

/**
 * Counts a visit. `who` is `acc:<id>` or `install:<id>`. A visit is counted once (its id is a code made from the
 * workout and who), only for a real gym that isn't hidden, and old visits of that gym are cleared on the way.
 */
export async function countVisit(who: string, body: unknown, now = Date.now()): Promise<VisitResult> {
  const v = cleanVisit(body, now);
  if (!v || !isPlaceId(v.place)) return { ok: false, error: "bad" };
  const code = visitWho(who);
  if (!(await rateLimit(`gyms:visit:${code}`, 8, DAY, now))) return { ok: false, error: "slow" };
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND hidden = 0", [v.place]);
  if (!p) return { ok: false, error: "bad" };
  const date = Math.floor(v.at / DAY);
  const added = await run(
    `INSERT INTO gym_visits (id, place_id, who, date, day, hour, minutes, gear) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO NOTHING`,
    [hash(`${who}:${v.session}`), v.place, code, date, v.day, v.hour, v.minutes, v.gear.join(",")],
  );
  await run("DELETE FROM gym_visits WHERE place_id = ? AND date < ?", [v.place, Math.floor(now / DAY) - KEEP_DAYS]);
  return { ok: true, counted: added > 0 };
}

// One answer per gym for ten minutes per server: opening the owner's page again doesn't read every visit again.
const cache = new Map<string, { at: number; ins: GymInsights }>();
const CACHE_MS = 10 * 60_000;

/** The owner's or staff's insights for their gym; null when the account doesn't manage it. */
export async function gymInsights(accountId: string, placeId: unknown, now = Date.now()): Promise<GymInsights | null> {
  if (!isPlaceId(placeId) || !(await canManage(accountId, placeId))) return null;
  const hit = cache.get(placeId);
  if (hit && now - hit.at < CACHE_MS) return hit.ins;
  const today = Math.floor(now / DAY);
  const [rows, issues] = await Promise.all([
    query<VisitRow>("SELECT who, date, day, hour, minutes, gear FROM gym_visits WHERE place_id = ? AND date > ?", [
      placeId,
      today - 2 * WINDOW_DAYS,
    ]),
    issuesOf(placeId, now),
  ]);
  const ins = summarize(
    rows.map((r) => ({
      who: String(r.who),
      date: Number(r.date),
      day: Number(r.day),
      hour: Number(r.hour),
      minutes: Number(r.minutes),
      gear: String(r.gear ?? ""),
    })),
    today,
    issues,
    now,
  );
  cache.set(placeId, { at: now, ins });
  return ins;
}

/** For tests: forget the cached answers. */
export const forgetInsights = () => cache.clear();

/** Account deletion: the account's visits go from every gym's numbers. */
export const visitDeletes = (accountId: string) => [{ sql: "DELETE FROM gym_visits WHERE who = ?", args: [visitWho(`acc:${accountId}`)] }];
