import { createHash, randomBytes } from "node:crypto";

// The coach's calendar (docs/decisions/trainer-mode.md "Assign workouts by date"). One cell per coach, scope and civil date:
// a routine share code, or rest. `all` reaches every client. `team:<id>` reaches that team. `client:<id>` reaches
// one client. Today asks for the next couple of weeks and picks the most specific cell.
import { decodeRoutine } from "@/lib/routineShare";
import { dateAllowed, shiftDay, utcDay, type ScheduleCell, type ScheduleKind } from "@/lib/scheduleDays";

import { isAccountId, isClient, isRoutineCode, nameOf, roleOf } from "./coach";
import { batch, query, run } from "./db";
import { ownTeam } from "./teams";

export type ScheduleError = "bad" | "gone" | "horizon";

const SCOPE_TEAM = /^team:([2-9A-HJ-NP-Z]{8})$/;
const SCOPE_CLIENT = /^client:([\w-]{1,80})$/;

const s = (x: unknown) => String(x ?? "");
const n = (x: unknown) => Number(x ?? 0);

interface Row {
  coach_id: string;
  scope: string;
  date: string;
  kind: string;
  name: string;
  code: string;
  updated_at: number;
}

function cell(r: Row): ScheduleCell {
  const kind: ScheduleKind = r.kind === "rest" ? "rest" : "workout";
  return {
    date: s(r.date),
    kind,
    name: s(r.name),
    code: s(r.code),
    coachId: s(r.coach_id),
    scope: s(r.scope),
    updatedAt: n(r.updated_at),
  };
}

async function canSchedule(coachId: string): Promise<boolean> {
  const [a] = await query<{ account_id: string }>("SELECT account_id FROM coach_accounts WHERE account_id = ?", [coachId]);
  if (a || (await roleOf(coachId))) return true;
  const [c] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_links WHERE coach_id = ? LIMIT 1", [coachId]);
  return !!c;
}

/** The scope is one this coach may write. */
async function scopeOk(coachId: string, scope: string): Promise<boolean> {
  if (scope === "all") return canSchedule(coachId);
  const team = SCOPE_TEAM.exec(scope);
  if (team) return !!(await ownTeam(coachId, team[1]));
  const client = SCOPE_CLIENT.exec(scope);
  if (client && isAccountId(client[1])) return isClient(coachId, client[1]);
  return false;
}

function cleanName(x: unknown): string {
  return typeof x === "string"
    ? x
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, 40)
    : "";
}

export async function scheduleMonth(
  coachId: string,
  scope: unknown,
  year: unknown,
  month: unknown,
): Promise<{ scope: string; days: ScheduleCell[] } | { error: ScheduleError }> {
  if (typeof scope !== "string" || !(await scopeOk(coachId, scope))) return { error: "gone" };
  if (year == null || month == null) return { error: "bad" };
  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 0 || m > 11 || y < 2020 || y > 2100) return { error: "bad" };
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const to = m === 11 ? `${y + 1}-01-01` : `${y}-${String(m + 2).padStart(2, "0")}-01`;
  const rows = await query<Row>(
    "SELECT * FROM coach_schedule_days WHERE coach_id = ? AND scope = ? AND date >= ? AND date < ? ORDER BY date",
    [coachId, scope, from, to],
  );
  return { scope, days: rows.map(cell) };
}

export async function setScheduleDay(
  coachId: string,
  scope: unknown,
  date: unknown,
  kind: unknown,
  name: unknown,
  code: unknown,
  now = Date.now(),
): Promise<ScheduleCell | { error: ScheduleError }> {
  if (typeof scope !== "string" || !(await scopeOk(coachId, scope))) return { error: "gone" };
  if (typeof date !== "string" || !dateAllowed(date, now)) return { error: "horizon" };
  if (kind !== "workout" && kind !== "rest") return { error: "bad" };
  const rest = kind === "rest";
  const title = cleanName(name);
  if (!rest && (!title || !isRoutineCode(code) || !decodeRoutine(code))) return { error: "bad" };
  const [saved] = await query<Row>(
    `INSERT INTO coach_schedule_days (coach_id, scope, date, kind, name, code, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (coach_id, scope, date) DO UPDATE SET
       updated_at = CASE WHEN kind = excluded.kind AND name = excluded.name AND code = excluded.code
                         THEN updated_at ELSE excluded.updated_at END,
       kind = excluded.kind, name = excluded.name, code = excluded.code
     RETURNING *`,
    [coachId, scope, date, rest ? "rest" : "workout", rest ? "" : title, rest ? "" : String(code), now],
  );
  if (!saved) throw new Error("Schedule assignment was not saved");
  return cell(saved);
}

export async function clearScheduleDay(
  coachId: string,
  scope: unknown,
  date: unknown,
  now = Date.now(),
): Promise<{ ok: true } | { error: ScheduleError }> {
  if (typeof scope !== "string" || !(await scopeOk(coachId, scope))) return { error: "gone" };
  if (typeof date !== "string" || !dateAllowed(date, now)) return { error: "horizon" };
  await run("DELETE FROM coach_schedule_days WHERE coach_id = ? AND scope = ? AND date = ?", [coachId, scope, date]);
  return { ok: true };
}

/** The days an athlete might be on for the next two weeks, from every coach and team they're on. */
export function upcomingSchedule(accountId: string, now = Date.now()): Promise<ScheduleCell[]> {
  return athleteSchedule(accountId, shiftDay(utcDay(now), -1), shiftDay(utcDay(now), 16));
}

export async function athleteSchedule(accountId: string, from: string, to: string): Promise<ScheduleCell[]> {
  const rows = await query<Row>(
    `SELECT d.* FROM coach_schedule_days d WHERE d.date BETWEEN ? AND ? AND (
      EXISTS (SELECT 1 FROM coach_links l WHERE l.coach_id = d.coach_id AND l.client_id = ?
        AND (d.scope = 'all' OR d.scope = ?))
      OR EXISTS (SELECT 1 FROM teams t JOIN team_members m ON m.team_id = t.id
        WHERE d.scope = 'team:' || t.id AND t.coach_id = d.coach_id AND m.account_id = ?)
    )`,
    [from, to, accountId, `client:${accountId}`, accountId],
  );
  return rows.map(cell);
}

interface AccessRow {
  id: string;
  owner_id: string;
  assistant_id: string | null;
  scope: string;
}
const inviteId = (code: string) => createHash("sha256").update(code).digest("hex");

export async function inviteCalendarAssistant(owner: string, scope: unknown) {
  if (typeof scope !== "string" || !(await scopeOk(owner, scope))) return null;
  const code = randomBytes(24).toString("hex");
  const now = Date.now();
  await batch([
    { sql: "DELETE FROM coach_calendar_access WHERE owner_id = ? AND scope = ? AND assistant_id IS NULL", args: [owner, scope] },
    {
      sql: "INSERT INTO coach_calendar_access (id, owner_id, scope, expires_at) VALUES (?, ?, ?, ?)",
      args: [inviteId(code), owner, scope, now + 7 * 86400_000],
    },
  ]);
  return code;
}

export async function acceptCalendarInvite(assistant: string, code: unknown) {
  if (typeof code !== "string" || !/^[a-f0-9]{48}$/.test(code)) return false;
  return (
    (await run(
      "UPDATE coach_calendar_access SET assistant_id = ? WHERE id = ? AND owner_id <> ? AND assistant_id IS NULL AND expires_at > ?",
      [assistant, inviteId(code), assistant, Date.now()],
    )) === 1
  );
}

export async function calendarAccess(account: string) {
  const rows = await query<AccessRow>(
    "SELECT id, owner_id, assistant_id, scope FROM coach_calendar_access WHERE assistant_id = ? OR (owner_id = ? AND (assistant_id IS NOT NULL OR expires_at > ?))",
    [account, account, Date.now()],
  );
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      own: r.owner_id === account,
      scope: r.scope,
      name: r.owner_id === account ? (r.assistant_id ? await nameOf(r.assistant_id) : null) : await nameOf(r.owner_id),
    })),
  );
}

export async function revokeCalendarAccess(account: string, id: unknown) {
  if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) return;
  await run("DELETE FROM coach_calendar_access WHERE id = ? AND (owner_id = ? OR assistant_id = ?)", [id, account, account]);
}

export async function calendarOwner(account: string, access: unknown, scope: unknown) {
  if (access == null) return account;
  if (typeof access !== "string" || !/^[a-f0-9]{64}$/.test(access) || typeof scope !== "string") return null;
  const [row] = await query<AccessRow>("SELECT owner_id FROM coach_calendar_access WHERE id = ? AND assistant_id = ? AND scope = ?", [
    access,
    account,
    scope,
  ]);
  return row?.owner_id ?? null;
}

/** Roster activity for the lead coach. Calendar assistants use the calendar-only API. */
export async function trainingActivity(coach: string, now = Date.now()) {
  const rows = await query<{ client_id: string; workouts: number; last_at: number | null }>(
    `SELECT l.client_id, COUNT(DISTINCT json_extract(e.body, '$.sessionId')) AS workouts, MAX(e.at) AS last_at
     FROM coach_links l
     LEFT JOIN sync_events e ON e.account_id = l.client_id AND e.at >= ? AND e.at <= ?
       AND CASE WHEN json_valid(e.body) THEN json_extract(e.body, '$.type') = 'sessionEnd' AND json_type(e.body, '$.sessionId') = 'text' ELSE 0 END
     WHERE l.coach_id = ?
     GROUP BY l.client_id
     ORDER BY last_at ASC, l.client_id ASC`,
    [now - 28 * 86400_000, now, coach],
  );
  return Promise.all(
    rows.map(async (r) => ({
      id: r.client_id,
      name: await nameOf(r.client_id),
      workouts: Number(r.workouts),
      lastAt: r.last_at == null ? null : Number(r.last_at),
    })),
  );
}
