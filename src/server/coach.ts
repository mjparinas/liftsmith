// Trainer mode (Melvin, 2026-11-11: "coaches build programs for clients and see client results"). A coach
// makes an invite code; a client enters it, sees what the coach will see, and agrees. From then on the coach
// can read the client's workouts from their synced account: sets, sessions, feedback and their own exercises,
// with every field that isn't training taken out (heart rate, readiness, injuries, notes, gyms). Nothing
// else in the event log ever leaves (health readings, body weight, measurements, cycle, pain, photos).
// Either side can unlink at any time, which cuts access at once. Out of Labs (2026-11-12): a coach can also say what
// their new clients start setup with (goal, experience, days a week), and leave each client one note.
// Decision record: docs/decisions/trainer-mode.md.
import { randomBytes } from "node:crypto";

import { batch, query, rateLimit, run } from "./db";

export const COACH_LIMITS = {
  /** Clients per coach, until there's a coach plan (docs/decisions/trainer-mode.md). */
  clients: 30,
  /** Coaches per client. */
  coaches: 3,
  /** An invite code lasts a week. */
  inviteMs: 7 * 86_400_000,
  /** Codes tried (preview or join) per account per hour, so codes can't be guessed. */
  triesPerHour: 20,
  /** How far back a coach sees. */
  historyMs: 365 * 86_400_000,
  /** Events sent to a coach at most, newest first. */
  events: 30_000,
  /** Routines a coach can assign to one client at a time. */
  plans: 10,
  /** Characters in a coach's note to a client. */
  note: 500,
};

/** No 0/O or 1/I, so a code read aloud or off a screen is typed right: 32 letters, 8 of them (40 bits). */
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newCode(bytes: Buffer = randomBytes(8)): string {
  return [...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}
/** A typed code, tidied: upper case, spaces and dashes gone. Empty when it can't be a code. */
export function cleanCode(x: unknown): string {
  if (typeof x !== "string") return "";
  const c = x.toUpperCase().replace(/[\s-]/g, "");
  return /^[2-9A-HJ-NP-Z]{8}$/.test(c) ? c : "";
}
export const isAccountId = (x: unknown): x is string => typeof x === "string" && /^[\w-]{1,80}$/.test(x);

export interface Person {
  id: string;
  name: string;
  since: number;
}
export interface Invite {
  code: string;
  expiresAt: number;
}

/** The name on someone's synced profile, or "" (the app then says "No name yet"). */
async function nameOf(accountId: string): Promise<string> {
  const [r] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  try {
    const name = (JSON.parse(String(r?.body ?? "{}")) as { name?: unknown }).name;
    return typeof name === "string" ? name.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}

async function people(rows: { id: string; since: number }[]): Promise<Person[]> {
  return Promise.all(rows.map(async (r) => ({ id: String(r.id), since: Number(r.since), name: await nameOf(String(r.id)) })));
}

/** A routine a coach assigned to a client. `code` is a routine share code (src/lib/routineShare.ts). */
export interface Plan {
  id: string;
  coachId: string;
  clientId: string;
  name: string;
  code: string;
  at: number;
}
type PlanRow = { id: string; coach_id: string; client_id: string; name: string; code: string; created_at: number };
const plan = (r: PlanRow): Plan => ({
  id: String(r.id),
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  name: String(r.name),
  code: String(r.code),
  at: Number(r.created_at),
});

/** What a coach's new clients start setup with, so an invited client skips those questions. Any part may be unset. */
export interface Setup {
  goal?: "muscle" | "strength" | "general";
  experience?: "new" | "intermediate" | "advanced";
  days?: number;
}
const GOALS = ["muscle", "strength", "general"] as const;
const LEVELS = ["new", "intermediate", "advanced"] as const;

/** A setup as sent by the app, with anything that isn't a known answer left out. */
export function cleanSetup(x: unknown): Setup {
  const r = x && typeof x === "object" ? (x as Record<string, unknown>) : {};
  const out: Setup = {};
  const goal = GOALS.find((g) => g === r.goal);
  const experience = LEVELS.find((l) => l === r.experience);
  if (goal) out.goal = goal;
  if (experience) out.experience = experience;
  if (typeof r.days === "number" && Number.isInteger(r.days) && r.days >= 1 && r.days <= 7) out.days = r.days;
  return out;
}

export async function setupOf(coachId: string): Promise<Setup> {
  const [r] = await query<{ goal: string | null; experience: string | null; days: number | null }>(
    "SELECT goal, experience, days FROM coach_defaults WHERE coach_id = ?",
    [coachId],
  );
  return r ? cleanSetup({ goal: r.goal, experience: r.experience, days: r.days === null ? undefined : Number(r.days) }) : {};
}

export async function saveSetup(coachId: string, raw: unknown, now = Date.now()): Promise<Setup> {
  const s = cleanSetup(raw);
  await run(
    `INSERT INTO coach_defaults (coach_id, goal, experience, days, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (coach_id) DO UPDATE SET goal = excluded.goal, experience = excluded.experience, days = excluded.days, updated_at = excluded.updated_at`,
    [coachId, s.goal ?? null, s.experience ?? null, s.days ?? null, now],
  );
  return s;
}

/** A note from a coach to one client: plain text, shown on the client's Today and under Coaching. */
export interface Note {
  coachId: string;
  clientId: string;
  text: string;
  at: number;
}
type NoteRow = { coach_id: string; client_id: string; body: string; updated_at: number };
const note = (r: NoteRow): Note => ({
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  text: String(r.body),
  at: Number(r.updated_at),
});

/** A note's text, tidied: control characters out (line breaks stay, at most two in a row), trimmed and capped. */
export function cleanNote(x: unknown): string {
  if (typeof x !== "string") return "";
  return x
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, COACH_LIMITS.note)
    .trim();
}

/** The coach writes (or, with empty text, clears) their note to a client. Only for the coach's own clients. */
export async function setNote(
  coachId: string,
  clientId: unknown,
  text: unknown,
  now = Date.now(),
): Promise<Note | null | { error: "notClient" }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  const body = cleanNote(text);
  if (!body) {
    await run("DELETE FROM coach_notes WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
    return null;
  }
  await run(
    `INSERT INTO coach_notes (coach_id, client_id, body, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
    [coachId, clientId, body, now],
  );
  return { coachId, clientId, text: body, at: now };
}

export async function overview(
  accountId: string,
  now = Date.now(),
): Promise<{ invite: Invite | null; clients: Person[]; coaches: Person[]; plans: Plan[]; notes: Note[]; setup: Setup }> {
  const [inv] = await query<{ code: string; expires_at: number }>(
    "SELECT code, expires_at FROM coach_invites WHERE coach_id = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
    [accountId, now],
  );
  const clients = await query<{ id: string; since: number }>(
    "SELECT client_id AS id, created_at AS since FROM coach_links WHERE coach_id = ? ORDER BY created_at",
    [accountId],
  );
  const coaches = await query<{ id: string; since: number }>(
    "SELECT coach_id AS id, created_at AS since FROM coach_links WHERE client_id = ? ORDER BY created_at",
    [accountId],
  );
  // The routines this lifter's coaches assigned to them.
  const plans = await query<PlanRow>("SELECT * FROM coach_plans WHERE client_id = ? ORDER BY created_at DESC", [accountId]);
  // The notes this lifter's coaches left them, newest first.
  const notes = await query<NoteRow>("SELECT * FROM coach_notes WHERE client_id = ? ORDER BY updated_at DESC", [accountId]);
  return {
    invite: inv ? { code: String(inv.code), expiresAt: Number(inv.expires_at) } : null,
    clients: await people(clients),
    coaches: await people(coaches),
    plans: plans.map(plan),
    notes: notes.map(note),
    setup: await setupOf(accountId),
  };
}

/** A fresh invite code for this coach. The old one stops working. */
export async function makeInvite(coachId: string, now = Date.now(), code = newCode()): Promise<Invite> {
  const expiresAt = now + COACH_LIMITS.inviteMs;
  await batch([
    { sql: "DELETE FROM coach_invites WHERE coach_id = ? OR expires_at <= ?", args: [coachId, now] },
    {
      sql: "INSERT INTO coach_invites (code, coach_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
      args: [code, coachId, now, expiresAt],
    },
  ]);
  return { code, expiresAt };
}

export async function cancelInvite(coachId: string): Promise<void> {
  await run("DELETE FROM coach_invites WHERE coach_id = ?", [coachId]);
}

export type JoinError = "slow" | "unknown" | "self" | "full" | "coachFull";

/**
 * Who a code belongs to, so the client can see whose it is before agreeing, and what the coach's new clients start
 * setup with. Counts as a try.
 */
export async function previewInvite(
  accountId: string,
  raw: unknown,
  now = Date.now(),
): Promise<{ coach: Person; setup: Setup } | { error: JoinError }> {
  if (!(await rateLimit(`coach:${accountId}`, COACH_LIMITS.triesPerHour, 3_600_000, now))) return { error: "slow" };
  const code = cleanCode(raw);
  if (!code) return { error: "unknown" };
  const [inv] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_invites WHERE code = ? AND expires_at > ?", [code, now]);
  if (!inv) return { error: "unknown" };
  const coachId = String(inv.coach_id);
  if (coachId === accountId) return { error: "self" };
  return { coach: { id: coachId, name: await nameOf(coachId), since: now }, setup: await setupOf(coachId) };
}

/** The client agrees: links them to the code's coach. Joining twice is fine. */
export async function joinCoach(
  clientId: string,
  raw: unknown,
  now = Date.now(),
): Promise<{ coach: Person; setup: Setup } | { error: JoinError }> {
  const seen = await previewInvite(clientId, raw, now);
  if ("error" in seen) return seen;
  const coachId = seen.coach.id;
  const [had] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ? AND client_id = ?", [
    coachId,
    clientId,
  ]);
  if (Number(had?.n ?? 0) > 0) return seen;
  const [mine] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE client_id = ?", [clientId]);
  if (Number(mine?.n ?? 0) >= COACH_LIMITS.coaches) return { error: "full" };
  const [theirs] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ?", [coachId]);
  if (Number(theirs?.n ?? 0) >= COACH_LIMITS.clients) return { error: "coachFull" };
  await run("INSERT OR IGNORE INTO coach_links (coach_id, client_id, created_at) VALUES (?, ?, ?)", [coachId, clientId, now]);
  return { ...seen, coach: { ...seen.coach, since: now } };
}

/** Either side ends it: a coach drops a client, or a client leaves a coach. The coach's routines and note for them go too. */
export async function unlink(accountId: string, otherId: string): Promise<void> {
  const pair = [accountId, otherId, otherId, accountId];
  await batch([
    { sql: "DELETE FROM coach_links WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_plans WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_notes WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
  ]);
}

/** A routine share code as the app writes it (r1~name~exercise.sets[.s]~…), checked loosely: the app decodes it. */
export const isRoutineCode = (x: unknown): x is string => typeof x === "string" && x.length <= 2000 && /^r1~[\w.~-]+$/.test(x);

export type PlanError = "notClient" | "bad" | "full";

/** A coach gives a client a routine. It shows on the client's phone under Coaching, ready to save and start. */
export async function assignPlan(
  coachId: string,
  clientId: unknown,
  name: unknown,
  code: unknown,
  now = Date.now(),
  id = randomBytes(9).toString("base64url"),
): Promise<Plan | { error: PlanError }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  const title =
    typeof name === "string"
      ? name
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .trim()
          .slice(0, 60)
      : "";
  if (!title || !isRoutineCode(code)) return { error: "bad" };
  const [c] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_plans WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  if (Number(c?.n ?? 0) >= COACH_LIMITS.plans) return { error: "full" };
  await run("INSERT INTO coach_plans (id, coach_id, client_id, name, code, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    id,
    coachId,
    clientId,
    title,
    code,
    now,
  ]);
  return { id, coachId, clientId, name: title, code, at: now };
}

/** The coach takes a routine back. */
export async function removePlan(coachId: string, id: unknown): Promise<void> {
  if (typeof id === "string") await run("DELETE FROM coach_plans WHERE id = ? AND coach_id = ?", [id, coachId]);
}

export async function isClient(coachId: string, clientId: string): Promise<boolean> {
  const [r] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return Number(r?.n ?? 0) > 0;
}

// What a coach may see of each event, field by field. Anything not listed never leaves the server.
const KEEP: Record<string, readonly string[]> = {
  set: [
    "sessionId",
    "exerciseId",
    "weight",
    "reps",
    "targetReps",
    "targetWeight",
    "distanceM",
    "powerW",
    "rir",
    "challenge",
    "amrap",
    "slot",
    "superset",
    "implements",
    "repsL",
    "repsR",
    "tag",
  ],
  sessionStart: ["sessionId", "minutes", "source", "program", "routine", "challenge"],
  sessionEnd: ["sessionId", "seconds", "workSec", "restSec", "auto"],
  feedback: ["sessionId", "exerciseId", "rating"],
  effort: ["setId", "rir"],
  swap: ["sessionId", "from", "to"],
  customExercise: ["exercise"],
};
export const COACH_TYPES = Object.keys(KEEP);

/** The coach's copy of one event: only training fields, or null for anything a coach doesn't see. */
export function forCoach(e: unknown): Record<string, unknown> | null {
  if (!e || typeof e !== "object") return null;
  const ev = e as Record<string, unknown>;
  const keep = typeof ev.type === "string" ? KEEP[ev.type] : undefined;
  if (!keep || typeof ev.id !== "string" || typeof ev.at !== "number") return null;
  // A set done lighter for an injury says there's an injury; the coach sees the set, not why.
  const out: Record<string, unknown> = { id: ev.id, at: ev.at, type: ev.type };
  for (const k of keep) if (ev[k] !== undefined) out[k] = ev[k];
  return out;
}

export interface ClientView {
  name: string;
  daysPerWeek: number | null;
  events: Record<string, unknown>[];
  /** The routines this coach assigned to the client. */
  plans: Plan[];
  /** This coach's note to the client, if any. */
  note: Note | null;
}

/** A client's training for their coach, or null when they aren't this coach's client (any more). */
export async function clientView(coachId: string, clientId: string, now = Date.now()): Promise<ClientView | null> {
  if (!(await isClient(coachId, clientId))) return null;
  const rows = await query<{ body: string }>(
    `SELECT body FROM sync_events WHERE account_id = ? AND body IS NOT NULL AND (at >= ? OR body LIKE '%"type":"customExercise"%')
     ORDER BY at DESC LIMIT ?`,
    [clientId, now - COACH_LIMITS.historyMs, COACH_LIMITS.events],
  );
  const events: Record<string, unknown>[] = [];
  for (const r of rows) {
    let e: unknown;
    try {
      e = JSON.parse(String(r.body));
    } catch {
      continue;
    }
    const kept = forCoach(e);
    if (kept) events.push(kept);
  }
  const [p] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [clientId]);
  let daysPerWeek: number | null = null;
  try {
    const d = (JSON.parse(String(p?.body ?? "{}")) as { daysPerWeek?: unknown }).daysPerWeek;
    if (typeof d === "number" && d >= 1 && d <= 7) daysPerWeek = d;
  } catch {
    /* no profile yet */
  }
  const plans = await query<PlanRow>("SELECT * FROM coach_plans WHERE coach_id = ? AND client_id = ? ORDER BY created_at DESC", [
    coachId,
    clientId,
  ]);
  const [n] = await query<NoteRow>("SELECT * FROM coach_notes WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return { name: await nameOf(clientId), daysPerWeek, events: events.reverse(), plans: plans.map(plan), note: n ? note(n) : null };
}

/** Deleting an account: its invites, setup and every link, routine and note, as coach or client. */
export const coachCleanup = (accountId: string) => [
  { sql: "DELETE FROM coach_invites WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_links WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_plans WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_defaults WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_notes WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
];
