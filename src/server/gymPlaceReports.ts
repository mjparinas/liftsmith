// Reporting a problem with a real gym's page (Melvin, 2026-11-15: "how do i report an unclaimed gym"; docs/decisions/gyms.md
// "Reporting a gym page"). Anyone can report a gym's page from the website (/gyms/<city>/<gym>/report/, no scripts) or the
// app (the gym's page, SharedGym.tsx): wrong details, closed for good, listed twice, not a gym, or something else, with
// an optional note. Reports wait on Admin › Reports, where staff dismiss them, hide the page, merge it into the gym it
// duplicates, or fix its details. Nothing is hidden by reports alone: a gym's page is a business's listing, and a
// rival could otherwise take it down.
import { randomBytes } from "node:crypto";

import { isPlaceReportReason, PLACE_REPORT_LIMITS, type PlaceReportAction, type PlaceReportReason } from "@/lib/gymPlaceReport";

import { batch, query, rateLimit, run, type Row } from "./db";
import { dropPictures, pictureUrls } from "./gymBlob";
import { refreshChainsQuietly } from "./gymChains";
import { classEnds } from "./gymClasses";
import { isPlaceId, type PlaceKind } from "./gymPlaces";
import { staffEnds } from "./gymStaff";

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const newId = () => randomBytes(8).toString("hex");

/** Trims a note to one tidy paragraph. Staff are the only readers, so links stay (a duplicate's address is useful). */
const tidyNote = (x: unknown) =>
  s(x)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PLACE_REPORT_LIMITS.note);

export type PlaceReportResult = { ok: true } | { ok: false; error: "gone" | "reason" | "slow" };

/** A report on a gym's page. One open report per person per gym: a second one replaces the first's reason and note. */
export async function reportPlace(
  who: string,
  place: unknown,
  reason: unknown,
  note: unknown,
  now = Date.now(),
): Promise<PlaceReportResult> {
  if (!isPlaceReportReason(reason)) return { ok: false, error: "reason" };
  if (!isPlaceId(place)) return { ok: false, error: "gone" };
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND hidden = 0 AND pending = 0", [place]);
  if (!p) return { ok: false, error: "gone" };
  if (!(await rateLimit(`gyms:placeReport:${who}`, PLACE_REPORT_LIMITS.perDay, 86_400_000, now))) return { ok: false, error: "slow" };
  await run(
    `INSERT INTO gym_place_reports (id, place_id, reason, note, who, created_at, status) VALUES (?, ?, ?, ?, ?, ?, 'open')
     ON CONFLICT (place_id, who) WHERE status = 'open' DO UPDATE SET reason = excluded.reason, note = excluded.note, created_at = excluded.created_at`,
    [newId(), place, reason, tidyNote(note), who, now],
  );
  return { ok: true };
}

// --- Staff: Admin › Reports ---

export interface PlaceReportLine {
  reason: PlaceReportReason;
  note: string;
  at: number;
}

export interface ReportedPlace {
  id: string;
  citySlug: string;
  slug: string;
  name: string;
  kind: PlaceKind;
  address: string;
  city: string;
  region: string;
  website: string;
  phone: string;
  hours: string;
  official: boolean;
  hidden: boolean;
  lifters: number;
  reports: number;
  lastAt: number;
  /** The newest reports first, at most 20. */
  lines: PlaceReportLine[];
}

const toReported = (r: Row, lines: PlaceReportLine[]): ReportedPlace => ({
  id: s(r.id),
  citySlug: s(r.city_slug),
  slug: s(r.slug),
  name: s(r.name),
  kind: s(r.kind) === "studio" ? "studio" : "gym",
  address: s(r.address),
  city: s(r.city),
  region: s(r.region),
  website: s(r.website),
  phone: s(r.phone),
  hours: s(r.hours),
  official: !!s(r.claimed_by),
  hidden: !!n(r.hidden),
  lifters: n(r.lifters),
  reports: n(r.reports),
  lastAt: n(r.last_at),
  lines,
});

/** Gym pages with open reports, newest report first. */
export async function reportedPlaces(): Promise<ReportedPlace[]> {
  const rows = await query(
    `SELECT p.id, p.city_slug, p.slug, p.name, p.kind, p.address, p.city, p.region, p.website, p.phone, p.hours, p.claimed_by,
       p.hidden, p.lifters, COUNT(*) AS reports, MAX(r.created_at) AS last_at
     FROM gym_place_reports r JOIN gym_places p ON p.id = r.place_id
     WHERE r.status = 'open' GROUP BY p.id ORDER BY last_at DESC LIMIT 100`,
  );
  if (!rows.length) return [];
  const ids = rows.map((r) => s(r.id));
  const lines = await query(
    `SELECT place_id, reason, note, created_at FROM gym_place_reports WHERE status = 'open' AND place_id IN (${ids.map(() => "?").join(",")})
     ORDER BY created_at DESC`,
    ids,
  );
  const by = new Map<string, PlaceReportLine[]>();
  for (const l of lines) {
    const list = by.get(s(l.place_id)) ?? [];
    const reason = s(l.reason);
    if (list.length < 20 && isPlaceReportReason(reason)) list.push({ reason, note: s(l.note), at: n(l.created_at) });
    by.set(s(l.place_id), list);
  }
  return rows.map((r) => toReported(r, by.get(s(r.id)) ?? []));
}

/** How many gym pages wait for a decision, and when the newest report came (Admin › To do). */
export async function placeReportCount(): Promise<{ count: number; last: number }> {
  const [r] = await query("SELECT COUNT(DISTINCT place_id) AS n, MAX(created_at) AS last FROM gym_place_reports WHERE status = 'open'");
  return { count: n(r?.n), last: n(r?.last) };
}

/** "/gyms/langley-bc/some-gym/", a full gym page address, or a gym's id → that gym's id, if it exists and shows. */
export async function placeIdFrom(x: unknown): Promise<string | null> {
  const v = s(x).trim();
  if (isPlaceId(v)) {
    const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND hidden = 0", [v]);
    return p ? s(p.id) : null;
  }
  const m = /\/gyms\/([a-z0-9-]+)\/([a-z0-9-]+)\/?/.exec(v);
  if (!m) return null;
  const [p] = await query("SELECT id FROM gym_places WHERE city_slug = ? AND slug = ? AND hidden = 0", [m[1]!, m[2]!]);
  return p ? s(p.id) : null;
}

/** Details staff can fix from a report. The city stays with Admin › Gyms, which also keeps the old address working. */
export const EDIT_FIELDS = { name: 120, address: 200, website: 300, phone: 40, hours: 300 } as const;

export type DecideResult = { ok: true } | { ok: false; error: string };

/**
 * Staff decide on a reported gym page. `dismiss` closes the reports and changes nothing; `hide` takes the page down;
 * `merge` moves its lifters to the gym it duplicates (`into`: that gym's page address or id), hides it and sends its
 * page and app link there; `edit` fixes its details; `delete` removes it for good (deletePlace). Every action but
 * dismiss closes the reports as done.
 */
export async function decidePlace(
  staff: string,
  id: unknown,
  action: PlaceReportAction | string,
  body: Record<string, unknown> = {},
  now = Date.now(),
): Promise<DecideResult> {
  if (!isPlaceId(id)) return { ok: false, error: "Which gym?" };
  const [p] = await query("SELECT id, claimed_by FROM gym_places WHERE id = ?", [id]);
  if (!p) return { ok: false, error: "That gym is gone." };
  const close = (status: "done" | "dismissed") => ({
    sql: "UPDATE gym_place_reports SET status = ?, decided_at = ?, decided_by = ? WHERE place_id = ? AND status = 'open'",
    args: [status, now, staff, id],
  });
  switch (action) {
    case "dismiss":
      await batch([close("dismissed")]);
      return { ok: true };
    case "hide":
      await batch([{ sql: "UPDATE gym_places SET hidden = 1, updated_at = ? WHERE id = ?", args: [now, id] }, close("done")]);
      return { ok: true };
    case "merge": {
      if (s(p.claimed_by)) return { ok: false, error: "This gym is claimed by its owner. Merge the other gym into it instead." };
      const into = await placeIdFrom(body.into);
      if (!into) return { ok: false, error: "Paste the page address of the gym to keep." };
      if (into === id) return { ok: false, error: "That's the same gym." };
      await batch([
        {
          sql: "INSERT OR IGNORE INTO gym_place_lifters (place_id, who, created_at) SELECT ?, who, created_at FROM gym_place_lifters WHERE place_id = ?",
          args: [into, id],
        },
        { sql: "DELETE FROM gym_place_lifters WHERE place_id = ?", args: [id] },
        { sql: "UPDATE public_gyms SET place_id = ? WHERE place_id = ?", args: [into, id] },
        {
          sql: "UPDATE gym_places SET lifters = (SELECT COUNT(*) FROM gym_place_lifters WHERE place_id = ?), updated_at = ? WHERE id = ?",
          args: [into, now, into],
        },
        { sql: "UPDATE gym_places SET hidden = 1, lifters = 0, merged_into = ?, updated_at = ? WHERE id = ?", args: [into, now, id] },
        // Gyms merged into this one earlier follow it to the new one.
        { sql: "UPDATE gym_places SET merged_into = ? WHERE merged_into = ?", args: [into, id] },
        close("done"),
      ]);
      return { ok: true };
    }
    case "edit": {
      const sets: string[] = [];
      const args: (string | number)[] = [];
      for (const [field, max] of Object.entries(EDIT_FIELDS)) {
        if (typeof body[field] !== "string") continue;
        const v = (body[field] as string).replace(/\s+/g, " ").trim().slice(0, max);
        if (field === "name" && !v) return { ok: false, error: "A gym needs a name." };
        if (field === "website" && v && !/^https?:\/\/[^\s]+$/i.test(v)) return { ok: false, error: "The website starts with https://" };
        sets.push(`${field} = ?`);
        args.push(v);
      }
      if (body.kind === "gym" || body.kind === "studio") {
        sets.push("kind = ?");
        args.push(body.kind);
      }
      if (!sets.length) return { ok: false, error: "Nothing to change." };
      await batch([
        { sql: `UPDATE gym_places SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`, args: [...args, now, id] },
        close("done"),
      ]);
      return { ok: true };
    }
    case "delete":
      return deletePlace(staff, id, now);
    default:
      return { ok: false, error: "Dismiss, hide, merge, edit or delete?" };
  }
}

/**
 * Deletes a gym that was never a gym (a knife shop, a parked domain) for good (Melvin, 2026-11-19: "these gyms need to be
 * deleted not edited"). Its page and app link stop working, its pictures leave the picture store, lifters who linked it
 * keep their own gym without the link, and its map id is remembered (gym_places_deleted) so no import or daily refresh
 * adds it again. A claimed gym can't be deleted: it's a business's own page, so staff hide it instead. Its reports stay,
 * closed as done, for the record; its chain's counts are worked out again.
 */
export async function deletePlace(staff: string, id: string, now = Date.now()): Promise<DecideResult> {
  const [p] = await query("SELECT id, name, city, region, source_ref, chain, claimed_by FROM gym_places WHERE id = ?", [id]);
  if (!p) return { ok: false, error: "That gym is gone." };
  if (s(p.claimed_by)) return { ok: false, error: "This gym is claimed by its owner, so it can't be deleted. Hide it instead." };
  const urls = await pictureUrls(id);
  const ref = s(p.source_ref);
  const city = [s(p.city), s(p.region)].filter(Boolean).join(", ");
  await batch([
    ...(ref
      ? [
          {
            sql: "INSERT OR REPLACE INTO gym_places_deleted (source_ref, name, city, deleted_by, at) VALUES (?, ?, ?, ?, ?)",
            args: [ref, s(p.name), city, staff, now],
          },
        ]
      : []),
    { sql: "DELETE FROM gym_photos WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_place_lifters WHERE place_id = ?", args: [id] },
    { sql: "UPDATE public_gyms SET place_id = '' WHERE place_id = ?", args: [id] },
    { sql: "UPDATE clubs SET place_id = '' WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_news WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_issues WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_trainers WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_scan_days WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_posters WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_claims WHERE place_id = ?", args: [id] },
    { sql: "DELETE FROM gym_moves WHERE place_id = ?", args: [id] },
    ...staffEnds(id),
    ...classEnds(id),
    { sql: "DELETE FROM gym_places WHERE id = ? AND claimed_by = ''", args: [id] },
    {
      sql: "UPDATE gym_place_reports SET status = 'done', decided_at = ?, decided_by = ? WHERE place_id = ? AND status = 'open'",
      args: [now, staff, id],
    },
  ]);
  await dropPictures(urls);
  if (s(p.chain)) await refreshChainsQuietly(now);
  return { ok: true };
}

/** Where a merged gym went: its id → the kept gym's id, following a chain at most a few steps. */
export async function mergedTarget(id: string): Promise<string | null> {
  let at = id;
  for (let i = 0; i < 4; i++) {
    const [r] = await query("SELECT merged_into FROM gym_places WHERE id = ?", [at]);
    const next = s(r?.merged_into);
    if (!next) return at === id ? null : at;
    at = next;
  }
  return at;
}

/** A merged gym's old page address → the kept gym's page path, or null. */
export async function mergedPath(citySlug: string, slug: string): Promise<string | null> {
  const [r] = await query("SELECT id FROM gym_places WHERE city_slug = ? AND slug = ? AND merged_into <> ''", [citySlug, slug]);
  if (!r) return null;
  const to = await mergedTarget(s(r.id));
  if (!to) return null;
  const [p] = await query("SELECT city_slug, slug FROM gym_places WHERE id = ? AND hidden = 0", [to]);
  return p ? `/gyms/${s(p.city_slug)}/${s(p.slug)}/` : null;
}

/** On account deletion: their reports stay for staff, but no longer say who sent them. */
export const placeReportDeletes = (accountId: string) => [
  { sql: "UPDATE gym_place_reports SET who = 'gone:' || id WHERE who = ?", args: [`acc:${accountId}`] },
];
