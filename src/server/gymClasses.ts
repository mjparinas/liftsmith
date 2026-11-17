// A gym's class schedule, the server side (Melvin, 2026-11-17; shared rules in src/lib/gymClasses.ts, decision record
// docs/decisions/gyms.md "Class schedules"). Only an official gym's owner or staff (gymStaff.ts canManage) add, change
// or remove classes; anyone can read them, on the gym's page in the app (placeById) and on the website (gymPage.ts).
// A gym that's released or deleted loses its schedule, because nobody keeps it up to date after that.
import { randomBytes } from "node:crypto";

import { byStart, CLASS_LIMITS, cleanClass, cleanDays, cleanOff, isClassKind, type GymClass } from "@/lib/gymClasses";

import { query, rateLimit, run } from "./db";
import { isPlaceId } from "./gymPlaces";
import { canManage } from "./gymStaff";
import { checkText } from "./moderation";

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const newId = () => randomBytes(8).toString("hex");
const isId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

/** A date off more than two days back can't matter in any time zone, so it's dropped when read. */
const KEEP_OFF_MS = 2 * 86_400_000;
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type Row = Record<string, unknown>;
const toClass = (r: Row, now: number): GymClass => {
  const since = utcDay(now - KEEP_OFF_MS);
  return {
    id: s(r.id),
    name: s(r.name),
    kind: isClassKind(r.kind) ? r.kind : "other",
    days: cleanDays(s(r.days)),
    start: s(r.start),
    minutes: n(r.minutes),
    coach: s(r.coach),
    room: s(r.room),
    note: s(r.note),
    off: cleanOff(s(r.off)).filter((d) => d >= since),
  };
};

/** The gym's classes in start order. Only official gyms show a schedule. */
export async function classesOf(placeId: string, now = Date.now()): Promise<GymClass[]> {
  const rows = await query(
    `SELECT c.id, c.name, c.kind, c.days, c.start, c.minutes, c.coach, c.room, c.note, c.off FROM gym_classes c
       JOIN gym_places p ON p.id = c.place_id
     WHERE c.place_id = ? AND p.claimed_by <> '' LIMIT ?`,
    [placeId, CLASS_LIMITS.perGym],
  );
  return rows
    .map((r) => toClass(r, now))
    .filter((c) => c.days.length)
    .sort(byStart);
}

export type ClassResult = { ok: true; cls: GymClass } | { ok: false; error: "owner" | "bad" | "full" | "slow" | "words" | "link" | "gone" };

async function managed(accountId: string, placeId: unknown): Promise<string | null> {
  if (!isPlaceId(placeId)) return null;
  const [p] = await query("SELECT id, claimed_by FROM gym_places WHERE id = ? AND hidden = 0", [placeId]);
  if (!p || !s(p.claimed_by) || !(await canManage(accountId, s(p.id)))) return null;
  return s(p.id);
}

/** Words the gym typed: required for the name, optional for the rest, and through the same filter as announcements. */
function checked(c: Omit<GymClass, "id">): Omit<GymClass, "id"> | "words" | "link" {
  const out = { ...c };
  for (const k of ["name", "coach", "room", "note"] as const) {
    if (!out[k]) continue;
    const v = checkText(out[k], CLASS_LIMITS[k]);
    if (!v.ok) return v.error === "link" ? "link" : "words";
    out[k] = v.text;
  }
  return out;
}

/** The owner or staff add a class (no `id`) or change one (its `id`). */
export async function saveClass(accountId: string, placeId: unknown, raw: unknown, now = Date.now()): Promise<ClassResult> {
  const place = await managed(accountId, placeId);
  if (!place) return { ok: false, error: "owner" };
  const tidy = cleanClass(raw);
  if (!tidy) return { ok: false, error: "bad" };
  const c = checked(tidy);
  if (c === "words" || c === "link") return { ok: false, error: c };
  if (!(await rateLimit(`gyms:classes:${place}`, CLASS_LIMITS.changesPerDay, 86_400_000, now))) return { ok: false, error: "slow" };
  const id = (raw as Record<string, unknown>).id;
  const values = [c.name, c.kind, c.days.join(","), c.start, c.minutes, c.coach, c.room, c.note, c.off.join(",")];
  if (id !== undefined && id !== "") {
    if (!isId(id)) return { ok: false, error: "bad" };
    const changed = await run(
      `UPDATE gym_classes SET name = ?, kind = ?, days = ?, start = ?, minutes = ?, coach = ?, room = ?, note = ?, off = ?, updated_at = ?
       WHERE id = ? AND place_id = ?`,
      [...values, now, id, place],
    );
    return changed > 0 ? { ok: true, cls: { id, ...c } } : { ok: false, error: "gone" };
  }
  const [count] = await query("SELECT COUNT(*) AS n FROM gym_classes WHERE place_id = ?", [place]);
  if (n(count?.n) >= CLASS_LIMITS.perGym) return { ok: false, error: "full" };
  const fresh = newId();
  await run(
    `INSERT INTO gym_classes (id, place_id, account_id, name, kind, days, start, minutes, coach, room, note, off, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [fresh, place, accountId, ...values, now, now],
  );
  return { ok: true, cls: { id: fresh, ...c } };
}

export async function deleteClass(accountId: string, placeId: unknown, id: unknown): Promise<boolean> {
  const place = await managed(accountId, placeId);
  if (!place || !isId(id)) return false;
  return (await run("DELETE FROM gym_classes WHERE id = ? AND place_id = ?", [id, place])) > 0;
}

/** A released or deleted gym's schedule goes with it. */
export const classEnds = (placeId: string) => [{ sql: "DELETE FROM gym_classes WHERE place_id = ?", args: [placeId] }];

/** Account deletion: the classes stay with the gym, without saying who added them. */
export const classDeletes = (accountId: string) => [
  { sql: "UPDATE gym_classes SET account_id = '' WHERE account_id = ?", args: [accountId] },
];
