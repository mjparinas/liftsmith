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
    name: "club chat: a page of a club's messages (clubChat.ts clubChat)",
    sql: `SELECT m.id FROM club_messages m JOIN social_profiles sp ON sp.account_id = m.account_id
          WHERE m.club_id = ?1 AND m.hidden = 0 AND m.created_at < ?3 ORDER BY m.created_at DESC LIMIT 50`,
    uses: ["club_messages_club"],
    noScan: ["club_messages", "m"],
  },
  {
    name: "club chat: unread messages on the club list (social.ts clubs)",
    sql: `SELECT COUNT(*) FROM club_messages cmsg WHERE cmsg.club_id = ? AND cmsg.created_at > ? AND cmsg.account_id != ? AND cmsg.hidden = 0`,
    uses: ["club_messages_club"],
    noScan: ["club_messages", "cmsg"],
  },
  {
    name: "crew sessions: a club's coming sessions (clubChat.ts sessionsFor)",
    sql: `SELECT cs.id FROM crew_sessions cs WHERE cs.club_id = ?1 AND cs.starts_at > ?3 AND cs.starts_at < ?4 ORDER BY cs.starts_at LIMIT 20`,
    uses: ["crew_sessions_club"],
    noScan: ["crew_sessions", "cs"],
  },
  {
    name: "crew sessions: reminders due (clubChat.ts crewReminders)",
    sql: "SELECT id FROM crew_sessions WHERE reminded = 0 AND starts_at > ? AND starts_at <= ? ORDER BY starts_at LIMIT 200",
    uses: ["crew_sessions_due"],
    noScan: ["crew_sessions"],
  },
  {
    name: "crew sessions: the lifter's sessions around a posted workout (clubChat.ts crewTrained)",
    sql: `SELECT g.session_id FROM crew_going g JOIN crew_sessions cs ON cs.id = g.session_id
          WHERE g.account_id = ? AND cs.starts_at BETWEEN ? AND ?`,
    uses: ["crew_going_account"],
    noScan: ["crew_going", "g", "crew_sessions", "cs"],
  },
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
