// Trainer mode (Melvin, 2026-11-11: "coaches build programs for clients and see client results"). A coach
// makes an invite code; a client enters it, sees what the coach will see, and agrees. From then on the coach
// can read the client's workouts from their synced account: sets, sessions, feedback and their own exercises,
// with every field that isn't training taken out (heart rate, readiness, injuries, notes, gyms). Nothing
// else in the event log ever leaves (health readings, body weight, measurements, cycle, pain, photos).
// Either side can unlink at any time, which cuts access at once. Out of Labs (2026-11-12): a coach can also say what
// their new clients start setup with (goal, experience, days a week), and leave each client one note.
// Physio support (2026-11-13): a coach can work as a physio or rehab clinician, a client can share pain ratings and
// injuries with one coach, and a routine can say how many times a week it's meant to be done (adherence).
// Decision record: docs/decisions/trainer-mode.md.
import { randomBytes } from "node:crypto";

import { hasRoom } from "./coachPlan";
import { batch, query, rateLimit, run } from "./db";
import { notifyCoach } from "./push";

export const COACH_LIMITS = {
  /** Clients per coach while coach plans are off; with them on, the coach's plan decides (coachPlan.ts). */
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
  /** Characters in one chat message, messages sent per account per hour, and how many a thread loads at once. */
  message: 1000,
  messagesPerHour: 120,
  page: 100,
  /** A client with no workout this long is "quiet", and their coach is told once. */
  quietMs: 7 * 86_400_000,
  /** How far back a coach sees a sharing client's food days. */
  foodMs: 30 * 86_400_000,
  /** The range a coach can set for daily calories and grams of protein. */
  kcal: [800, 6000] as const,
  protein: [30, 400] as const,
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
  /** A coach's role, in a client's list of coaches (absent until they pick). */
  role?: Role;
}
export interface Invite {
  code: string;
  expiresAt: number;
}

/** The name on someone's synced profile, or "" (the app then says "No name yet"). */
export async function nameOf(accountId: string): Promise<string> {
  const [r] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  try {
    const name = (JSON.parse(String(r?.body ?? "{}")) as { name?: unknown }).name;
    return typeof name === "string" ? name.trim().slice(0, 60) : "";
  } catch {
    return "";
  }
}

async function people(rows: { id: string; since: number }[], roles = false): Promise<Person[]> {
  return Promise.all(
    rows.map(async (r) => {
      const p: Person = { id: String(r.id), since: Number(r.since), name: await nameOf(String(r.id)) };
      // A lifter's coaches say whether they're a personal trainer or a coach, for the words around them.
      const role = roles ? await roleOf(p.id) : null;
      return role ? { ...p, role } : p;
    }),
  );
}

/** A routine a coach assigned to a client. `code` is a routine share code (src/lib/routineShare.ts). */
export interface Plan {
  id: string;
  coachId: string;
  clientId: string;
  name: string;
  code: string;
  at: number;
  /** How many times a week the coach wants it done (1 to 7), for adherence. Unset when they didn't say. */
  perWeek?: number;
}
type PlanRow = {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  code: string;
  created_at: number;
  per_week?: number | null;
};
const plan = (r: PlanRow): Plan => {
  const p: Plan = {
    id: String(r.id),
    coachId: String(r.coach_id),
    clientId: String(r.client_id),
    name: String(r.name),
    code: String(r.code),
    at: Number(r.created_at),
  };
  const w = cleanPerWeek(r.per_week === null || r.per_week === undefined ? undefined : Number(r.per_week));
  if (w) p.perWeek = w;
  return p;
};
/** Times a week, 1 to 7, or undefined for anything else. */
export const cleanPerWeek = (x: unknown): number | undefined =>
  typeof x === "number" && Number.isInteger(x) && x >= 1 && x <= 7 ? x : undefined;

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
): Promise<{
  invite: Invite | null;
  clients: Person[];
  coaches: Person[];
  plans: Plan[];
  notes: Note[];
  setup: Setup;
  /** Unread chat messages from each person, by their id. */
  unread: Record<string, number>;
  /** The coaches this client shares body data with, and the clients who share theirs with this coach. */
  bodyShared: string[];
  sharesBody: string[];
  /** Whether this coach gets alerts about their clients. */
  alerts: boolean;
  /** The coaches this client shares pain and injuries with, and the clients who share theirs with this coach. */
  painShared: string[];
  sharesPain: string[];
  /** Daily nutrition targets this lifter's coaches set them, newest first. */
  targets: Targets[];
  /** How this account works with clients, once they've said. */
  role: Role | null;
  /** Whether this account has ever coached (its first invite made it a coach), so the app opens the coach's pages. */
  coach: boolean;
}> {
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
    coaches: await people(coaches, true),
    plans: plans.map(plan),
    notes: notes.map(note),
    setup: await setupOf(accountId),
    unread: await unreadFrom(accountId),
    bodyShared: (await query<{ id: string }>("SELECT coach_id AS id FROM coach_shares WHERE client_id = ? AND body = 1", [accountId])).map(
      (r) => String(r.id),
    ),
    sharesBody: (await query<{ id: string }>("SELECT client_id AS id FROM coach_shares WHERE coach_id = ? AND body = 1", [accountId])).map(
      (r) => String(r.id),
    ),
    alerts: await alertsOn(accountId),
    painShared: (await query<{ id: string }>("SELECT coach_id AS id FROM coach_shares WHERE client_id = ? AND pain = 1", [accountId])).map(
      (r) => String(r.id),
    ),
    sharesPain: (await query<{ id: string }>("SELECT client_id AS id FROM coach_shares WHERE coach_id = ? AND pain = 1", [accountId])).map(
      (r) => String(r.id),
    ),
    targets: await targetsFor(accountId),
    role: await roleOf(accountId),
    coach:
      Number((await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_accounts WHERE account_id = ?", [accountId]))[0]?.n ?? 0) > 0,
  };
}

/** A fresh invite code for this coach. The old one stops working. */
export async function makeInvite(coachId: string, now = Date.now(), code = newCode(), via: unknown = "app"): Promise<Invite> {
  const expiresAt = now + COACH_LIMITS.inviteMs;
  await batch([
    // The first invite makes the account a coach, for the admin panel's counts; later ones leave it as it was.
    {
      sql: "INSERT OR IGNORE INTO coach_accounts (account_id, created_at, via) VALUES (?, ?, ?)",
      args: [coachId, now, via === "coaches" ? "coaches" : "app"],
    },
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
  const [coach] = await people([{ id: coachId, since: now }], true);
  return { coach: coach!, setup: await setupOf(coachId) };
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
  if (!(await hasRoom(coachId, now))) {
    // Tell the coach once a day, so they can make room or move to a coach plan (docs/decisions/money.md "Coach plans").
    if (await rateLimit(`coachFull:${coachId}`, 1, 86_400_000).catch(() => false)) {
      await notifyCoach(coachId, "coachFull", { name: await nameOf(clientId) }, "#/trainer");
    }
    return { error: "coachFull" };
  }
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
    { sql: "DELETE FROM coach_messages WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_shares WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_alerts WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_reads WHERE (account_id = ? AND other_id = ?) OR (account_id = ? AND other_id = ?)", args: pair },
    { sql: "DELETE FROM coach_targets WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    // Check-ins (coachForms.ts): the pair's sent and answered ones, and the weekly one.
    { sql: "DELETE FROM coach_checkins WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    { sql: "DELETE FROM coach_checkin_repeats WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)", args: pair },
    // Sessions booked between them open again for the coach's other clients.
    {
      sql: "UPDATE coach_slots SET client_id = NULL, booked_at = NULL WHERE (coach_id = ? AND client_id = ?) OR (coach_id = ? AND client_id = ?)",
      args: pair,
    },
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
  perWeek?: unknown,
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
  const w = cleanPerWeek(perWeek);
  await run("INSERT INTO coach_plans (id, coach_id, client_id, name, code, created_at, per_week) VALUES (?, ?, ?, ?, ?, ?, ?)", [
    id,
    coachId,
    clientId,
    title,
    code,
    now,
    w ?? null,
  ]);
  return w ? { id, coachId, clientId, name: title, code, at: now, perWeek: w } : { id, coachId, clientId, name: title, code, at: now };
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
  // Warm-ups, cool-downs and stretch homework (workouts with parts): which stretches and how long, nothing else.
  stretch: ["moment", "ids", "seconds", "sessionId"],
};
export const COACH_TYPES = Object.keys(KEEP);

// Pain and injuries, only for a coach the client shares them with (physio support, 2026-11-13): which body part,
// when it was logged and healed, graded returns, and each 0 to 10 pain rating with the exercise it was rated on.
// Never the lifter's per-exercise skip or lighter choices, and nothing else from the health side.
const PAIN_KEEP: Record<string, readonly string[]> = {
  injury: ["injuryId", "part"],
  injuryHealed: ["injuryId"],
  injuryReturn: ["injuryId"],
  pain: ["injuryId", "score", "sessionId", "exerciseId"],
};
export const PAIN_TYPES = Object.keys(PAIN_KEEP);

/** The coach's copy of one event: only training fields, or null for anything a coach doesn't see. */
export function forCoach(e: unknown, pain = false): Record<string, unknown> | null {
  if (!e || typeof e !== "object") return null;
  const ev = e as Record<string, unknown>;
  const keep = typeof ev.type === "string" ? (KEEP[ev.type] ?? (pain ? PAIN_KEEP[ev.type] : undefined)) : undefined;
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
  /** The client's body data, only when they share it with this coach. */
  body: BodyShare | null;
  /** Whether the client shares pain and injuries with this coach (the events above then include them). */
  pain: boolean;
  /** This coach's daily nutrition targets for the client, if any. */
  targets: Targets | null;
}

/** What a client shares when they turn on body data for a coach: enough to shape the 3D figure and see the trend. */
export interface BodyShare {
  sex: "male" | "female" | null;
  heightCm: number | null;
  /** Weigh-ins in the last year, oldest first, with body fat where there was one. */
  weights: { at: number; kg: number; bodyFat?: number }[];
  /** Tape measurements in the last year, oldest first. */
  measures: { at: number; site: string; cm: number }[];
  /** Calories and protein from the client's food app (through Health) for each of the last 30 days, oldest first. */
  food?: { day: string; kcal?: number; protein?: number }[];
}

/** A client's training for their coach, or null when they aren't this coach's client (any more). */
export async function clientView(coachId: string, clientId: string, now = Date.now()): Promise<ClientView | null> {
  if (!(await isClient(coachId, clientId))) return null;
  const pain = await sharesPain(coachId, clientId);
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
    const kept = forCoach(e, pain);
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
  return {
    name: await nameOf(clientId),
    daysPerWeek,
    events: events.reverse(),
    plans: plans.map(plan),
    note: n ? note(n) : null,
    body: (await sharesBody(coachId, clientId)) ? await bodyOf(clientId, String(p?.body ?? "{}"), now) : null,
    pain,
    targets: (await targetsFor(clientId, coachId))[0] ?? null,
  };
}

// ---------- Body data, shared by the client's choice (2026-11-12) ----------

export async function sharesBody(coachId: string, clientId: string): Promise<boolean> {
  const [r] = await query<{ body: number }>("SELECT body FROM coach_shares WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return Number(r?.body ?? 0) === 1;
}

export async function sharesPain(coachId: string, clientId: string): Promise<boolean> {
  const [r] = await query<{ pain: number }>("SELECT pain FROM coach_shares WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return Number(r?.pain ?? 0) === 1;
}

/** The client turns body data (or, with `what` "pain", pain and injuries) on or off for one of their coaches. */
export async function setShare(
  clientId: string,
  coachId: unknown,
  on: unknown,
  now = Date.now(),
  what: unknown = "body",
): Promise<boolean | { error: "notClient" }> {
  if (!isAccountId(coachId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  // One fixed column name per kind of share, never taken from the request.
  const col = what === "pain" ? "pain" : "body";
  await run(
    `INSERT INTO coach_shares (coach_id, client_id, ${col}, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET ${col} = excluded.${col}, updated_at = excluded.updated_at`,
    [coachId, clientId, on === true ? 1 : 0, now],
  );
  return on === true;
}

const num = (x: unknown, lo: number, hi: number) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? x : null);

async function bodyOf(clientId: string, profileBody: string, now: number): Promise<BodyShare> {
  let prof: Record<string, unknown> = {};
  try {
    prof = JSON.parse(profileBody) as Record<string, unknown>;
  } catch {
    /* no profile */
  }
  const rows = await query<{ body: string }>(
    `SELECT body FROM sync_events WHERE account_id = ? AND body IS NOT NULL AND at >= ?
       AND (body LIKE '%"type":"bodyweight"%' OR body LIKE '%"type":"measure"%'
         OR (at >= ? AND (body LIKE '%"metric":"kcalIn"%' OR body LIKE '%"metric":"protein"%'))) ORDER BY at`,
    [clientId, now - COACH_LIMITS.historyMs, now - COACH_LIMITS.foodMs],
  );
  const weights: BodyShare["weights"] = [];
  const measures: BodyShare["measures"] = [];
  const food = new Map<string, { day: string; kcal?: number; protein?: number }>();
  for (const r of rows) {
    let e: Record<string, unknown>;
    try {
      e = JSON.parse(String(r.body)) as Record<string, unknown>;
    } catch {
      continue;
    }
    const at = num(e.at, 0, Number.MAX_SAFE_INTEGER);
    if (at === null) continue;
    if (e.type === "bodyweight") {
      const kg = num(e.kg, 20, 400);
      const bf = num(e.bodyFat, 2, 70);
      if (kg !== null) weights.push(bf === null ? { at, kg } : { at, kg, bodyFat: bf });
    } else if (e.type === "measure" && typeof e.site === "string" && /^[a-z]{2,12}$/.test(e.site)) {
      const cm = num(e.cm, 5, 300);
      if (cm !== null) measures.push({ at, site: e.site, cm });
    } else if (e.type === "health" && typeof e.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.day)) {
      // Rows come oldest first, so a day read again later keeps its newest number.
      const d = food.get(e.day) ?? { day: e.day };
      if (e.metric === "kcalIn") {
        const v = num(e.value, 0, 15_000);
        if (v !== null) d.kcal = Math.round(v);
      } else if (e.metric === "protein") {
        const v = num(e.value, 0, 1_000);
        if (v !== null) d.protein = Math.round(v);
      }
      food.set(e.day, d);
    }
  }
  return {
    sex: prof.sex === "male" || prof.sex === "female" ? prof.sex : null,
    heightCm: num(prof.heightCm, 100, 250),
    weights,
    measures,
    food: [...food.values()].sort((a, b) => (a.day < b.day ? -1 : 1)),
  };
}

// ---------- Nutrition targets from the coach (2026-11-13) ----------

export interface Targets {
  coachId: string;
  clientId: string;
  /** Calories a day. */
  kcal: number | null;
  /** Grams of protein a day. */
  protein: number | null;
  at: number;
}
type TargetRow = { coach_id: string; client_id: string; kcal: number | null; protein: number | null; updated_at: number };
const targets = (r: TargetRow): Targets => ({
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  kcal: r.kcal == null ? null : Number(r.kcal),
  protein: r.protein == null ? null : Number(r.protein),
  at: Number(r.updated_at),
});

/** A whole number in range, or null for anything else (empty, junk or out of range). */
const target = (x: unknown, [lo, hi]: readonly [number, number]) =>
  typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x) : null;

/**
 * The coach sets (or, with both empty, clears) a client's daily calories and protein. Only for the coach's own
 * clients; a number outside the range is left empty rather than refused.
 */
export async function setTargets(
  coachId: string,
  clientId: unknown,
  kcal: unknown,
  protein: unknown,
  now = Date.now(),
): Promise<Targets | null | { error: "notClient" }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  const k = target(kcal, COACH_LIMITS.kcal);
  const p = target(protein, COACH_LIMITS.protein);
  if (k === null && p === null) {
    await run("DELETE FROM coach_targets WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
    return null;
  }
  await run(
    `INSERT INTO coach_targets (coach_id, client_id, kcal, protein, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET kcal = excluded.kcal, protein = excluded.protein, updated_at = excluded.updated_at`,
    [coachId, clientId, k, p, now],
  );
  return { coachId, clientId, kcal: k, protein: p, at: now };
}

/** A client's targets from their coaches, newest first (or from one coach). */
export async function targetsFor(clientId: string, coachId?: string): Promise<Targets[]> {
  const rows = coachId
    ? await query<TargetRow>("SELECT * FROM coach_targets WHERE client_id = ? AND coach_id = ?", [clientId, coachId])
    : await query<TargetRow>("SELECT * FROM coach_targets WHERE client_id = ? ORDER BY updated_at DESC", [clientId]);
  return rows.map(targets);
}

// ---------- Chat between a coach and a client (2026-11-12) ----------

export interface Message {
  id: string;
  from: string;
  text: string;
  at: number;
}

/** The pair's coach and client, whichever way round the two are, or null when they aren't linked. */
async function pairOf(a: string, b: string): Promise<{ coach: string; client: string } | null> {
  if (await isClient(a, b)) return { coach: a, client: b };
  if (await isClient(b, a)) return { coach: b, client: a };
  return null;
}

export type MessageError = "notLinked" | "empty" | "slow";

/** Sends a message to the other side of a coaching link, and pushes it to their phones. */
export async function sendMessage(
  fromId: string,
  toId: unknown,
  raw: unknown,
  now = Date.now(),
  id = randomBytes(9).toString("base64url"),
): Promise<Message | { error: MessageError }> {
  if (!isAccountId(toId)) return { error: "notLinked" };
  const pair = await pairOf(fromId, toId);
  if (!pair) return { error: "notLinked" };
  const body = typeof raw === "string" ? cleanMessage(raw) : "";
  if (!body) return { error: "empty" };
  if (!(await rateLimit(`coachmsg:${fromId}`, COACH_LIMITS.messagesPerHour, 3_600_000, now))) return { error: "slow" };
  await batch([
    {
      sql: "INSERT INTO coach_messages (id, coach_id, client_id, from_id, body, at) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, pair.coach, pair.client, fromId, body, now],
    },
    { sql: READ_SQL, args: [fromId, toId, now] },
  ]);
  await notifyCoach(toId, "coachMsg", { name: await nameOf(fromId), text: body }, `#/trainer/m.${fromId}`);
  return { id, from: fromId, text: body, at: now };
}

/** A message's text: like a note's, but longer. */
export function cleanMessage(x: string): string {
  return x
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, COACH_LIMITS.message)
    .trim();
}

const READ_SQL = `INSERT INTO coach_reads (account_id, other_id, read_at) VALUES (?, ?, ?)
  ON CONFLICT (account_id, other_id) DO UPDATE SET read_at = MAX(coach_reads.read_at, excluded.read_at)`;

/** The latest messages with the other side (oldest first), or older ones before `before`. Reading marks them read. */
export async function messages(
  accountId: string,
  otherId: unknown,
  before: unknown,
  now = Date.now(),
): Promise<{ messages: Message[]; more: boolean; name: string; them: "coach" | "client" } | { error: "notLinked" }> {
  if (!isAccountId(otherId)) return { error: "notLinked" };
  const pair = await pairOf(accountId, otherId);
  if (!pair) return { error: "notLinked" };
  const until = typeof before === "number" && Number.isFinite(before) ? before : Number.MAX_SAFE_INTEGER;
  const rows = await query<{ id: string; from_id: string; body: string; at: number }>(
    "SELECT id, from_id, body, at FROM coach_messages WHERE coach_id = ? AND client_id = ? AND at < ? ORDER BY at DESC LIMIT ?",
    [pair.coach, pair.client, until, COACH_LIMITS.page + 1],
  );
  const more = rows.length > COACH_LIMITS.page;
  const page = rows.slice(0, COACH_LIMITS.page).reverse();
  if (!Number.isFinite(before as number)) await run(READ_SQL, [accountId, otherId, now]);
  return {
    messages: page.map((r) => ({ id: String(r.id), from: String(r.from_id), text: String(r.body), at: Number(r.at) })),
    more,
    name: await nameOf(otherId),
    // Which side the other person is on, so each side's empty thread says something that fits them.
    them: pair.coach === otherId ? "coach" : "client",
  };
}

/** Unread messages to this account, by who sent them. */
export async function unreadFrom(accountId: string): Promise<Record<string, number>> {
  const rows = await query<{ from_id: string; n: number }>(
    `SELECT m.from_id, COUNT(*) AS n FROM coach_messages m
       LEFT JOIN coach_reads r ON r.account_id = ? AND r.other_id = m.from_id
     WHERE (m.coach_id = ? OR m.client_id = ?) AND m.from_id <> ? AND m.at > COALESCE(r.read_at, 0)
     GROUP BY m.from_id`,
    [accountId, accountId, accountId, accountId],
  );
  return Object.fromEntries(rows.map((r) => [String(r.from_id), Number(r.n)]));
}

// ---------- Alerts to a coach (2026-11-12) ----------

export async function alertsOn(coachId: string): Promise<boolean> {
  const [r] = await query<{ alerts: number }>("SELECT alerts FROM coach_prefs WHERE account_id = ?", [coachId]);
  return r ? Number(r.alerts) === 1 : true;
}

export async function setAlerts(coachId: string, on: unknown, now = Date.now()): Promise<boolean> {
  await run(
    `INSERT INTO coach_prefs (account_id, alerts, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (account_id) DO UPDATE SET alerts = excluded.alerts, updated_at = excluded.updated_at`,
    [coachId, on === false ? 0 : 1, now],
  );
  return on !== false;
}

// ---------- Personal trainer, coach or physio (Melvin, 2026-11-13) ----------

/**
 * How someone works with clients. A personal trainer works one-on-one, mostly in person: sessions, booking and a price
 * per session come first. A coach runs groups or teams, often remotely: check-ins, programs and a monthly fee come first.
 * A physio or rehab clinician sees pain and injuries first and assigns rehab programs. It changes words and what's shown
 * first, never which tools there are (docs/decisions/trainer-mode.md).
 */
export type Role = "trainer" | "coach" | "physio";
export const ROLES: Role[] = ["trainer", "coach", "physio"];

/**
 * One choice since 2026-11-13. Physio used to be a separate `kind` column beside `role`; a coach who picked Physio
 * there stays a physio (kind wins over role), so nobody's setting changes. Every save writes both columns.
 */
export async function roleOf(id: string): Promise<Role | null> {
  const [r] = await query<{ role: string | null; kind: string | null }>("SELECT role, kind FROM coach_prefs WHERE account_id = ?", [id]);
  if (r?.kind === "physio") return "physio";
  return ROLES.find((x) => x === r?.role) ?? null;
}

export async function setRole(coachId: string, role: unknown, now = Date.now()): Promise<Role | null> {
  const r = ROLES.find((x) => x === role) ?? null;
  await run(
    `INSERT INTO coach_prefs (account_id, alerts, role, kind, updated_at) VALUES (?, 1, ?, ?, ?)
     ON CONFLICT (account_id) DO UPDATE SET role = excluded.role, kind = excluded.kind, updated_at = excluded.updated_at`,
    [coachId, r, r === "physio" ? "physio" : "trainer", now],
  );
  return r;
}

/**
 * A client's phone synced a finished workout: tell each of their coaches who has alerts on. Called from sync with the
 * events it just stored; a workout logged long ago (an import, a backup) says nothing.
 */
export async function alertTrained(clientId: string, events: readonly { type?: unknown; at?: unknown }[], now = Date.now()): Promise<void> {
  const ends = events
    .filter((e) => e.type === "sessionEnd" && typeof e.at === "number" && e.at > now - 6 * 3_600_000 && e.at <= now + 60_000)
    .map((e) => e.at as number);
  if (!ends.length) return;
  const latest = Math.max(...ends);
  const coaches = await query<{ id: string }>("SELECT coach_id AS id FROM coach_links WHERE client_id = ?", [clientId]);
  if (!coaches.length) return;
  const name = await nameOf(clientId);
  for (const c of coaches) {
    const id = String(c.id);
    // Each workout is told once, even when a phone sends it again: the last one told is kept.
    const [told] = await query<{ at: number }>("SELECT at FROM coach_alerts WHERE coach_id = ? AND client_id = ? AND kind = 'trained'", [
      id,
      clientId,
    ]);
    if (told && Number(told.at) >= latest) continue;
    await batch([
      {
        sql: `INSERT INTO coach_alerts (coach_id, client_id, kind, at) VALUES (?, ?, 'trained', ?)
              ON CONFLICT (coach_id, client_id, kind) DO UPDATE SET at = excluded.at`,
        args: [id, clientId, latest],
      },
      // A new workout ends a quiet spell, so the next one is told again.
      { sql: "DELETE FROM coach_alerts WHERE coach_id = ? AND client_id = ? AND kind = 'quiet'", args: [id, clientId] },
    ]);
    if (await alertsOn(id)) await notifyCoach(id, "coachTrained", { name }, `#/trainer/c.${clientId}`);
  }
}

/** Pain at or above this, synced from a client who shares pain with their coach, is pushed to the coach. */
export const PAIN_ALERT = 5;

/**
 * A client's phone synced a pain rating of 5 or more, rated in the last 6 hours: tell each coach the client shares
 * pain with and who has alerts on, at most once in 20 hours, so a workout of high ratings is one push.
 */
export async function alertPain(clientId: string, events: readonly { type?: unknown; at?: unknown; score?: unknown }[], now = Date.now()) {
  const high = events.filter(
    (e) =>
      e.type === "pain" &&
      typeof e.at === "number" &&
      typeof e.score === "number" &&
      e.score >= PAIN_ALERT &&
      e.at > now - 6 * 3_600_000 &&
      e.at <= now + 60_000,
  );
  if (!high.length) return;
  const score = Math.min(10, Math.round(Math.max(...high.map((e) => e.score as number))));
  const coaches = await query<{ id: string }>("SELECT coach_id AS id FROM coach_shares WHERE client_id = ? AND pain = 1", [clientId]);
  if (!coaches.length) return;
  const name = await nameOf(clientId);
  for (const c of coaches) {
    const id = String(c.id);
    if (!(await isClient(id, clientId))) continue;
    const [told] = await query<{ at: number }>("SELECT at FROM coach_alerts WHERE coach_id = ? AND client_id = ? AND kind = 'pain'", [
      id,
      clientId,
    ]);
    if (told && now - Number(told.at) < 20 * 3_600_000) continue;
    await run(
      `INSERT INTO coach_alerts (coach_id, client_id, kind, at) VALUES (?, ?, 'pain', ?)
       ON CONFLICT (coach_id, client_id, kind) DO UPDATE SET at = excluded.at`,
      [id, clientId, now],
    );
    if (await alertsOn(id)) await notifyCoach(id, "coachPain", { name, text: String(score) }, `#/trainer/c.${clientId}`);
  }
}

/**
 * The daily job: every client with no workout for a week (and linked for at least that long) is "quiet", and their
 * coach is told once until they train again. Returns how many alerts went out.
 */
export async function alertQuiet(now = Date.now()): Promise<number> {
  const links = await query<{ coach_id: string; client_id: string }>(
    `SELECT l.coach_id, l.client_id FROM coach_links l
      WHERE l.created_at <= ?
        AND NOT EXISTS (SELECT 1 FROM coach_alerts a WHERE a.coach_id = l.coach_id AND a.client_id = l.client_id AND a.kind = 'quiet')
        AND NOT EXISTS (SELECT 1 FROM coach_prefs p WHERE p.account_id = l.coach_id AND p.alerts = 0)
        AND NOT EXISTS (SELECT 1 FROM sync_events e WHERE e.account_id = l.client_id AND e.at > ? AND e.body LIKE '%"type":"sessionEnd"%')`,
    [now - COACH_LIMITS.quietMs, now - COACH_LIMITS.quietMs],
  );
  for (const l of links) {
    const coach = String(l.coach_id);
    const client = String(l.client_id);
    await run("INSERT OR IGNORE INTO coach_alerts (coach_id, client_id, kind, at) VALUES (?, ?, 'quiet', ?)", [coach, client, now]);
    await notifyCoach(coach, "coachQuiet", { name: await nameOf(client) }, `#/trainer/c.${client}`);
  }
  return links.length;
}

/** Deleting an account: its invites, setup and every link, routine and note, as coach or client. */
export const coachCleanup = (accountId: string) => [
  { sql: "DELETE FROM coach_invites WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_accounts WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_links WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_plans WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_defaults WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_notes WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_messages WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_reads WHERE account_id = ? OR other_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_shares WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_alerts WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_prefs WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_targets WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_forms WHERE coach_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_slots WHERE coach_id = ?", args: [accountId] },
  { sql: "UPDATE coach_slots SET client_id = NULL, booked_at = NULL WHERE client_id = ?", args: [accountId] },
  { sql: "DELETE FROM coach_checkins WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
  { sql: "DELETE FROM coach_checkin_repeats WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
];
