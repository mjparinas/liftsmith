// Coaches sell their programs (Melvin, 2026-11-15: "a program marketplace where coaches sell training programs").
// A program is a few of the coach's own routines (its days) with a title, a few words about it, a level, a goal, how
// many weeks to run it and a price (0 is free). It travels as the same routine codes as shared routine links and
// routines from a coach (routineShare.ts), so a lifter who gets one saves its days to their routines and their own
// progression fills in weights and reps. Decision record: docs/decisions/coach-programs.md.
//
// Where it's paid for (Melvin chose, 2026-11-15): a program is a digital good, so it's only ever bought on the website,
// on a Stripe Checkout page on the coach's own Stripe account (the coach is the merchant, as with client payments,
// coachPay.ts), with Liftsmith's share from `feeFor` (2% from a coach on plain Pro once coach plans are on, else 0).
// The Android and iOS apps show only free programs and programs the lifter already has: no price, no buy button and
// no link, because both stores require their own billing for digital goods bought in the app.
//
// Teens: a coach under 18 can't list programs, and a lifter under 18 can get free programs but can't buy one.
import { randomBytes } from "node:crypto";

import { cleanPhases, phaseWeeks } from "@/lib/programPhases";
import { SITE_URL } from "@/lib/site";
import type { ProgramPhase } from "@/lib/types";

import { isAccountId, isRoutineCode, nameOf, roleOf, teenProfile, type Role } from "./coach";
import { accountRow, call, coachOfStripe, feeFor, minorUnits, payAccount, type ConnectEvent, type PayConfig } from "./coachPay";
import { batch, query, run } from "./db";
import { checkText, tidy } from "./moderation";
import { notifyCoach } from "./push";
import type { Fetch } from "./stripe";

export const LEVELS = ["beginner", "intermediate", "advanced", "any"] as const;
export const GOALS = ["strength", "muscle", "fitness", "fatLoss", "sport"] as const;
export type Level = (typeof LEVELS)[number];
export type Goal = (typeof GOALS)[number];

export const PROGRAM_LIMITS = {
  title: 60,
  about: 600,
  dayName: 40,
  /** Days (routines) in one program. */
  days: [1, 7] as const,
  weeks: [1, 16] as const,
  /** A price in whole currency units; 0 is free. */
  price: [1, 500] as const,
  /** Programs one coach can have. */
  perCoach: 20,
  /** Programs a list shows. */
  browse: 60,
};

export interface ProgramDay {
  name: string;
  /** The routine's share code: only for someone who has the program (or it's free). */
  code?: string;
  exercises: number;
  sets: number;
}

export interface CoachProgram {
  id: string;
  coachId: string;
  coachName: string;
  role: Role | null;
  title: string;
  about: string;
  level: Level;
  goal: Goal;
  weeks: number;
  days: ProgramDay[];
  /** Phases (Build, Deload, Peak) when the program has more than one week laid out; weekdays parallel to days. */
  phases?: ProgramPhase[];
  /** 0 is free. In whole units of `currency`. */
  price: number;
  currency: string;
  listed: boolean;
  updatedAt: number;
  /** The viewer has it (got it free, bought it, or made it). */
  owned: boolean;
  /** Only for the coach who made it. */
  sales?: number;
}

interface Row {
  id: string;
  coach_id: string;
  title: string;
  about: string;
  level: string;
  goal: string;
  weeks: number;
  days: string;
  phases?: string | null;
  price: number;
  currency: string;
  listed: number;
  hidden: number;
  updated_at: number;
}

const pick = <T extends string>(list: readonly T[], x: unknown, d: T): T => ((list as readonly unknown[]).includes(x) ? (x as T) : d);
const inRange = (n: unknown, [lo, hi]: readonly [number, number]) => typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi;

/** Exercises and sets in a routine code, read without the exercise list (the server doesn't load it). */
export function countCode(code: string): { exercises: number; sets: number } {
  let exercises = 0;
  let sets = 0;
  for (const seg of code.split("~").slice(2)) {
    const m = /^[\w-]+\.(\d+)/.exec(seg);
    if (!m) continue;
    exercises++;
    sets += Number(m[1]);
  }
  return { exercises, sets };
}

/** A routine code's exercises and set counts in order ("bench-press", 4), for the public page of a free program. */
export function codeItems(code: string): { id: string; sets: number }[] {
  return code
    .split("~")
    .slice(2)
    .flatMap((seg) => {
      const m = /^([\w-]+)\.(\d+)/.exec(seg);
      return m ? [{ id: m[1]!, sets: Number(m[2]) }] : [];
    });
}

/** Whether a coach is under 18 by their profile (their programs then never show to anyone else). */
export const coachIsTeen = (accountId: string, now = Date.now()) => isTeen(accountId, now);

function readDays(raw: string): { name: string; code: string; weekdays?: number[] }[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.flatMap((d) => {
      if (!d || typeof d !== "object") return [];
      const row = d as { name?: unknown; code?: unknown; weekdays?: unknown };
      if (typeof row.name !== "string" || !isRoutineCode(row.code)) return [];
      const weekdays = Array.isArray(row.weekdays)
        ? [...new Set(row.weekdays.filter((w): w is number => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= 6))].sort(
            (a, b) => a - b,
          )
        : [];
      return [{ name: row.name, code: row.code, ...(weekdays.length ? { weekdays } : {}) }];
    });
  } catch {
    return [];
  }
}

/** A stored program's phases, when it has them and they still match its days. */
export function readPhases(r: Pick<Row, "phases" | "days">): { phases?: ProgramPhase[] } {
  if (!r.phases) return {};
  try {
    const phases = cleanPhases(JSON.parse(String(r.phases)), readDays(String(r.days)).length);
    return phases ? { phases } : {};
  } catch {
    return {};
  }
}

async function shape(r: Row, viewer: string | null, ownedIds: Set<string>, sales?: number): Promise<CoachProgram> {
  const mine = viewer === String(r.coach_id);
  const free = Number(r.price) === 0;
  const owned = mine || ownedIds.has(String(r.id));
  return {
    id: String(r.id),
    coachId: String(r.coach_id),
    coachName: await nameOf(String(r.coach_id)),
    role: await roleOf(String(r.coach_id)),
    title: String(r.title),
    about: String(r.about),
    level: pick(LEVELS, r.level, "any"),
    goal: pick(GOALS, r.goal, "strength"),
    weeks: Number(r.weeks),
    days: readDays(String(r.days)).map((d) => ({
      name: d.name,
      ...countCode(d.code),
      ...(d.weekdays ? { weekdays: d.weekdays } : {}),
      ...(owned || free ? { code: d.code } : {}),
    })),
    ...readPhases(r),
    price: Number(r.price),
    currency: String(r.currency),
    listed: Number(r.listed) === 1,
    updatedAt: Number(r.updated_at),
    owned,
    ...(mine ? { sales: sales ?? 0 } : {}),
  };
}

async function ownedBy(accountId: string | null): Promise<Set<string>> {
  if (!accountId) return new Set();
  const rows = await query<{ program_id: string }>("SELECT program_id FROM program_owners WHERE account_id = ?", [accountId]);
  return new Set(rows.map((r) => String(r.program_id)));
}

async function isTeen(accountId: string, now: number): Promise<boolean> {
  const [p] = await query<{ body: string | null }>("SELECT body FROM sync_records WHERE account_id = ? AND key = 'profile'", [accountId]);
  return teenProfile(p?.body, now);
}

const newId = (bytes: Buffer = randomBytes(9)) => bytes.toString("base64url").replace(/[-_]/g, "x").slice(0, 12);
export const isProgramId = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9]{12}$/.test(x);

export type SaveError = "bad" | "title" | "about" | "teen" | "full" | "noAccount" | "notYours";

/** Makes or changes one of the coach's programs. A paid price needs the coach's Stripe account ready for payments. */
export async function saveProgram(coachId: string, raw: unknown, now = Date.now()): Promise<CoachProgram | { error: SaveError }> {
  if (!raw || typeof raw !== "object") return { error: "bad" };
  const p = raw as Record<string, unknown>;
  if (await isTeen(coachId, now)) return { error: "teen" };
  const title = checkText(p.title, PROGRAM_LIMITS.title);
  if (!title.ok) return { error: "title" };
  const aboutRaw = tidy(p.about, PROGRAM_LIMITS.about);
  const about = aboutRaw ? checkText(aboutRaw, PROGRAM_LIMITS.about) : ({ ok: true, text: "" } as const);
  if (!about.ok) return { error: "about" };
  const days = Array.isArray(p.days) ? p.days : [];
  if (days.length < PROGRAM_LIMITS.days[0] || days.length > PROGRAM_LIMITS.days[1]) return { error: "bad" };
  const clean: { name: string; code: string; weekdays?: number[] }[] = [];
  for (const d of days as Record<string, unknown>[]) {
    const name = tidy(d?.name, PROGRAM_LIMITS.dayName);
    if (!name || !isRoutineCode(d?.code) || countCode(d.code).exercises === 0) return { error: "bad" };
    const weekdays = Array.isArray(d.weekdays)
      ? [...new Set(d.weekdays.filter((w): w is number => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= 6))].sort(
          (a, b) => a - b,
        )
      : [];
    clean.push({ name, code: d.code, ...(weekdays.length ? { weekdays } : {}) });
  }
  // Phases (stage 2 of the builder): when there are any, the program's weeks are theirs added up.
  const phases = p.phases === undefined || p.phases === null ? null : cleanPhases(p.phases, clean.length);
  if (p.phases !== undefined && p.phases !== null && !phases) return { error: "bad" };
  if (phases) p.weeks = phaseWeeks(phases);
  if (!inRange(p.weeks, PROGRAM_LIMITS.weeks)) return { error: "bad" };
  const price = p.price === 0 || p.price === undefined || p.price === null ? 0 : p.price;
  if (
    price !== 0 &&
    (typeof price !== "number" || !Number.isFinite(price) || price < PROGRAM_LIMITS.price[0] || price > PROGRAM_LIMITS.price[1])
  )
    return { error: "bad" };
  const acc = price ? await payAccount(coachId) : null;
  if (price && !acc?.ready) return { error: "noAccount" };

  let id = isProgramId(p.id) ? p.id : null;
  if (id) {
    const [own] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_programs WHERE id = ?", [id]);
    if (!own || String(own.coach_id) !== coachId) return { error: "notYours" };
  } else {
    const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_programs WHERE coach_id = ?", [coachId]);
    if (Number(n?.n ?? 0) >= PROGRAM_LIMITS.perCoach) return { error: "full" };
    id = newId();
  }
  const amount = price ? Math.round(Number(price) * 100) / 100 : 0;
  await run(
    `INSERT INTO coach_programs (id, coach_id, title, about, level, goal, weeks, days, phases, price, currency, listed, hidden, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, about = excluded.about, level = excluded.level, goal = excluded.goal,
       weeks = excluded.weeks, days = excluded.days, phases = excluded.phases, price = excluded.price, currency = excluded.currency,
       listed = excluded.listed, updated_at = excluded.updated_at`,
    [
      id,
      coachId,
      title.text,
      about.text,
      pick(LEVELS, p.level, "any"),
      pick(GOALS, p.goal, "strength"),
      p.weeks as number,
      JSON.stringify(clean),
      phases ? JSON.stringify(phases) : "",
      amount,
      acc?.currency ?? (await payAccount(coachId))?.currency ?? "usd",
      p.listed === false ? 0 : 1,
      now,
      now,
    ],
  );
  return (await programFor(id, coachId))!;
}

/**
 * Removes a program. One that somebody already has stays for them, taken off the list instead, so nobody loses what
 * they paid for.
 */
export async function deleteProgram(coachId: string, id: unknown, now = Date.now()): Promise<"deleted" | "unlisted" | null> {
  if (!isProgramId(id)) return null;
  const [r] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_programs WHERE id = ?", [id]);
  if (!r || String(r.coach_id) !== coachId) return null;
  const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM program_owners WHERE program_id = ?", [id]);
  if (Number(n?.n ?? 0) > 0) {
    await run("UPDATE coach_programs SET listed = 0, updated_at = ? WHERE id = ?", [now, id]);
    return "unlisted";
  }
  await batch([
    { sql: "DELETE FROM program_reviews WHERE program_id = ?", args: [id] },
    { sql: "DELETE FROM coach_programs WHERE id = ?", args: [id] },
  ]);
  return "deleted";
}

/** One program as `viewer` may see it: listed ones for anyone, others only for the coach and people who have it. */
export async function programFor(id: unknown, viewer: string | null): Promise<CoachProgram | null> {
  if (!isProgramId(id)) return null;
  const [r] = await query<Row>("SELECT * FROM coach_programs WHERE id = ?", [id]);
  if (!r) return null;
  const owned = await ownedBy(viewer);
  const mine = viewer === String(r.coach_id);
  if (!mine && !owned.has(id) && (Number(r.listed) !== 1 || Number(r.hidden) === 1)) return null;
  const sales = mine ? await salesOf(id) : undefined;
  return shape(r, viewer, owned, sales);
}

async function salesOf(id: string): Promise<number> {
  const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM program_owners WHERE program_id = ? AND payment_id IS NOT NULL", [id]);
  return Number(n?.n ?? 0);
}

/** The coach's own programs, newest first, with how many each has sold. */
export async function myPrograms(coachId: string): Promise<CoachProgram[]> {
  const rows = await query<Row>("SELECT * FROM coach_programs WHERE coach_id = ? ORDER BY updated_at DESC", [coachId]);
  return Promise.all(rows.map(async (r) => shape(r, coachId, new Set(), await salesOf(String(r.id)))));
}

/** Programs this lifter has (free or bought), newest first. Taken off the list or not, they stay theirs. */
export async function ownedPrograms(accountId: string): Promise<CoachProgram[]> {
  const rows = await query<Row>(
    `SELECT c.* FROM coach_programs c JOIN program_owners o ON o.program_id = c.id WHERE o.account_id = ? ORDER BY o.at DESC`,
    [accountId],
  );
  const owned = new Set(rows.map((r) => String(r.id)));
  return Promise.all(rows.map((r) => shape(r, accountId, owned)));
}

/**
 * Listed programs, newest first. `freeOnly` is for the phone apps, which never show a paid program the lifter
 * doesn't have (store billing rules). `coach` narrows it to one coach's programs.
 */
export async function browsePrograms(
  viewer: string | null,
  opts: { freeOnly?: boolean; coach?: string; limit?: number } = {},
  now = Date.now(),
): Promise<CoachProgram[]> {
  const where = ["listed = 1", "hidden = 0"];
  const args: (string | number)[] = [];
  if (opts.freeOnly) where.push("price = 0");
  if (opts.coach && isAccountId(opts.coach)) {
    where.push("coach_id = ?");
    args.push(opts.coach);
  }
  const rows = await query<Row>(`SELECT * FROM coach_programs WHERE ${where.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`, [
    ...args,
    (opts.limit ?? PROGRAM_LIMITS.browse) * 2,
  ]);
  // Only adults' programs are shown (a coach's birthday may pass after they listed one, or the other way round).
  const adults: Row[] = [];
  for (const r of rows) if (!(await isTeen(String(r.coach_id), now))) adults.push(r);
  const owned = await ownedBy(viewer);
  return Promise.all(adults.slice(0, opts.limit ?? PROGRAM_LIMITS.browse).map((r) => shape(r, viewer, owned)));
}

export type GetError = "gone" | "notFree" | "paid";

/** Adds a free program to this lifter's programs. */
export async function getFree(accountId: string, id: unknown, now = Date.now()): Promise<CoachProgram | { error: GetError }> {
  const p = await programFor(id, accountId);
  if (!p) return { error: "gone" };
  if (p.price !== 0) return { error: "notFree" };
  await run("INSERT OR IGNORE INTO program_owners (program_id, account_id, at, payment_id) VALUES (?, ?, ?, NULL)", [p.id, accountId, now]);
  return (await programFor(p.id, accountId))!;
}

/** Takes a free program off this lifter's list (a bought one stays: it was paid for). */
export async function dropProgram(accountId: string, id: unknown): Promise<boolean> {
  if (!isProgramId(id)) return false;
  await run("DELETE FROM program_owners WHERE program_id = ? AND account_id = ? AND payment_id IS NULL", [id, accountId]);
  return true;
}

export type BuyError = GetError | "owned" | "teen" | "notReady" | "yours";

/** A Stripe Checkout page on the coach's account for a paid program. Web only (the app never calls this on a phone). */
export async function programCheckout(
  cfg: PayConfig,
  buyerId: string,
  id: unknown,
  now = Date.now(),
  f: Fetch = fetch,
): Promise<string | { error: BuyError }> {
  const p = await programFor(id, buyerId);
  if (!p) return { error: "gone" };
  if (p.coachId === buyerId) return { error: "yours" };
  if (p.owned) return { error: "owned" };
  if (p.price === 0) return { error: "notFree" };
  if (await isTeen(buyerId, now)) return { error: "teen" };
  const acc = await accountRow(p.coachId);
  if (!acc || Number(acc.ready) !== 1) return { error: "notReady" };
  const unit = Math.round(p.price * minorUnits(p.currency));
  const fee = await feeFor(p.coachId, now);
  const s = await call<{ url: string }>(
    cfg,
    "POST",
    "/checkout/sessions",
    {
      mode: "payment",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": p.currency,
      "line_items[0][price_data][unit_amount]": unit,
      "line_items[0][price_data][product_data][name]": `${p.title} (${p.coachName || "Liftsmith coach"})`.slice(0, 120),
      ...(fee ? { "payment_intent_data[application_fee_amount]": Math.round((unit * fee) / 100) } : {}),
      "metadata[kind]": "program",
      "metadata[program]": p.id,
      "metadata[coach]": p.coachId,
      "metadata[buyer]": buyerId,
      "payment_intent_data[metadata][kind]": "program",
      "payment_intent_data[metadata][program]": p.id,
      "payment_intent_data[metadata][buyer]": buyerId,
      success_url: `${SITE_URL}/app/#/program/${p.id}~paid`,
      cancel_url: `${SITE_URL}/app/#/program/${p.id}`,
    },
    acc.stripe_id,
    f,
  );
  return s.url;
}

type Obj = Record<string, unknown>;
const str = (x: unknown) => (typeof x === "string" ? x : "");
const meta = (o: Obj): Record<string, string> =>
  o.metadata && typeof o.metadata === "object" ? (o.metadata as Record<string, string>) : {};

/**
 * The program side of the Connect webhook: a finished checkout gives the buyer the program, and a refund takes it back.
 * Only events from the account of the coach who made the program count. Returns whether the event was a program's.
 */
export async function storeProgramEvent(e: ConnectEvent, now = Date.now()): Promise<boolean> {
  const o = e.data.object;
  if (e.type === "checkout.session.completed") {
    const m = meta(o);
    if (m.kind !== "program") return false;
    if (o.payment_status !== "paid" || !e.account || !isProgramId(m.program) || !isAccountId(m.buyer)) return true;
    const coach = await coachOfStripe(e.account);
    const [r] = await query<{ coach_id: string; title: string }>("SELECT coach_id, title FROM coach_programs WHERE id = ?", [m.program]);
    if (!coach || !r || String(r.coach_id) !== coach) return true;
    const paymentId = str(o.payment_intent) || str(o.id);
    const fresh = await query<{ program_id: string }>(
      `INSERT INTO program_owners (program_id, account_id, at, payment_id) VALUES (?, ?, ?, ?)
       ON CONFLICT (program_id, account_id) DO UPDATE SET payment_id = excluded.payment_id
       WHERE program_owners.payment_id IS NULL OR program_owners.payment_id <> excluded.payment_id RETURNING program_id`,
      [m.program, m.buyer, now, paymentId],
    );
    // Stripe sends an event more than once now and then: the coach hears about each sale once.
    if (fresh.length)
      await notifyCoach(coach, "coachProgramSold", { name: await nameOf(m.buyer), text: String(r.title) }, "#/trainer/programs");
    return true;
  }
  if (e.type === "charge.refunded") {
    // A full refund takes the program back. Matched by the payment, on the coach's own account only.
    const pi = str(o.payment_intent);
    if (!o.refunded || !e.account || !pi) return false;
    const coach = await coachOfStripe(e.account);
    if (!coach) return false;
    const gone = await query<{ program_id: string }>(
      "DELETE FROM program_owners WHERE payment_id = ? AND program_id IN (SELECT id FROM coach_programs WHERE coach_id = ?) RETURNING program_id",
      [pi, coach],
    );
    return gone.length > 0;
  }
  return false;
}

/** Deleting an account: the programs it has, and the programs it made (people who bought one keep their saved routines). */
export const programCleanup = (accountId: string) => [
  { sql: "DELETE FROM program_owners WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM program_owners WHERE program_id IN (SELECT id FROM coach_programs WHERE coach_id = ?)", args: [accountId] },
  { sql: "DELETE FROM coach_programs WHERE coach_id = ?", args: [accountId] },
];

export async function forgetPrograms(accountId: string): Promise<void> {
  await batch(programCleanup(accountId));
}
