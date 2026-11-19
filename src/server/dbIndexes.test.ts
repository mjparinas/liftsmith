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
    name: "form videos: a lifter's videos as coach or client (formVideos.ts videosOf)",
    sql: "SELECT * FROM coach_videos WHERE (coach_id = ? OR client_id = ?) AND ready = 1 ORDER BY at DESC LIMIT 300",
    uses: ["coach_videos_pair", "coach_videos_client"],
    noScan: ["coach_videos"],
  },
  {
    name: "form videos: the notes on a page of videos (formVideos.ts notesOf)",
    sql: "SELECT * FROM coach_video_notes WHERE video_id IN (?, ?, ?) ORDER BY video_id, ms, at",
    uses: ["coach_video_notes_video"],
    noScan: ["coach_video_notes"],
  },
  {
    name: "form videos: the pair's oldest past the keep (formVideos.ts finishVideo)",
    sql: "SELECT * FROM coach_videos WHERE coach_id = ? AND client_id = ? AND ready = 1 ORDER BY at DESC LIMIT -1 OFFSET ?",
    uses: ["coach_videos_pair"],
    noScan: ["coach_videos"],
  },
  {
    name: "form videos: a client's unfinished uploads (formVideos.ts dropStale)",
    sql: "SELECT * FROM coach_videos WHERE client_id = ? AND ready = 0 AND at < ?",
    uses: ["coach_videos_client"],
    noScan: ["coach_videos"],
  },
  {
    name: "form videos: everything between a coach and client (formVideos.ts dropPairVideos)",
    sql: "SELECT * FROM coach_videos WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)",
    uses: ["coach_videos_pair"],
    noScan: ["coach_videos"],
  },
  {
    name: "form videos: an account's videos when it's deleted (formVideos.ts dropVideosOf)",
    sql: "SELECT * FROM coach_videos WHERE coach_id = ? OR client_id = ?",
    uses: ["coach_videos_pair", "coach_videos_client"],
    noScan: ["coach_videos"],
  },
  {
    name: "form videos: notes on one video (formVideos.ts addNote)",
    sql: "SELECT COUNT(*) AS n FROM coach_video_notes WHERE video_id = ?",
    uses: ["coach_video_notes_video"],
    noScan: ["coach_video_notes"],
  },
  {
    name: "community: the board's top posts (community.ts board)",
    sql: "SELECT p.id FROM community_posts p WHERE p.hidden = 0 AND p.status != 'merged' ORDER BY p.votes DESC LIMIT 300",
    uses: ["community_posts_board"],
    noScan: ["community_posts", "p"],
  },
  {
    name: "community: the board's newest posts (community.ts board)",
    sql: "SELECT p.id FROM community_posts p WHERE p.hidden = 0 AND p.status != 'merged' AND p.teen = 0 ORDER BY p.created_at DESC LIMIT 100",
    uses: ["community_posts_new"],
    noScan: ["community_posts", "p"],
  },
  {
    name: "community: a lifter's own hidden posts (community.ts board)",
    sql: "SELECT p.id FROM community_posts p WHERE p.account_id = ? AND p.hidden = 1",
    uses: ["community_posts_account"],
    noScan: ["community_posts", "p"],
  },
  {
    name: "community: what a lifter voted for and follows (community.ts board)",
    sql: "SELECT post_id FROM community_votes WHERE account_id = ?",
    uses: ["community_votes_account"],
    noScan: ["community_votes"],
  },
  {
    name: "community: posts a lifter follows (community.ts board)",
    sql: "SELECT post_id FROM community_follows WHERE account_id = ? AND on_ = 1",
    uses: ["community_follows_account"],
    noScan: ["community_follows"],
  },
  {
    name: "community: a post's comments (community.ts thread)",
    sql: "SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at LIMIT 500",
    uses: ["community_comments_post"],
    noScan: ["community_comments"],
  },
  {
    name: "community: a post's timeline (community.ts thread)",
    sql: "SELECT post_id, status, note, at FROM community_updates WHERE post_id = ? ORDER BY at",
    uses: ["community_updates_post"],
    noScan: ["community_updates"],
  },
  {
    name: "community: the changelog (community.ts changelog)",
    sql: `SELECT u.post_id, p.title FROM community_updates u JOIN community_posts p ON p.id = u.post_id
          WHERE u.status = 'shipped' AND p.hidden = 0 AND p.teen = 0 ORDER BY u.at DESC LIMIT 100`,
    uses: ["community_updates_status"],
    noScan: ["community_updates", "u", "community_posts", "p"],
  },
  {
    name: "community: posts merged into a duplicate (community.ts merge)",
    sql: "UPDATE community_posts SET merged_into = ? WHERE merged_into = ?",
    uses: ["community_posts_merged"],
    noScan: ["community_posts"],
  },
  {
    name: "community: Admin › Community, newest first (community.ts adminPosts)",
    sql: `SELECT p.id, (SELECT COUNT(*) FROM reports r WHERE r.kind = 'feedback' AND r.target_id = 'p:' || p.id AND r.status = 'open') AS reports
          FROM community_posts p ORDER BY p.created_at DESC LIMIT 1000`,
    // Walks the newest posts in index order and stops at the limit; each post's reports come by index.
    uses: ["community_posts_created", "reports_"],
    noScan: ["reports", "r"],
  },
  {
    name: "community: deleting an account (community.ts communityCleanup)",
    sql: "DELETE FROM community_comments WHERE post_id IN (SELECT id FROM community_posts WHERE account_id = ? AND status = 'review')",
    uses: ["community_posts_account"],
    noScan: ["community_posts", "community_comments"],
  },
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
    name: "gym import: old website icons still to measure (gymEnrich.ts measureIcons)",
    sql: "SELECT id, place_id, substr(image, 1, 4096) AS head FROM gym_photos WHERE kind = 'icon' AND px = 0 LIMIT ?",
    // A scan of this partial index reads only the icons not measured yet, never the table, and it ends up empty.
    uses: ["gym_photos_unmeasured"],
    noScan: [],
  },
  {
    name: "gym pictures: ones still to move to Blob (gymBlob.ts movePictures)",
    sql: "SELECT id, image FROM gym_photos WHERE url = '' AND (kind <> 'icon' OR px > 0) LIMIT ?",
    // Like the one above: the partial index holds only pictures not moved yet, and it ends up empty.
    uses: ["gym_photos_unmoved"],
    noScan: [],
  },
  {
    name: "gym pictures: a gym's files before its rows go (gymBlob.ts pictureUrls)",
    sql: "SELECT url FROM gym_photos WHERE place_id = ? AND kind = ? AND url <> ''",
    uses: ["gym_photos_place"],
    noScan: ["gym_photos"],
  },
  {
    name: "gym import: gyms due an AI read (gymAutoFill.ts autoFillBatch)",
    sql: "SELECT id FROM gym_places WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at > 0 AND ai_at < ? ORDER BY ai_at LIMIT ?",
    uses: ["gym_places_ai"],
    noScan: ["gym_places"],
  },
  {
    name: "AI fix-up: the next gyms that never had their go (gymAiFix.ts fixBatch)",
    sql: "SELECT id FROM gym_places WHERE ai_fix_at = 0 AND claimed_by = '' AND hidden = 0 AND pending = 0 AND website <> '' LIMIT ?",
    uses: ["gym_places_ai_fix"],
    noScan: ["gym_places"],
  },
  {
    name: "AI fix-up: a pass's latest changes and its suggestions (gymAiFix.ts fixStatus)",
    sql: `SELECT f.id, f.place_id, f.field, f.before, f.after, f.at, f.undone, f.state, p.name FROM gym_ai_fixes f
          LEFT JOIN gym_places p ON p.id = f.place_id WHERE f.job = ? AND f.state = ? ORDER BY f.at DESC LIMIT ?`,
    uses: ["gym_ai_fixes_job"],
    noScan: ["gym_ai_fixes", "f", "gym_places", "p"],
  },
  {
    name: "AI fix-up: the first run's gyms get a fresh go (gymAiFix.ts revertOldRules)",
    sql: "SELECT id FROM gym_places WHERE ai_fix_at > 0 AND claimed_by = '' AND hidden = 0 AND pending = 0 AND website <> ''",
    uses: ["gym_places_ai_fix"],
    noScan: ["gym_places"],
  },
  {
    name: "AI fix-up: the first run's changes (gymAiFix.ts revertOldRules)",
    sql: "SELECT id, place_id, field, before, after FROM gym_ai_fixes WHERE job IN (?, ?) AND state = 'applied' AND undone = 0",
    uses: ["gym_ai_fixes_job"],
    noScan: ["gym_ai_fixes"],
  },
  {
    name: "gym import: claimed and lifter-added gyms a new map gym may be (gymPlaces.ts savePlaces)",
    sql: `SELECT id, name, lat, lon, source_ref FROM gym_places WHERE claimed_by <> '' AND claimed_by > ''
          UNION SELECT id, name, lat, lon, source_ref FROM gym_places WHERE source <> 'osm' AND source > ''`,
    uses: ["gym_places_claimed", "gym_places_own"],
    noScan: ["gym_places"],
  },
  {
    name: "check-in photos: one photo for the pair (coachForms.ts photoFor)",
    sql: "SELECT data FROM coach_checkin_photos WHERE checkin_id = ? AND question_id = ? AND (coach_id = ? OR client_id = ?)",
    uses: ["sqlite_autoindex_coach_checkin_photos_1"],
    noScan: ["coach_checkin_photos"],
  },
  {
    name: "check-in photos: dropping a pair's old ones (coachForms.ts prunePhotos)",
    sql: `DELETE FROM coach_checkin_photos WHERE coach_id = ? AND client_id = ? AND checkin_id NOT IN
            (SELECT id FROM coach_checkins WHERE coach_id = ? AND client_id = ? ORDER BY sent_at DESC LIMIT ?)`,
    uses: ["coach_checkin_photos_pair", "coach_checkins_pair"],
    noScan: ["coach_checkin_photos", "coach_checkins"],
  },
  {
    name: "check-in photos: erasing an account's (coach.ts coachCleanup)",
    sql: "DELETE FROM coach_checkin_photos WHERE coach_id = ? OR client_id = ?",
    uses: ["coach_checkin_photos_pair", "coach_checkin_photos_client"],
    noScan: ["coach_checkin_photos"],
  },
  {
    name: "routine library: the browsing list (routineLibrary.ts listed)",
    sql: "SELECT id, title FROM library_routines WHERE hidden = 0 ORDER BY saves DESC LIMIT 3000",
    uses: ["library_routines_list"],
    noScan: ["library_routines"],
  },
  {
    name: "routine library: a lifter's own routines (routineLibrary.ts myLibrary)",
    sql: "SELECT * FROM library_routines WHERE account_id = ? ORDER BY updated_at DESC",
    uses: ["library_routines_account"],
    noScan: ["library_routines"],
  },
  {
    name: "routine library: the same routine published again (routineLibrary.ts publishRoutine)",
    sql: "SELECT id FROM library_routines WHERE account_id = ? AND code = ?",
    uses: ["library_routines_account"],
    noScan: ["library_routines"],
  },
  {
    name: "routine library: a lifter's stars on a routine (routineLibrary.ts libraryRoutine)",
    sql: "SELECT stars FROM library_ratings WHERE routine_id = ? AND account_id = ?",
    uses: ["sqlite_autoindex_library_ratings_1"],
    noScan: ["library_ratings"],
  },
  {
    name: "routine library: a routine's rating summed (routineLibrary.ts rateRoutine)",
    sql: "SELECT COALESCE(SUM(stars), 0) FROM library_ratings WHERE routine_id = ?",
    uses: ["sqlite_autoindex_library_ratings_1"],
    noScan: ["library_ratings"],
  },
  {
    name: "routine library: a deleted account's stars (routineLibrary.ts libraryCleanup)",
    sql: "SELECT routine_id FROM library_ratings WHERE account_id = ?",
    uses: ["library_ratings_account"],
    noScan: ["library_ratings"],
  },
  {
    name: "routine library: a deleted account's saves (routineLibrary.ts libraryCleanup)",
    sql: "SELECT routine_id FROM library_saves WHERE account_id = ?",
    uses: ["library_saves_account"],
    noScan: ["library_saves"],
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
