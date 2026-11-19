// The public routine library (Melvin, 2026-11-19, gap item 6: "public routine library"; decision record:
// docs/decisions/routine-library.md). A lifter publishes one of their own routines, on purpose, with a goal, a level and
// a few words; anyone can search the library in the app and on the website (/routines/), save a routine to their own
// routines in one tap, and rate it with stars once they've saved it. Each published routine has its own public page.
//
// A routine travels as the same code as a shared routine link (routineShare.ts): exercises, set counts, supersets and
// parts, never weights, reps, notes or anything personal, because the saver's own progression fills those in.
//
// Teens: a lifter under 18 can browse, save and rate, but can't publish (a public page with their name on it).
// Moderation: the title and words go through the Friends filter (no links, no blocked words); three reports from
// different lifters hide a routine until staff decide on Admin › Reports (kind 'routine').
// Database reads: browsing reads one indexed list, kept for a minute per server (`listed`), and filters it in memory,
// so a search costs no rows; one routine, its rating and the lifter's own rows are read by key.
import { randomBytes } from "node:crypto";

import { isRoutineCode, nameOf, teenProfile } from "./coach";
import { batch, query, run } from "./db";
import { checkText, tidy } from "./moderation";

export const GOALS = ["strength", "muscle", "fitness", "fatLoss", "sport"] as const;
export const LEVELS = ["beginner", "intermediate", "advanced", "any"] as const;
export type Goal = (typeof GOALS)[number];
export type Level = (typeof LEVELS)[number];
export const REPORT_REASONS = ["spam", "abuse", "danger", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const LIBRARY_LIMITS = {
  title: 60,
  about: 300,
  /** Routines one lifter can have in the library. */
  perAccount: 30,
  /** Equipment ids one routine can list. */
  equipment: 20,
  minutes: [5, 240] as const,
  /** A routine's stars show once this many lifters have rated it. */
  shown: 3,
  /** Reports from different lifters that hide a routine until staff look. */
  hideAfter: 3,
  /** Most routines one answer gives. */
  page: 60,
  /** Most routines kept in the browsing list. */
  listMax: 3000,
  note: 300,
};

export interface Rating {
  /** Null until LIBRARY_LIMITS.shown lifters have rated it. */
  average: number | null;
  count: number;
}

export interface LibraryRoutine {
  id: string;
  title: string;
  about: string;
  goal: Goal;
  level: Level;
  /** Equipment ids the routine needs (worked out on the lifter's phone from its exercises). */
  equipment: string[];
  minutes: number;
  /** The routine code (routineShare.ts). */
  code: string;
  /** The publisher's name when they chose to show it, else "". */
  by: string;
  saves: number;
  rating: Rating;
  createdAt: number;
  updatedAt: number;
  /** The viewer published it. */
  mine?: boolean;
}

export interface LibraryView extends LibraryRoutine {
  /** The viewer's own stars, 0 when they haven't rated it. */
  myStars: number;
  /** The viewer saved it from the library. */
  saved: boolean;
}

interface Row {
  id: string;
  account_id: string;
  code: string;
  title: string;
  about: string;
  goal: string;
  level: string;
  equipment: string;
  minutes: number;
  show_name: number;
  author: string;
  saves: number;
  star_sum: number;
  ratings: number;
  hidden: number;
  created_at: number;
  updated_at: number;
}

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const n = (v: unknown) => Number(v ?? 0) || 0;
const pick = <T extends string>(list: readonly T[], x: unknown): T | null => ((list as readonly unknown[]).includes(x) ? (x as T) : null);

export const ratingOf = (sum: number, count: number): Rating => ({
  average: count >= LIBRARY_LIMITS.shown ? Math.round((sum / count) * 10) / 10 : null,
  count,
});

function shape(r: Row, viewer: string | null): LibraryRoutine {
  return {
    id: s(r.id),
    title: s(r.title),
    about: s(r.about),
    goal: pick(GOALS, s(r.goal)) ?? "strength",
    level: pick(LEVELS, s(r.level)) ?? "any",
    equipment: s(r.equipment).split(",").filter(Boolean),
    minutes: n(r.minutes),
    code: s(r.code),
    by: n(r.show_name) ? s(r.author) : "",
    saves: n(r.saves),
    rating: ratingOf(n(r.star_sum), n(r.ratings)),
    createdAt: n(r.created_at),
    updatedAt: n(r.updated_at),
    ...(viewer && viewer === s(r.account_id) ? { mine: true } : {}),
  };
}

const newId = (bytes: Buffer = randomBytes(9)) => bytes.toString("base64url").replace(/[-_]/g, "x").slice(0, 12);
export const isLibraryId = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9]{12}$/.test(x);

async function isTeen(accountId: string, now: number): Promise<boolean> {
  const [p] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  return teenProfile(p?.body, now);
}

/** Equipment ids as the phone sent them: plain ids, no repeats, at most LIBRARY_LIMITS.equipment. */
export function cleanEquipment(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const x of v) if (typeof x === "string" && /^[a-z0-9-]{2,40}$/i.test(x)) out.add(x);
  return [...out].sort().slice(0, LIBRARY_LIMITS.equipment);
}

// --- The browsing list: every listed routine, kept a minute per server ---

let cache: { at: number; rows: Row[] } | null = null;
const CACHE_MS = 60_000;
/** Drops the kept list (after a change on this server, and in tests). */
export const forgetLibraryCache = () => {
  cache = null;
};

async function listed(now: number): Promise<Row[]> {
  if (cache && now - cache.at < CACHE_MS) return cache.rows;
  const rows = await query<Row>(
    `SELECT id, account_id, code, title, about, goal, level, equipment, minutes, show_name, author, saves, star_sum, ratings, hidden,
       created_at, updated_at FROM library_routines WHERE hidden = 0 ORDER BY saves DESC LIMIT ?`,
    [LIBRARY_LIMITS.listMax],
  );
  cache = { at: now, rows };
  return rows;
}

/** Lowercase, accents off: "Día de pierna" finds "dia de pierna". */
export const fold = (x: string) => x.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

export type Sort = "top" | "new";

export interface BrowseQuery {
  /** Words to find in the title or the words about it. */
  q?: string;
  goal?: Goal | null;
  level?: Level | null;
  /** Only routines whose equipment is all in this list (the lifter's gym). */
  have?: string[] | null;
  sort?: Sort;
  limit?: number;
}

/** Top: rated best (once shown), then saved most, then newest. New: newest first. */
export function sortRoutines(list: LibraryRoutine[], sort: Sort): LibraryRoutine[] {
  const score = (r: LibraryRoutine) => (r.rating.average ?? 0) * Math.log10(10 + r.rating.count) + Math.log10(1 + r.saves);
  return [...list].sort((a, b) => (sort === "new" ? b.createdAt - a.createdAt : score(b) - score(a) || b.createdAt - a.createdAt));
}

/** Filters a list the way the library's search does (pure, for the server's kept list and for tests). */
export function filterRoutines(list: LibraryRoutine[], q: BrowseQuery): LibraryRoutine[] {
  const words = fold(tidy(q.q, 80)).split(" ").filter(Boolean);
  const have = q.have ? new Set(q.have) : null;
  return list.filter(
    (r) =>
      (!q.goal || r.goal === q.goal) &&
      (!q.level || r.level === q.level || r.level === "any") &&
      (!have || r.equipment.every((e) => have.has(e))) &&
      words.every((w) => fold(`${r.title} ${r.about} ${r.by}`).includes(w)),
  );
}

/** The library: listed routines matching the search, best first. */
export async function browseLibrary(viewer: string | null, q: BrowseQuery = {}, now = Date.now()): Promise<LibraryRoutine[]> {
  const all = (await listed(now)).map((r) => shape(r, viewer));
  return sortRoutines(filterRoutines(all, q), q.sort ?? "top").slice(0, Math.min(q.limit ?? LIBRARY_LIMITS.page, LIBRARY_LIMITS.listMax));
}

/** Reads a browse query from a request's search parameters. */
export function queryFrom(p: URLSearchParams): BrowseQuery {
  const have = p.get("have");
  return {
    q: p.get("q") ?? undefined,
    goal: pick(GOALS, p.get("goal")),
    level: pick(LEVELS, p.get("level")),
    have: have === null ? null : cleanEquipment(have.split(",")),
    sort: p.get("sort") === "new" ? "new" : "top",
  };
}

async function rowOf(id: string): Promise<Row | null> {
  if (!isLibraryId(id)) return null;
  const [r] = await query<Row>("SELECT * FROM library_routines WHERE id = ?", [id]);
  return r ?? null;
}

/** One routine with the viewer's own stars and whether they saved it. A hidden one only for its publisher. */
export async function libraryRoutine(id: string, viewer: string | null): Promise<LibraryView | null> {
  const r = await rowOf(id);
  if (!r || (n(r.hidden) && viewer !== s(r.account_id))) return null;
  const [mine, saved] = viewer
    ? await Promise.all([
        query("SELECT stars FROM library_ratings WHERE routine_id = ? AND account_id = ?", [id, viewer]),
        query("SELECT 1 AS x FROM library_saves WHERE routine_id = ? AND account_id = ?", [id, viewer]),
      ])
    : [[], []];
  return { ...shape(r, viewer), myStars: n(mine[0]?.stars), saved: saved.length > 0 };
}

/** The lifter's own published routines, newest first (hidden ones included, so they can see and take them down). */
export async function myLibrary(accountId: string): Promise<(LibraryRoutine & { hidden: boolean })[]> {
  const rows = await query<Row>("SELECT * FROM library_routines WHERE account_id = ? ORDER BY updated_at DESC", [accountId]);
  return rows.map((r) => ({ ...shape(r, accountId), hidden: !!n(r.hidden) }));
}

export type PublishError = "bad" | "title" | "about" | "teen" | "full" | "notYours" | "empty";

/**
 * Publishes one of the lifter's routines, or changes one they published (`id`). Publishing the same routine again
 * (the same code) changes the one already there instead of listing it twice.
 */
export async function publishRoutine(accountId: string, raw: unknown, now = Date.now()): Promise<LibraryRoutine | { error: PublishError }> {
  if (!raw || typeof raw !== "object") return { error: "bad" };
  const p = raw as Record<string, unknown>;
  if (await isTeen(accountId, now)) return { error: "teen" };
  if (!isRoutineCode(p.code)) return { error: "bad" };
  if (!/~[\w-]+\.\d/.test(p.code)) return { error: "empty" };
  const title = checkText(p.title, LIBRARY_LIMITS.title);
  if (!title.ok) return { error: "title" };
  let about = "";
  if (tidy(p.about, LIBRARY_LIMITS.about)) {
    const a = checkText(p.about, LIBRARY_LIMITS.about);
    if (!a.ok) return { error: "about" };
    about = a.text;
  }
  const goal = pick(GOALS, p.goal);
  const level = pick(LEVELS, p.level);
  const minutes = Number(p.minutes);
  if (!goal || !level || !Number.isInteger(minutes) || minutes < LIBRARY_LIMITS.minutes[0] || minutes > LIBRARY_LIMITS.minutes[1])
    return { error: "bad" };
  const equipment = cleanEquipment(p.equipment).join(",");
  const showName = p.showName !== false ? 1 : 0;
  const author = showName ? await nameOf(accountId) : "";
  let id = isLibraryId(p.id) ? p.id : null;
  if (id) {
    const r = await rowOf(id);
    if (!r || s(r.account_id) !== accountId) return { error: "notYours" };
  } else {
    const [same] = await query("SELECT id FROM library_routines WHERE account_id = ? AND code = ?", [accountId, p.code]);
    if (same) id = s(same.id);
  }
  if (id) {
    await run(
      `UPDATE library_routines SET code = ?, title = ?, about = ?, goal = ?, level = ?, equipment = ?, minutes = ?, show_name = ?, author = ?,
         updated_at = ? WHERE id = ? AND account_id = ?`,
      [p.code, title.text, about, goal, level, equipment, minutes, showName, author, now, id, accountId],
    );
  } else {
    const [c] = await query("SELECT COUNT(*) AS k FROM library_routines WHERE account_id = ?", [accountId]);
    if (n(c?.k) >= LIBRARY_LIMITS.perAccount) return { error: "full" };
    id = newId();
    await run(
      `INSERT INTO library_routines (id, account_id, code, title, about, goal, level, equipment, minutes, show_name, author, saves, star_sum,
         ratings, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)`,
      [id, accountId, p.code, title.text, about, goal, level, equipment, minutes, showName, author, now, now],
    );
  }
  forgetLibraryCache();
  const r = await rowOf(id);
  return r ? shape(r, accountId) : { error: "bad" };
}

/** Takes one of the lifter's routines out of the library, with its ratings, saves and reports. */
export async function unpublishRoutine(accountId: string, id: unknown): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const r = await rowOf(id);
  if (!r || s(r.account_id) !== accountId) return false;
  await batch(removeRows(id));
  forgetLibraryCache();
  return true;
}

const removeRows = (id: string) => [
  { sql: "DELETE FROM library_ratings WHERE routine_id = ?", args: [id] },
  { sql: "DELETE FROM library_saves WHERE routine_id = ?", args: [id] },
  { sql: "UPDATE reports SET status = 'removed' WHERE kind = 'routine' AND target_id = ? AND status = 'open'", args: [id] },
  { sql: "DELETE FROM library_routines WHERE id = ?", args: [id] },
];

/** Counts a save from the library once per lifter (the routine itself is saved on the phone). */
export async function noteSave(accountId: string, id: unknown, now = Date.now()): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const r = await rowOf(id);
  if (!r || n(r.hidden)) return false;
  const added = await run("INSERT OR IGNORE INTO library_saves (routine_id, account_id, at) VALUES (?, ?, ?)", [id, accountId, now]);
  if (added && s(r.account_id) !== accountId) await run("UPDATE library_routines SET saves = saves + 1 WHERE id = ?", [id]);
  return true;
}

export type RateError = "gone" | "notSaved" | "yours" | "bad";

/** Stars from a lifter who saved the routine (0 takes theirs back). Returns the routine's rating after it. */
export async function rateRoutine(
  accountId: string,
  id: unknown,
  stars: unknown,
  now = Date.now(),
): Promise<Rating | { error: RateError }> {
  if (!isLibraryId(id)) return { error: "gone" };
  const v = Number(stars);
  if (!Number.isInteger(v) || v < 0 || v > 5) return { error: "bad" };
  const r = await rowOf(id);
  if (!r || n(r.hidden)) return { error: "gone" };
  if (s(r.account_id) === accountId) return { error: "yours" };
  const [saved] = await query("SELECT 1 AS x FROM library_saves WHERE routine_id = ? AND account_id = ?", [id, accountId]);
  if (!saved) return { error: "notSaved" };
  await batch([
    v === 0
      ? { sql: "DELETE FROM library_ratings WHERE routine_id = ? AND account_id = ?", args: [id, accountId] }
      : {
          sql: `INSERT INTO library_ratings (routine_id, account_id, stars, at) VALUES (?, ?, ?, ?)
                ON CONFLICT (routine_id, account_id) DO UPDATE SET stars = excluded.stars, at = excluded.at`,
          args: [id, accountId, v, now],
        },
    {
      sql: `UPDATE library_routines SET star_sum = (SELECT COALESCE(SUM(stars), 0) FROM library_ratings WHERE routine_id = ?),
              ratings = (SELECT COUNT(*) FROM library_ratings WHERE routine_id = ?) WHERE id = ?`,
      args: [id, id, id],
    },
  ]);
  forgetLibraryCache();
  const after = await rowOf(id);
  return ratingOf(n(after?.star_sum), n(after?.ratings));
}

/** A report from a lifter; three from different lifters hide the routine until staff decide. */
export async function reportRoutine(accountId: string, id: unknown, reason: unknown, note: unknown, now = Date.now()): Promise<boolean> {
  if (!isLibraryId(id)) return false;
  const why = pick(REPORT_REASONS, reason);
  if (!why) return false;
  const r = await rowOf(id);
  if (!r || s(r.account_id) === accountId) return false;
  await run(
    "INSERT OR IGNORE INTO reports (reporter_id, kind, target_id, reason, note, created_at, status) VALUES (?, 'routine', ?, ?, ?, ?, 'open')",
    [accountId, id, why, tidy(note, LIBRARY_LIMITS.note), now],
  );
  const [c] = await query(
    "SELECT COUNT(DISTINCT reporter_id) AS k FROM reports WHERE kind = 'routine' AND target_id = ? AND status = 'open'",
    [id],
  );
  if (n(c?.k) >= LIBRARY_LIMITS.hideAfter) {
    await run("UPDATE library_routines SET hidden = 1 WHERE id = ?", [id]);
    forgetLibraryCache();
  }
  return true;
}

// --- Staff: Admin › Reports ---

/** What the Reports tab shows for a reported routine. */
export async function routineReport(id: string): Promise<{ content: string; authorId: string; hidden: boolean } | null> {
  const r = await rowOf(id);
  if (!r) return null;
  return {
    content: `Library routine "${s(r.title)}"${s(r.about) ? `: ${s(r.about)}` : ""}`,
    authorId: s(r.account_id),
    hidden: !!n(r.hidden),
  };
}

/** Staff decide: `remove` takes the routine out of the library, `dismiss` shows it again. */
export async function resolveRoutine(id: string, action: "remove" | "dismiss"): Promise<boolean> {
  const r = await rowOf(id);
  if (!r) return false;
  if (action === "remove") await batch(removeRows(id));
  else
    await batch([
      { sql: "UPDATE library_routines SET hidden = 0 WHERE id = ?", args: [id] },
      { sql: "UPDATE reports SET status = 'dismissed' WHERE kind = 'routine' AND target_id = ? AND status = 'open'", args: [id] },
    ]);
  forgetLibraryCache();
  return true;
}

/** Account deletion: the lifter's routines go, and their stars come off other routines. */
export function libraryCleanup(accountId: string) {
  return [
    {
      sql: `UPDATE library_routines SET star_sum = star_sum - (SELECT stars FROM library_ratings WHERE routine_id = library_routines.id AND account_id = ?),
              ratings = ratings - 1 WHERE id IN (SELECT routine_id FROM library_ratings WHERE account_id = ?)`,
      args: [accountId, accountId],
    },
    { sql: "DELETE FROM library_ratings WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM library_saves WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM library_ratings WHERE routine_id IN (SELECT id FROM library_routines WHERE account_id = ?)", args: [accountId] },
    { sql: "DELETE FROM library_saves WHERE routine_id IN (SELECT id FROM library_routines WHERE account_id = ?)", args: [accountId] },
    { sql: "DELETE FROM library_routines WHERE account_id = ?", args: [accountId] },
  ];
}
