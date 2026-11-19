// Team sessions (Melvin, 2026-11-19, gap list item 5: "team session for high school coaches"; decision record
// docs/decisions/school-teams.md "Team sessions"). A verified school coach runs one workout for a whole team from one
// tablet: each athlete taps their first name and logs their own sets, and the coach sees a live board.
//
// - Local first: the tablet keeps the session and every set on the device and pushes them here in the background
//   (src/lib/teamSession.ts), so a gym with no reception loses nothing. Every push is idempotent: the session is
//   upserted by its id and sets are kept by theirs, so a push repeated after a dropped answer changes nothing.
// - Only the team's own coach, still verified (teams.ts isSchoolCoach), can push a session for a team, and only for
//   athletes on that team.
// - When the session ends, each athlete's sets become a finished workout in their own account (sync_events, the same
//   events a hand-logged past workout writes, marked `source: "manual"` with the team's name), so it reaches their
//   phone through the usual sync and counts toward their history, progression and the team's weekly board. Ids are
//   fixed (`team-<session>-…`), so writing twice adds nothing, and the athlete can delete it like any workout.
// - Teen-safe: first names only on the tablet and the board, never weights on the board (the board says sets done and
//   what each athlete is on), and nothing public.
import { nameOf } from "./coach";
import { batch, query, rateLimit } from "./db";
import { firstName, isSchoolCoach, ownTeam } from "./teams";

const DAY = 86_400_000;

export const SESSION_LIMITS = {
  /** Exercises in a team session's plan, sets per exercise, and reps (or seconds for holds) per set. */
  items: 20,
  sets: 10,
  reps: 600,
  /** Sets one push may carry, and sets a whole session may hold (100 athletes × 20 exercises × a few sets). */
  perPush: 300,
  perSession: 6000,
  /** Pushes a coach may make in an hour (one every few seconds from a busy tablet). */
  pushesPerHour: 1200,
  /** A session nobody ended counts as over after this long (the live board stops showing it). */
  liveMs: 12 * 3_600_000,
  /** The tablet starts each athlete from their weights in the team's last few sessions. */
  lastSessions: 3,
  /** How heavy a set can be, in kg. */
  maxKg: 1000,
};

export interface TeamPlanItem {
  exerciseId: string;
  sets: number;
  /** Reps (or seconds for holds) to aim for in each set. */
  reps: number;
}
export interface TeamSetIn {
  id: string;
  athlete: string;
  exercise: string;
  /** Kilograms. */
  weight: number;
  reps: number;
  target: number;
  at: number;
}
export interface SessionPush {
  session: { id: string; team: string; name: string; plan: TeamPlanItem[]; startedAt: number; endedAt?: number };
  sets: TeamSetIn[];
  removed: string[];
}

const ID = /^[A-Za-z0-9-]{8,48}$/;
const EXERCISE = /^[A-Za-z0-9_.:-]{1,80}$/;
const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const int = (x: unknown, lo: number, hi: number) => typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi;
const time = (x: unknown, now: number) => typeof x === "number" && Number.isFinite(x) && x > now - 7 * DAY && x <= now + 5 * 60_000;

/** A plan as the tablet sent it, checked: null when it can't be one. */
export function cleanPlan(raw: unknown): TeamPlanItem[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > SESSION_LIMITS.items) return null;
  const out: TeamPlanItem[] = [];
  for (const r of raw as Record<string, unknown>[]) {
    if (!r || !EXERCISE.test(s(r.exerciseId))) return null;
    if (!int(r.sets, 1, SESSION_LIMITS.sets) || !int(r.reps, 1, SESSION_LIMITS.reps)) return null;
    out.push({ exerciseId: s(r.exerciseId), sets: n(r.sets), reps: n(r.reps) });
  }
  return out;
}

/** A push from the tablet, checked as a whole: one bad part refuses all of it, so nothing half-applies. */
export function checkPush(raw: unknown, now: number): SessionPush | null {
  const b = raw as Record<string, unknown> | null;
  const ses = b?.session as Record<string, unknown> | undefined;
  if (!ses || !ID.test(s(ses.id)) || typeof ses.team !== "string" || !time(ses.startedAt, now)) return null;
  const plan = cleanPlan(ses.plan);
  if (!plan) return null;
  const ended = ses.endedAt;
  if (ended !== undefined && (!time(ended, now) || n(ended) < n(ses.startedAt))) return null;
  const sets = Array.isArray(b?.sets) ? (b.sets as Record<string, unknown>[]) : [];
  const removed = Array.isArray(b?.removed) ? (b.removed as unknown[]) : [];
  if (sets.length > SESSION_LIMITS.perPush || removed.length > SESSION_LIMITS.perPush) return null;
  const cleanSets: TeamSetIn[] = [];
  for (const x of sets) {
    if (!x || !ID.test(s(x.id)) || !s(x.athlete) || s(x.athlete).length > 64 || !EXERCISE.test(s(x.exercise))) return null;
    if (typeof x.weight !== "number" || !Number.isFinite(x.weight) || x.weight < 0 || x.weight > SESSION_LIMITS.maxKg) return null;
    if (!int(x.reps, 0, SESSION_LIMITS.reps) || !int(x.target, 1, SESSION_LIMITS.reps) || !time(x.at, now)) return null;
    cleanSets.push({
      id: s(x.id),
      athlete: s(x.athlete),
      exercise: s(x.exercise),
      weight: Math.round(x.weight * 1000) / 1000,
      reps: n(x.reps),
      target: n(x.target),
      at: n(x.at),
    });
  }
  if (!removed.every((r) => typeof r === "string" && ID.test(r))) return null;
  return {
    session: {
      id: s(ses.id),
      team: ses.team,
      name: s(ses.name).replace(/\s+/g, " ").trim().slice(0, 60),
      plan,
      startedAt: n(ses.startedAt),
      ...(ended !== undefined ? { endedAt: n(ended) } : {}),
    },
    sets: cleanSets,
    removed: removed as string[],
  };
}

type SessionRow = {
  id: string;
  team_id: string;
  coach_id: string;
  name: string;
  plan: string;
  started_at: number;
  ended_at: number | null;
  written: number;
};

export type PushError = "bad" | "slow" | "notCoach" | "unknown" | "full";

/**
 * Stores what the tablet sent: the session (made on the first push), new sets, sets taken back, and the end. Once the
 * session has ended and its workouts are written, later pushes change nothing, so a late retry can't add to a workout
 * the athlete already has.
 */
export async function pushSession(
  coachId: string,
  raw: unknown,
  now = Date.now(),
): Promise<{ ok: true; written: boolean } | { ok: false; error: PushError }> {
  const p = checkPush(raw, now);
  if (!p) return { ok: false, error: "bad" };
  if (!(await rateLimit(`teamsession:${coachId}`, SESSION_LIMITS.pushesPerHour, 3_600_000, now))) return { ok: false, error: "slow" };
  if (!(await isSchoolCoach(coachId, now))) return { ok: false, error: "notCoach" };
  const team = await ownTeam(coachId, p.session.team);
  if (!team) return { ok: false, error: "unknown" };
  const [had] = await query<SessionRow>("SELECT * FROM team_sessions WHERE id = ?", [p.session.id]);
  if (had && (s(had.coach_id) !== coachId || s(had.team_id) !== team.id)) return { ok: false, error: "unknown" };
  if (had && n(had.written)) return { ok: true, written: true };
  const members = new Set(
    (await query<{ account_id: string }>("SELECT account_id FROM team_members WHERE team_id = ?", [team.id])).map((m) => s(m.account_id)),
  );
  if (p.sets.some((x) => !members.has(x.athlete))) return { ok: false, error: "unknown" };
  if (p.sets.length) {
    const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM team_session_sets WHERE session_id = ?", [p.session.id]);
    if (n(c?.n) + p.sets.length > SESSION_LIMITS.perSession) return { ok: false, error: "full" };
  }
  const stmts: { sql: string; args: (string | number | null)[] }[] = [
    {
      sql: `INSERT INTO team_sessions (id, team_id, coach_id, name, plan, started_at, ended_at, written) VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            ON CONFLICT (id) DO UPDATE SET name = excluded.name, plan = excluded.plan,
              ended_at = COALESCE(team_sessions.ended_at, excluded.ended_at)`,
      args: [
        p.session.id,
        team.id,
        coachId,
        p.session.name,
        JSON.stringify(p.session.plan),
        p.session.startedAt,
        p.session.endedAt ?? null,
      ],
    },
  ];
  for (const x of p.sets) {
    stmts.push({
      sql: `INSERT OR IGNORE INTO team_session_sets (session_id, id, athlete_id, exercise_id, weight, reps, target, at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.session.id, x.id, x.athlete, x.exercise, x.weight, x.reps, x.target, x.at],
    });
  }
  for (const id of p.removed)
    stmts.push({ sql: "DELETE FROM team_session_sets WHERE session_id = ? AND id = ?", args: [p.session.id, id] });
  await batch(stmts);
  if (p.session.endedAt === undefined) return { ok: true, written: false };
  await writeWorkouts(p.session.id);
  return { ok: true, written: true };
}

/** The gym a lifter's workouts go under: the active gym on their synced profile, when there is one. */
async function activeGym(accountId: string): Promise<string> {
  const [p] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  try {
    const id = (JSON.parse(String(p?.body ?? "{}")) as { activeGymId?: unknown }).activeGymId;
    return typeof id === "string" ? id : "";
  } catch {
    return "";
  }
}

/** Reps in reserve assumed for a team set (the same as a hand-logged one, dashboard.ts MANUAL_RIR). */
const TEAM_RIR = 2;

type SetRow = { id: string; athlete_id: string; exercise_id: string; weight: number; reps: number; target: number; at: number };

/** The events one athlete's part of a team session becomes in their own account. Exported for tests. */
export function athleteEvents(
  session: { id: string; name: string; startedAt: number; endedAt: number },
  sets: readonly SetRow[],
  gymId: string,
): Record<string, unknown>[] {
  const done = sets.filter((x) => n(x.reps) > 0).sort((a, b) => n(a.at) - n(b.at) || s(a.id).localeCompare(s(b.id)));
  if (!done.length) return [];
  const sessionId = `team-${session.id}`;
  // From the athlete's first set (less a minute to get going) to their last, inside the session's own time.
  const start = Math.max(session.startedAt, n(done[0]!.at) - 60_000);
  const end = Math.max(start + 60_000, Math.min(session.endedAt, n(done[done.length - 1]!.at)));
  const seconds = Math.round((end - start) / 1000);
  return [
    {
      type: "sessionStart",
      id: `${sessionId}-start`,
      at: start,
      sessionId,
      gymId,
      minutes: Math.max(1, Math.round(seconds / 60)),
      source: "manual",
      ...(session.name ? { team: session.name } : {}),
    },
    ...done.map((x) => ({
      type: "set",
      id: `${sessionId}-${s(x.id)}`,
      at: n(x.at),
      sessionId,
      exerciseId: s(x.exercise_id),
      weight: n(x.weight),
      reps: n(x.reps),
      targetReps: n(x.target),
      targetWeight: n(x.weight),
      rir: TEAM_RIR,
    })),
    { type: "sessionEnd", id: `${sessionId}-end`, at: end, sessionId, seconds },
  ];
}

/** Writes each athlete's sets into their own account as a finished workout, once. */
async function writeWorkouts(sessionId: string): Promise<void> {
  const [r] = await query<SessionRow>("SELECT * FROM team_sessions WHERE id = ?", [sessionId]);
  if (!r || n(r.written) || r.ended_at == null) return;
  const rows = await query<SetRow>(
    "SELECT id, athlete_id, exercise_id, weight, reps, target, at FROM team_session_sets WHERE session_id = ?",
    [sessionId],
  );
  const by = new Map<string, SetRow[]>();
  for (const x of rows) by.set(s(x.athlete_id), [...(by.get(s(x.athlete_id)) ?? []), x]);
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  const team = await query<{ name: string }>("SELECT name FROM teams WHERE id = ?", [s(r.team_id)]);
  const label = s(team[0]?.name) || s(r.name);
  for (const [athlete, sets] of by) {
    const events = athleteEvents(
      { id: s(r.id), name: label, startedAt: n(r.started_at), endedAt: n(r.ended_at) },
      sets,
      await activeGym(athlete),
    );
    for (const e of events) {
      // Session "team": no device wrote it, so every one of the athlete's devices pulls it.
      stmts.push({
        sql: "INSERT OR IGNORE INTO sync_events (account_id, id, at, body, session) VALUES (?, ?, ?, ?, 'team')",
        args: [athlete, s(e.id), n(e.at), JSON.stringify(e)],
      });
    }
  }
  stmts.push({ sql: "UPDATE team_sessions SET written = 1 WHERE id = ?", args: [sessionId] });
  await batch(stmts);
}

/** For the tablet's start: each athlete's last weight and reps for each exercise, from the team's last few sessions. */
export async function lastWeights(
  coachId: string,
  teamId: unknown,
): Promise<Record<string, Record<string, { weight: number; reps: number }>> | null> {
  const team = await ownTeam(coachId, teamId);
  if (!team) return null;
  const rows = await query<SetRow>(
    `SELECT id, athlete_id, exercise_id, weight, reps, target, at FROM team_session_sets
     WHERE session_id IN (SELECT id FROM team_sessions WHERE team_id = ? ORDER BY started_at DESC LIMIT ?) AND reps > 0
     ORDER BY at`,
    [team.id, SESSION_LIMITS.lastSessions],
  );
  const out: Record<string, Record<string, { weight: number; reps: number }>> = {};
  for (const x of rows) (out[s(x.athlete_id)] ??= {})[s(x.exercise_id)] = { weight: n(x.weight), reps: n(x.reps) };
  return out;
}

/** One athlete on the live board: sets done of the plan's sets, and the exercise they're on. Never a weight. */
export interface LiveRow {
  id: string;
  name: string;
  done: number;
  total: number;
  /** The exercise their next set is on; empty when they're done. */
  on: string;
}
export interface LiveBoard {
  id: string;
  team: string;
  teamName: string;
  name: string;
  startedAt: number;
  endedAt: number | null;
  plan: TeamPlanItem[];
  rows: LiveRow[];
}

/** Where an athlete is in a plan: sets done (capped per exercise) and the exercise of their next set. */
export function progressIn(
  plan: readonly TeamPlanItem[],
  counts: ReadonlyMap<string, number>,
): { done: number; total: number; on: string } {
  let done = 0;
  let total = 0;
  let on = "";
  for (const it of plan) {
    const c = Math.min(it.sets, counts.get(it.exerciseId) ?? 0);
    done += c;
    total += it.sets;
    if (!on && c < it.sets) on = it.exerciseId;
  }
  return { done, total, on };
}

/** The board of a coach's session (the coach only), for the coach's other devices while the tablet runs it. */
export async function liveBoard(coachId: string, sessionId: unknown, now = Date.now()): Promise<LiveBoard | null> {
  if (typeof sessionId !== "string" || !ID.test(sessionId)) return null;
  const [r] = await query<SessionRow>("SELECT * FROM team_sessions WHERE id = ? AND coach_id = ?", [sessionId, coachId]);
  if (!r) return null;
  const team = await ownTeam(coachId, s(r.team_id));
  if (!team) return null;
  const plan = cleanPlan(JSON.parse(s(r.plan) || "[]")) ?? [];
  const members = await query<{ account_id: string }>("SELECT account_id FROM team_members WHERE team_id = ?", [team.id]);
  const counts = await query<{ athlete_id: string; exercise_id: string; c: number }>(
    "SELECT athlete_id, exercise_id, COUNT(*) AS c FROM team_session_sets WHERE session_id = ? AND reps > 0 GROUP BY athlete_id, exercise_id",
    [sessionId],
  );
  const by = new Map<string, Map<string, number>>();
  for (const c of counts) {
    const m = by.get(s(c.athlete_id)) ?? new Map<string, number>();
    m.set(s(c.exercise_id), n(c.c));
    by.set(s(c.athlete_id), m);
  }
  const rows: LiveRow[] = [];
  for (const m of members) {
    const id = s(m.account_id);
    rows.push({ id, name: firstName(await nameOf(id)), ...progressIn(plan, by.get(id) ?? new Map()) });
  }
  rows.sort((a, b) => b.done - a.done || a.name.localeCompare(b.name));
  const ended =
    r.ended_at == null ? (now - n(r.started_at) > SESSION_LIMITS.liveMs ? n(r.started_at) + SESSION_LIMITS.liveMs : null) : n(r.ended_at);
  return {
    id: s(r.id),
    team: team.id,
    teamName: s(team.name),
    name: s(r.name),
    startedAt: n(r.started_at),
    endedAt: ended,
    plan,
    rows,
  };
}

/** The coach's sessions still running (not ended, started in the last 12 hours), by team: Coaching shows Live board. */
export async function liveSessions(coachId: string, now = Date.now()): Promise<Record<string, string>> {
  const rows = await query<{ id: string; team_id: string }>(
    "SELECT id, team_id FROM team_sessions WHERE coach_id = ? AND ended_at IS NULL AND started_at > ? ORDER BY started_at",
    [coachId, now - SESSION_LIMITS.liveMs],
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[s(r.team_id)] = s(r.id);
  return out;
}

/**
 * Deleting an account: a coach's sessions and their sets go; an athlete's sets leave every session (the workouts
 * already written into their own account go with the account's events).
 */
export const sessionDeletes = (accountId: string) => [
  { sql: "DELETE FROM team_session_sets WHERE session_id IN (SELECT id FROM team_sessions WHERE coach_id = ?)", args: [accountId] },
  { sql: "DELETE FROM team_sessions WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM team_session_sets WHERE athlete_id = ?", args: [accountId] },
];
