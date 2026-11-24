// Season programs a coach assigns to clients or a school team (docs/decisions/coach-programs.md "Assign to clients
// and teams"). A CoachProgram's days become a weekday-bound standing plan: athletes Follow once, Today shows that
// day's routine, and the coach sees a calendar of who has done each day.
import { randomBytes } from "node:crypto";

import { isAccountId, isClient, isRoutineCode, nameOf } from "./coach";
import { query, run } from "./db";
import { notifyCoach } from "./push";
import { firstName } from "./teams";

export const ASSIGN_STATUSES = ["pending", "active", "ended"] as const;
export type AssignStatus = (typeof ASSIGN_STATUSES)[number];

/** One day in the snapshot frozen at assign time. Weekdays use JS getDay(): 0=Sun … 6=Sat. */
export interface AssignDay {
  name: string;
  code: string;
  weekdays: number[];
}

export interface ProgramAssign {
  id: string;
  coachId: string;
  clientId: string;
  programId: string;
  teamId: string | null;
  title: string;
  weeks: number;
  days: AssignDay[];
  status: AssignStatus;
  createdAt: number;
  acceptedAt: number | null;
  startedAt: number | null;
  endedAt: number | null;
}

export type AssignError = "notClient" | "bad" | "gone" | "emptyDays" | "noTargets";

export type AssignScope = { type: "clients"; ids: string[] } | { type: "allClients" } | { type: "team"; teamId: string };

export interface AssignResult {
  assigned: ProgramAssign[];
  skipped: { clientId: string; reason: AssignError | "gone" }[];
}

export type AttendanceState = "done" | "notYet" | "scheduled" | "off";

export interface CalendarPerson {
  id: string;
  name: string;
  state: AttendanceState;
}

export interface CalendarDay {
  date: string;
  dayName: string;
  dayIndex: number;
  people: CalendarPerson[];
}

interface Row {
  id: string;
  coach_id: string;
  client_id: string;
  program_id: string;
  team_id: string | null;
  title: string;
  weeks: number;
  days: string;
  status: string;
  created_at: number;
  accepted_at: number | null;
  started_at: number | null;
  ended_at: number | null;
}

interface ProgramRow {
  id: string;
  coach_id: string;
  title: string;
  weeks: number;
  days: string;
  price: number;
}

const s = (x: unknown) => String(x ?? "");
const n = (x: unknown) => Number(x ?? 0);

function cleanWeekdays(x: unknown): number[] {
  if (!Array.isArray(x)) return [];
  const out: number[] = [];
  for (const v of x) {
    if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 6 && !out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => a - b);
}

/** Days from a program's stored JSON, with optional weekday overrides from the assign call. */
export function parseAssignDays(raw: unknown, weekdaysByIndex?: unknown): AssignDay[] | null {
  if (!Array.isArray(raw) || !raw.length || raw.length > 7) return null;
  const overrides = Array.isArray(weekdaysByIndex) ? weekdaysByIndex : null;
  const out: AssignDay[] = [];
  for (let i = 0; i < raw.length; i++) {
    const d = raw[i];
    if (!d || typeof d !== "object") return null;
    const row = d as { name?: unknown; code?: unknown; weekdays?: unknown };
    const name =
      typeof row.name === "string"
        ? row.name
            .replace(/[\u0000-\u001f\u007f]/g, " ")
            .trim()
            .slice(0, 40)
        : "";
    const code = row.code;
    if (!name || !isRoutineCode(code)) return null;
    const weekdays = cleanWeekdays(overrides?.[i] ?? row.weekdays);
    if (!weekdays.length) return null;
    out.push({ name, code, weekdays });
  }
  // No two days may share a weekday (Today picks the first match).
  const seen = new Set<number>();
  for (const d of out) {
    for (const w of d.weekdays) {
      if (seen.has(w)) return null;
      seen.add(w);
    }
  }
  return out;
}

function shape(r: Row): ProgramAssign {
  let days: AssignDay[] = [];
  try {
    days = parseAssignDays(JSON.parse(String(r.days))) ?? [];
  } catch {
    days = [];
  }
  const status = (ASSIGN_STATUSES as readonly string[]).includes(String(r.status)) ? (String(r.status) as AssignStatus) : "ended";
  return {
    id: s(r.id),
    coachId: s(r.coach_id),
    clientId: s(r.client_id),
    programId: s(r.program_id),
    teamId: r.team_id ? s(r.team_id) : null,
    title: s(r.title),
    weeks: n(r.weeks),
    days,
    status,
    createdAt: n(r.created_at),
    acceptedAt: r.accepted_at == null ? null : n(r.accepted_at),
    startedAt: r.started_at == null ? null : n(r.started_at),
    endedAt: r.ended_at == null ? null : n(r.ended_at),
  };
}

/** Exercise ids in a routine share code (same shape as coachPrograms.countCode). */
export function exerciseIdsFromCode(code: string): string[] {
  const ids: string[] = [];
  for (const seg of code.split("~").slice(2)) {
    const m = /^([\w-]+)\.(\d+)/.exec(seg);
    if (m?.[1]) ids.push(m[1]);
  }
  return ids;
}

async function resolveClients(coachId: string, scope: AssignScope): Promise<string[]> {
  if (scope.type === "allClients") {
    const rows = await query<{ id: string }>("SELECT client_id AS id FROM coach_links WHERE coach_id = ? ORDER BY created_at", [coachId]);
    return rows.map((r) => s(r.id));
  }
  if (scope.type === "clients") {
    const out: string[] = [];
    for (const id of scope.ids) {
      if (isAccountId(id) && (await isClient(coachId, id))) out.push(id);
    }
    return out;
  }
  const [team] = await query<{ id: string; coach_id: string }>("SELECT id, coach_id FROM teams WHERE id = ?", [scope.teamId]);
  if (!team || s(team.coach_id) !== coachId) return [];
  const members = await query<{ id: string }>("SELECT account_id AS id FROM team_members WHERE team_id = ?", [scope.teamId]);
  return members.map((m) => s(m.id));
}

/** End any open assign from this coach to this client (one active season program at a time). */
async function endOpen(coachId: string, clientId: string, now: number, except?: string): Promise<void> {
  const rows = await query<{ id: string; title: string }>(
    `SELECT id, title FROM coach_program_assigns
     WHERE coach_id = ? AND client_id = ? AND status IN ('pending', 'active')${except ? " AND id != ?" : ""}`,
    except ? [coachId, clientId, except] : [coachId, clientId],
  );
  for (const r of rows) {
    await run("UPDATE coach_program_assigns SET status = 'ended', ended_at = ? WHERE id = ?", [now, s(r.id)]);
    await notifyCoach(clientId, "coachProgramAssignEnd", { name: await nameOf(coachId), text: s(r.title) }, "#/today");
  }
}

/**
 * Assign a coach's program to clients, every client, or a school team. Snapshots days (and weekdays) so later edits
 * don't rewrite an in-flight season. Never creates paid program_owners.
 */
export async function assignProgram(
  coachId: string,
  programId: unknown,
  scope: AssignScope,
  weekdaysByIndex?: unknown,
  now = Date.now(),
): Promise<AssignResult | { error: AssignError }> {
  if (typeof programId !== "string" || !programId) return { error: "bad" };
  const [prog] = await query<ProgramRow>("SELECT id, coach_id, title, weeks, days, price FROM coach_programs WHERE id = ?", [programId]);
  if (!prog || s(prog.coach_id) !== coachId) return { error: "gone" };
  let rawDays: unknown;
  try {
    rawDays = JSON.parse(String(prog.days));
  } catch {
    return { error: "emptyDays" };
  }
  const days = parseAssignDays(rawDays, weekdaysByIndex);
  if (!days?.length) return { error: "emptyDays" };
  const clients = await resolveClients(coachId, scope);
  if (!clients.length) return { error: "noTargets" };
  const teamId = scope.type === "team" ? scope.teamId : null;
  const daysJson = JSON.stringify(days);
  const title = s(prog.title).slice(0, 60);
  const weeks = Math.min(16, Math.max(1, n(prog.weeks)));
  const assigned: ProgramAssign[] = [];
  const skipped: AssignResult["skipped"] = [];
  const coachName = await nameOf(coachId);

  for (const clientId of clients) {
    if (!(await isClient(coachId, clientId))) {
      skipped.push({ clientId, reason: "notClient" });
      continue;
    }
    await endOpen(coachId, clientId, now);
    const id = randomBytes(9).toString("base64url");
    await run(
      `INSERT INTO coach_program_assigns
       (id, coach_id, client_id, program_id, team_id, title, weeks, days, status, created_at, accepted_at, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, NULL, NULL)`,
      [id, coachId, clientId, s(prog.id), teamId, title, weeks, daysJson, now],
    );
    // Free listed programs may grant ownership so "From coaches" stays consistent; paid never does (teens can't buy).
    if (n(prog.price) === 0) {
      await run("INSERT OR IGNORE INTO program_owners (program_id, account_id, at, payment_id) VALUES (?, ?, ?, NULL)", [
        s(prog.id),
        clientId,
        now,
      ]);
    }
    await notifyCoach(clientId, "coachProgramAssign", { name: coachName, text: title }, "#/today");
    assigned.push(
      shape({
        id,
        coach_id: coachId,
        client_id: clientId,
        program_id: s(prog.id),
        team_id: teamId,
        title,
        weeks,
        days: daysJson,
        status: "pending",
        created_at: now,
        accepted_at: null,
        started_at: null,
        ended_at: null,
      }),
    );
  }
  return { assigned, skipped };
}

/** The client accepts: standing plan starts. */
export async function acceptProgramAssign(
  clientId: string,
  assignId: unknown,
  now = Date.now(),
): Promise<ProgramAssign | { error: AssignError }> {
  if (typeof assignId !== "string") return { error: "bad" };
  const [row] = await query<Row>("SELECT * FROM coach_program_assigns WHERE id = ? AND client_id = ?", [assignId, clientId]);
  if (!row) return { error: "gone" };
  if (s(row.status) === "ended") return { error: "gone" };
  if (s(row.status) === "active") return shape(row);
  await endOpen(s(row.coach_id), clientId, now, s(row.id));
  await run("UPDATE coach_program_assigns SET status = 'active', accepted_at = ?, started_at = ? WHERE id = ?", [now, now, s(row.id)]);
  return shape({ ...row, status: "active", accepted_at: now, started_at: now });
}

/** Coach takes back one assign, or the client dismisses. */
export async function endProgramAssign(
  accountId: string,
  assignId: unknown,
  now = Date.now(),
): Promise<ProgramAssign | { error: AssignError }> {
  if (typeof assignId !== "string") return { error: "bad" };
  const [row] = await query<Row>("SELECT * FROM coach_program_assigns WHERE id = ?", [assignId]);
  if (!row) return { error: "gone" };
  if (s(row.coach_id) !== accountId && s(row.client_id) !== accountId) return { error: "gone" };
  if (s(row.status) === "ended") return shape(row);
  await run("UPDATE coach_program_assigns SET status = 'ended', ended_at = ? WHERE id = ?", [now, s(row.id)]);
  if (s(row.coach_id) === accountId) {
    await notifyCoach(s(row.client_id), "coachProgramAssignEnd", { name: await nameOf(accountId), text: s(row.title) }, "#/today");
  }
  return shape({ ...row, status: "ended", ended_at: now });
}

/** End every open assign for a program (or team) belonging to this coach. */
export async function endProgramAssigns(coachId: string, opts: { programId?: string; teamId?: string }, now = Date.now()): Promise<number> {
  const clauses = ["coach_id = ?", "status IN ('pending', 'active')"];
  const args: (string | number)[] = [coachId];
  if (opts.programId) {
    clauses.push("program_id = ?");
    args.push(opts.programId);
  }
  if (opts.teamId) {
    clauses.push("team_id = ?");
    args.push(opts.teamId);
  }
  const rows = await query<Row>(`SELECT * FROM coach_program_assigns WHERE ${clauses.join(" AND ")}`, args);
  const coachName = await nameOf(coachId);
  for (const r of rows) {
    await run("UPDATE coach_program_assigns SET status = 'ended', ended_at = ? WHERE id = ?", [now, s(r.id)]);
    await notifyCoach(s(r.client_id), "coachProgramAssignEnd", { name: coachName, text: s(r.title) }, "#/today");
  }
  return rows.length;
}

/** Assigns visible to this account: as client (pending/active), or as coach for a client. */
export async function assignsForClient(clientId: string): Promise<ProgramAssign[]> {
  const rows = await query<Row>(
    `SELECT * FROM coach_program_assigns WHERE client_id = ? AND status IN ('pending', 'active') ORDER BY created_at DESC`,
    [clientId],
  );
  return rows.map(shape);
}

export async function assignsForPair(coachId: string, clientId: string): Promise<ProgramAssign[]> {
  const rows = await query<Row>(
    `SELECT * FROM coach_program_assigns WHERE coach_id = ? AND client_id = ? AND status IN ('pending', 'active', 'ended')
     ORDER BY created_at DESC LIMIT 20`,
    [coachId, clientId],
  );
  return rows.map(shape);
}

export async function assignsForProgram(coachId: string, programId: string): Promise<ProgramAssign[]> {
  const rows = await query<Row>(
    `SELECT * FROM coach_program_assigns WHERE coach_id = ? AND program_id = ? AND status IN ('pending', 'active')
     ORDER BY created_at DESC`,
    [coachId, programId],
  );
  return rows.map(shape);
}

export async function assignsForTeam(coachId: string, teamId: string): Promise<ProgramAssign[]> {
  const rows = await query<Row>(
    `SELECT * FROM coach_program_assigns WHERE coach_id = ? AND team_id = ? AND status IN ('pending', 'active')
     ORDER BY created_at DESC`,
    [coachId, teamId],
  );
  return rows.map(shape);
}

const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Sessions in [from, to) with the exercise ids trained that day (from synced events). */
async function sessionsByDay(accountId: string, from: number, to: number): Promise<Map<string, Set<string>[]>> {
  const rows = await query<{ body: string; at: number }>(
    `SELECT body, at FROM sync_events WHERE account_id = ? AND body IS NOT NULL AND at >= ? AND at < ?
     ORDER BY at`,
    [accountId, from, to],
  );
  const starts = new Map<string, number>();
  const sets = new Map<string, Set<string>>();
  const ends = new Set<string>();
  for (const r of rows) {
    let body: { type?: string; sessionId?: string; exerciseId?: string };
    try {
      body = JSON.parse(String(r.body)) as typeof body;
    } catch {
      continue;
    }
    const sid = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!sid) continue;
    if (body.type === "sessionStart") starts.set(sid, n(r.at));
    if (body.type === "sessionEnd") ends.add(sid);
    if (body.type === "set" && typeof body.exerciseId === "string") {
      const bag = sets.get(sid) ?? new Set();
      bag.add(body.exerciseId);
      sets.set(sid, bag);
    }
  }
  const byDay = new Map<string, Set<string>[]>();
  for (const sid of ends) {
    const at = starts.get(sid) ?? 0;
    if (!at) continue;
    const ex = sets.get(sid);
    if (!ex?.size) continue;
    const key = dayKey(at);
    const list = byDay.get(key) ?? [];
    list.push(ex);
    byDay.set(key, list);
  }
  return byDay;
}

function matched(want: readonly string[], trained: Set<string>): boolean {
  if (!want.length) return false;
  const hit = want.filter((id) => trained.has(id)).length;
  return hit >= Math.ceil(want.length * 0.6);
}

/**
 * Month calendar for a team or a program cohort: each programmed day lists who is done / not yet / scheduled / off.
 * Names are first names only (school-team privacy). Never returns weights.
 */
export async function programCalendar(
  coachId: string,
  opts: { teamId?: string; programId?: string; year: number; month: number },
  now = Date.now(),
): Promise<{ title: string; weeks: number; days: CalendarDay[]; assigns: ProgramAssign[] } | { error: AssignError }> {
  const { year, month } = opts;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return { error: "bad" };
  let assigns: ProgramAssign[] = [];
  if (opts.teamId) {
    const [team] = await query<{ coach_id: string }>("SELECT coach_id FROM teams WHERE id = ?", [opts.teamId]);
    if (!team || s(team.coach_id) !== coachId) return { error: "gone" };
    assigns = await assignsForTeam(coachId, opts.teamId);
  } else if (opts.programId) {
    assigns = await assignsForProgram(coachId, opts.programId);
  } else return { error: "bad" };
  if (!assigns.length) return { error: "gone" };

  // Prefer an active assign's snapshot; fall back to the newest.
  const template = assigns.find((a) => a.status === "active") ?? assigns[0]!;
  const from = new Date(year, month, 1).getTime();
  const to = new Date(year, month + 1, 1).getTime();
  const todayKey = dayKey(now);

  const byClient = new Map<string, ProgramAssign>();
  for (const a of assigns) byClient.set(a.clientId, a);

  const sessions = new Map<string, Map<string, Set<string>[]>>();
  for (const clientId of byClient.keys()) {
    sessions.set(clientId, await sessionsByDay(clientId, from, to));
  }

  const weekdayToDay = new Map<number, { index: number; name: string; ids: string[] }>();
  template.days.forEach((d, index) => {
    const ids = exerciseIdsFromCode(d.code);
    for (const w of d.weekdays) weekdayToDay.set(w, { index, name: d.name, ids });
  });

  const out: CalendarDay[] = [];
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) break;
    const wd = d.getDay();
    const mapped = weekdayToDay.get(wd);
    if (!mapped) continue;
    const key = dayKey(d.getTime());
    const people: CalendarPerson[] = [];
    for (const [clientId, assign] of byClient) {
      const name = firstName(await nameOf(clientId));
      if (assign.status === "pending" || assign.status === "ended") {
        people.push({ id: clientId, name, state: "off" });
        continue;
      }
      const start = assign.startedAt ?? assign.createdAt;
      const end = start + assign.weeks * 7 * 86_400_000;
      if (d.getTime() < start || d.getTime() >= end) {
        people.push({ id: clientId, name, state: "off" });
        continue;
      }
      const daySessions = sessions.get(clientId)?.get(key) ?? [];
      const done = daySessions.some((ex) => matched(mapped.ids, ex));
      if (done) people.push({ id: clientId, name, state: "done" });
      else if (key > todayKey) people.push({ id: clientId, name, state: "scheduled" });
      else people.push({ id: clientId, name, state: "notYet" });
    }
    people.sort((a, b) => a.name.localeCompare(b.name));
    out.push({ date: key, dayName: mapped.name, dayIndex: mapped.index, people });
  }

  return { title: template.title, weeks: template.weeks, days: out, assigns };
}

/** Account deletion / unlink cleanup. */
export const programAssignCleanup = (accountId: string) => [
  { sql: "DELETE FROM coach_program_assigns WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
];

export const programAssignUnlink = (coachId: string, clientId: string) => [
  { sql: "DELETE FROM coach_program_assigns WHERE coach_id = ? AND client_id = ?", args: [coachId, clientId] },
];
