// Booking and scheduling sessions (Melvin, 2026-11-13: "booking and scheduling sessions"). A coach or personal trainer
// opens times (once, or the same time each week for a few weeks), and either books a client into one or leaves it open
// for their clients to book. Either side can cancel: a client's cancel opens the time again, a coach's removes it.
// Times are UTC milliseconds; the phones show them in their own time zone. A push tells the other side, worded with the
// time as the sender's phone wrote it (`label`), because the server doesn't know anyone's time zone. Decision record:
// docs/decisions/trainer-mode.md "Booking".
import { randomBytes } from "node:crypto";

import { isAccountId, isClient, nameOf } from "./coach";
import { batch, query, run } from "./db";
import { notifyCoach } from "./push";

export const BOOK_LIMITS = {
  /** A session's length in minutes. */
  minutes: [15, 240] as const,
  place: 80,
  label: 80,
  /** How far ahead a time can be opened. */
  aheadMs: 120 * 86_400_000,
  /** The most weeks one "every week" adds. */
  weeks: 12,
  /** Upcoming times a coach can have at once. */
  open: 300,
  /** A session already started stays on the lists this long. */
  graceMs: 2 * 3_600_000,
};

export interface Slot {
  id: string;
  coachId: string;
  start: number;
  minutes: number;
  place: string;
  clientId: string | null;
  bookedAt: number | null;
}

interface SlotRow {
  id: string;
  coach_id: string;
  start_at: number;
  minutes: number;
  place: string;
  client_id: string | null;
  booked_at: number | null;
}

const slot = (r: SlotRow): Slot => ({
  id: String(r.id),
  coachId: String(r.coach_id),
  start: Number(r.start_at),
  minutes: Number(r.minutes),
  place: String(r.place ?? ""),
  clientId: r.client_id ? String(r.client_id) : null,
  bookedAt: r.booked_at === null || r.booked_at === undefined ? null : Number(r.booked_at),
});

const newId = () => randomBytes(9).toString("base64url");
const line = (x: unknown, max: number) =>
  typeof x === "string"
    ? x
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
        .trim()
    : "";

export type SlotError = "bad" | "notClient" | "full" | "taken" | "unknown";

/**
 * Opens times: `start` (ms), `minutes`, optional `place`, `weeks` (1 = once, up to 12 for the same time each week) and
 * optionally `client`, to book that client straight in. Times in the past or too far ahead are refused.
 */
export async function addSlots(
  coachId: string,
  x: { start?: unknown; minutes?: unknown; place?: unknown; weeks?: unknown; client?: unknown; label?: unknown },
  now = Date.now(),
): Promise<Slot[] | { error: SlotError }> {
  const start = typeof x.start === "number" && Number.isFinite(x.start) ? Math.round(x.start) : NaN;
  const minutes = typeof x.minutes === "number" ? Math.round(x.minutes) : NaN;
  const weeks = typeof x.weeks === "number" ? Math.min(BOOK_LIMITS.weeks, Math.max(1, Math.round(x.weeks))) : 1;
  const [lo, hi] = BOOK_LIMITS.minutes;
  if (!(start > now) || start > now + BOOK_LIMITS.aheadMs || !(minutes >= lo && minutes <= hi)) return { error: "bad" };
  let client: string | null = null;
  if (x.client !== undefined && x.client !== null) {
    if (!isAccountId(x.client) || !(await isClient(coachId, x.client))) return { error: "notClient" };
    client = x.client;
  }
  const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_slots WHERE coach_id = ? AND start_at > ?", [coachId, now]);
  if (Number(n?.n ?? 0) + weeks > BOOK_LIMITS.open) return { error: "full" };
  const place = line(x.place, BOOK_LIMITS.place);
  const slots: Slot[] = Array.from({ length: weeks }, (_, i) => ({
    id: newId(),
    coachId,
    // The same wall-clock time a week apart; a daylight saving change moves it by an hour, which the coach can fix.
    start: start + i * 7 * 86_400_000,
    minutes,
    place,
    clientId: client,
    bookedAt: client ? now : null,
  }));
  await batch(
    slots.map((s) => ({
      sql: "INSERT INTO coach_slots (id, coach_id, start_at, minutes, place, client_id, booked_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [s.id, coachId, s.start, s.minutes, s.place, s.clientId, s.bookedAt],
    })),
  );
  const label = line(x.label, BOOK_LIMITS.label);
  if (client && label) await notifyCoach(client, "coachBooked", { name: await nameOf(coachId), text: label }, "#/trainer");
  return slots;
}

/** A coach's own times from now on (and ones that just started), soonest first. */
export async function coachSlots(coachId: string, now = Date.now()): Promise<Slot[]> {
  const rows = await query<SlotRow>("SELECT * FROM coach_slots WHERE coach_id = ? AND start_at > ? ORDER BY start_at LIMIT ?", [
    coachId,
    now - BOOK_LIMITS.graceMs,
    BOOK_LIMITS.open,
  ]);
  return rows.map(slot);
}

/**
 * What a client sees: their own booked sessions with any coach, and their coaches' open times. Other clients'
 * bookings never show, not even as taken.
 */
export async function clientSlots(clientId: string, now = Date.now()): Promise<{ booked: Slot[]; open: Slot[] }> {
  const booked = await query<SlotRow>("SELECT * FROM coach_slots WHERE client_id = ? AND start_at > ? ORDER BY start_at LIMIT 50", [
    clientId,
    now - BOOK_LIMITS.graceMs,
  ]);
  const open = await query<SlotRow>(
    `SELECT s.* FROM coach_slots s JOIN coach_links l ON l.coach_id = s.coach_id AND l.client_id = ?
      WHERE s.client_id IS NULL AND s.start_at > ? ORDER BY s.start_at LIMIT 100`,
    [clientId, now],
  );
  return { booked: booked.map(slot), open: open.map(slot) };
}

/** The sessions a coach has with one client, for their report. */
export async function slotsWith(coachId: string, clientId: string, now = Date.now()): Promise<Slot[]> {
  const rows = await query<SlotRow>(
    "SELECT * FROM coach_slots WHERE coach_id = ? AND client_id = ? AND start_at > ? ORDER BY start_at LIMIT 20",
    [coachId, clientId, now - BOOK_LIMITS.graceMs],
  );
  return rows.map(slot);
}

/** A client books an open time with one of their coaches. Two clients tapping the same time: only one gets it. */
export async function book(clientId: string, id: unknown, label: unknown, now = Date.now()): Promise<Slot | { error: SlotError }> {
  if (typeof id !== "string") return { error: "unknown" };
  const [r] = await query<SlotRow>(
    `UPDATE coach_slots SET client_id = ?, booked_at = ?
      WHERE id = ? AND client_id IS NULL AND start_at > ?
        AND EXISTS (SELECT 1 FROM coach_links l WHERE l.coach_id = coach_slots.coach_id AND l.client_id = ?)
      RETURNING *`,
    [clientId, now, id, now, clientId],
  );
  if (!r) {
    const [seen] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_slots WHERE id = ?", [id]);
    return { error: Number(seen?.n ?? 0) ? "taken" : "unknown" };
  }
  const s = slot(r);
  const text = line(label, BOOK_LIMITS.label);
  if (text) await notifyCoach(s.coachId, "coachBooked", { name: await nameOf(clientId), text }, `#/trainer/c.${clientId}`);
  return s;
}

/**
 * Cancels a session. The client's cancel opens the time again for others; the coach's removes the time (and tells
 * the client who had it).
 */
export async function cancelSlot(
  accountId: string,
  id: unknown,
  label: unknown,
  now = Date.now(),
): Promise<{ ok: true } | { error: SlotError }> {
  if (typeof id !== "string") return { error: "unknown" };
  const [r] = await query<SlotRow>("SELECT * FROM coach_slots WHERE id = ?", [id]);
  if (!r) return { error: "unknown" };
  const s = slot(r);
  const text = line(label, BOOK_LIMITS.label);
  if (s.coachId === accountId) {
    await run("DELETE FROM coach_slots WHERE id = ?", [id]);
    if (s.clientId && s.start > now && text)
      await notifyCoach(s.clientId, "coachCancelled", { name: await nameOf(accountId), text }, "#/trainer");
    return { ok: true };
  }
  if (s.clientId !== accountId) return { error: "unknown" };
  await run("UPDATE coach_slots SET client_id = NULL, booked_at = NULL WHERE id = ? AND client_id = ?", [id, accountId]);
  if (s.start > now && text)
    await notifyCoach(s.coachId, "coachCancelled", { name: await nameOf(accountId), text }, `#/trainer/c.${accountId}`);
  return { ok: true };
}
