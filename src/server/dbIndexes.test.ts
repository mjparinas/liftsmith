// Turso bills every row a query reads, so queries on tables that grow must use an index (docs/decisions/database-reads.md).
// Each case is the shape of a real query (file named beside it) run through EXPLAIN QUERY PLAN on the real schema: it must
// search the table by the index named, never scan the whole table. A new query on a growing table adds its case here.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const { query, resetDb } = await import("./db");

const dir = mkdtempSync(join(tmpdir(), "liftsmith-idx-"));
const was = process.env.DATABASE_URL;
beforeAll(async () => {
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  await resetDb();
  await query("SELECT 1");
});
afterAll(async () => {
  await resetDb();
  if (was === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = was;
  rmSync(dir, { recursive: true, force: true });
});

async function plan(sql: string): Promise<string[]> {
  const rows = await query<{ detail: string }>(`EXPLAIN QUERY PLAN ${sql.replace(/\?\d*/g, "NULL")}`);
  return rows.map((r) => r.detail);
}

const CASES: { name: string; sql: string; uses: string[]; noScan: string[] }[] = [
  {
    name: "admin stats: an install's first event of a kind (adminData.ts)",
    sql: "SELECT MIN(at) FROM events e WHERE e.install_id = ? AND e.name = 'workout_start'",
    uses: ["events_install_name"],
    noScan: ["events", "e"],
  },
  {
    name: "admin stats: an install's trial start (adminData.ts)",
    sql: "SELECT MIN(at) AS t FROM subscription_events s WHERE s.install_id = ? AND s.kind = 'trial_start'",
    uses: ["subscription_events_install"],
    noScan: ["subscription_events", "s"],
  },
  {
    name: "Friends: training now (social.ts trainingPeople)",
    sql: `SELECT sp.handle FROM live_sessions l JOIN social_profiles sp ON sp.account_id = l.account_id
          WHERE l.updated_at > ?2 AND sp.live = 1 AND l.account_id != ?1 ORDER BY l.updated_at DESC LIMIT 50`,
    uses: ["live_sessions_updated"],
    noScan: ["live_sessions", "l", "social_profiles", "sp"],
  },
  {
    name: "gym classes: a gym's schedule (gymClasses.ts classesOf)",
    sql: `SELECT c.id, c.name FROM gym_classes c JOIN gym_places p ON p.id = c.place_id WHERE c.place_id = ? AND p.claimed_by <> '' LIMIT 80`,
    uses: ["gym_classes_place"],
    noScan: ["gym_classes", "c"],
  },
  {
    name: "gym classes: account deletion (gymClasses.ts classDeletes)",
    sql: "UPDATE gym_classes SET account_id = '' WHERE account_id = ?",
    uses: ["gym_classes_account"],
    noScan: ["gym_classes"],
  },
  {
    name: "gym owner: count of claimed gyms (gymClaims.ts)",
    sql: "SELECT COUNT(*) AS n FROM gym_places WHERE claimed_by <> '' AND claimed_by = ?",
    uses: ["gym_places_claimed"],
    noScan: ["gym_places"],
  },
  {
    name: "gym owner: staff of their gyms (gymStaff.ts)",
    sql: "DELETE FROM gym_staff WHERE place_id IN (SELECT id FROM gym_places WHERE claimed_by <> '' AND claimed_by = ?)",
    uses: ["gym_places_claimed"],
    noScan: ["gym_places"],
  },
  {
    name: "Friends activity: replies to my comments (social.ts)",
    sql: `SELECT c.body FROM post_comments c JOIN post_comments pc ON pc.id = c.reply_to JOIN posts p ON p.id = c.post_id
          WHERE pc.account_id = ?1 AND c.reply_to <> '' AND c.account_id != ?1 AND p.account_id != ?1 AND c.hidden = 0`,
    uses: ["post_comments_account", "post_comments_reply"],
    noScan: ["post_comments", "c", "pc"],
  },
  {
    name: "erasing an account's comments (accounts.ts)",
    sql: "DELETE FROM post_comments WHERE account_id = ?",
    uses: ["post_comments_account"],
    noScan: ["post_comments"],
  },
  {
    name: "coach overview: coaches who see my body data (coach.ts)",
    sql: "SELECT coach_id AS id FROM coach_shares WHERE client_id = ? AND body = 1",
    uses: ["coach_shares_client"],
    noScan: ["coach_shares"],
  },
  {
    name: "leaderboard starts from who I follow (social.ts board)",

    sql: `SELECT sp.account_id, COUNT(p.id) FROM (SELECT ?1 AS id UNION SELECT followee_id FROM follows WHERE follower_id = ?1 AND accepted = 1) ids
          JOIN social_profiles sp ON sp.account_id = ids.id
          LEFT JOIN posts p ON p.account_id = sp.account_id AND p.hidden = 0 AND p.at >= ?2 AND p.at < ?3
          WHERE sp.suspended = 0 GROUP BY sp.account_id LIMIT 201`,
    uses: [],
    noScan: ["social_profiles", "sp", "posts", "p"],
  },
  {
    name: "gym import: gyms due a website read (gymEnrich.ts enrichBatch)",
    sql: "SELECT id FROM gym_places WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at < ? ORDER BY enriched_at LIMIT ?",
    uses: ["gym_places_web"],
    noScan: ["gym_places"],
  },
  {
    name: "gym import: gyms due an AI read (gymAutoFill.ts autoFillBatch)",
    sql: "SELECT id FROM gym_places WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at > 0 AND ai_at < ? ORDER BY ai_at LIMIT ?",
    uses: ["gym_places_ai"],
    noScan: ["gym_places"],
  },
  {
    name: "gym import: claimed and lifter-added gyms a new map gym may be (gymPlaces.ts savePlaces)",
    sql: `SELECT id, name, lat, lon, source_ref FROM gym_places WHERE claimed_by <> '' AND claimed_by > ''
          UNION SELECT id, name, lat, lon, source_ref FROM gym_places WHERE source <> 'osm' AND source > ''`,
    uses: ["gym_places_claimed", "gym_places_own"],
    noScan: ["gym_places"],
  },
];

describe("queries on growing tables use an index", () => {
  for (const c of CASES) {
    it(c.name, async () => {
      const lines = await plan(c.sql);
      const text = lines.join("\n");
      for (const idx of c.uses) expect(text).toContain(idx);
      for (const t of c.noScan) expect(lines.filter((l) => l === `SCAN ${t}` || l.startsWith(`SCAN ${t} `))).toEqual([]);
    });
  }
});
