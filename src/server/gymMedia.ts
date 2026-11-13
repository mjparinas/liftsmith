// A gym's map, logo and photos (Melvin, 2026-11-12, docs/decisions/gyms.md).
//
// The map: a static picture from Mapbox (Melvin chose it), drawn for the gym's position and passed through our own
// server, so the gym pages' strict CSP (images only from our origin) holds and the token never leaves the server. Off
// until MAPBOX_TOKEN is set in Vercel.
//
// The logo and photos: the owner adds them on the owner's page. The app turns each into a JPEG (a logo up to 512 px, a
// photo up to 1600 px) before it's sent, and we keep it in the database, like share cards. One logo and six photos a
// gym; staff can take them all down from Admin › Gyms (actOnPlace "pictures").
import { randomBytes } from "node:crypto";

import { query, rateLimit, run } from "./db";
import { isPlaceId } from "./gymPlaces";

export const MEDIA_LIMITS = {
  /** Bytes of one JPEG. */
  logo: 150_000,
  photo: 450_000,
  photos: 6,
};

/** Request bodies: a base64 JPEG plus a little JSON. */
export const MEDIA_BODY = Math.ceil((MEDIA_LIMITS.photo * 4) / 3) + 2_000;

export type MediaKind = "logo" | "photo";
const isMediaId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

export interface GymMedia {
  logo: string;
  photos: string[];
}

/** The ids of a gym's logo and photos, oldest photo first. */
export async function mediaOf(placeId: string): Promise<GymMedia> {
  const rows = await query("SELECT id, kind FROM gym_photos WHERE place_id = ? ORDER BY created_at, id", [placeId]);
  return {
    logo: String(rows.find((r) => r.kind === "logo")?.id ?? ""),
    photos: rows.filter((r) => r.kind === "photo").map((r) => String(r.id)),
  };
}

export type MediaResult = { ok: true; id: string } | { ok: false; error: "owner" | "image" | "big" | "full" | "slow" };

/** The owner adds a logo (replacing the old one) or a photo. Thirty a day per account. */
export async function addMedia(accountId: string, body: Record<string, unknown>, now = Date.now()): Promise<MediaResult> {
  const kind: MediaKind | null = body.kind === "logo" ? "logo" : body.kind === "photo" ? "photo" : null;
  if (!kind || !isPlaceId(body.place)) return { ok: false, error: "image" };
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND claimed_by = ?", [body.place, accountId]);
  if (!p) return { ok: false, error: "owner" };
  const m = typeof body.image === "string" ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(body.image) : null;
  if (!m?.[1]) return { ok: false, error: "image" };
  const image = Buffer.from(m[1], "base64");
  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) return { ok: false, error: "image" };
  if (image.length > MEDIA_LIMITS[kind]) return { ok: false, error: "big" };
  if (kind === "photo") {
    const [c] = await query("SELECT COUNT(*) AS n FROM gym_photos WHERE place_id = ? AND kind = 'photo'", [body.place]);
    if (Number(c?.n ?? 0) >= MEDIA_LIMITS.photos) return { ok: false, error: "full" };
  }
  if (!(await rateLimit(`gyms:media:${accountId}`, 30, 86_400_000, now))) return { ok: false, error: "slow" };
  if (kind === "logo") await run("DELETE FROM gym_photos WHERE place_id = ? AND kind = 'logo'", [body.place]);
  const id = randomBytes(8).toString("hex");
  await run("INSERT INTO gym_photos (id, place_id, kind, image, created_at) VALUES (?, ?, ?, ?, ?)", [id, body.place, kind, image, now]);
  await run("UPDATE gym_places SET updated_at = ? WHERE id = ?", [now, body.place]);
  return { ok: true, id };
}

/** The owner takes one down. */
export async function removeMedia(accountId: string, placeId: unknown, id: unknown): Promise<boolean> {
  if (!isPlaceId(placeId) || !isMediaId(id)) return false;
  const [p] = await query("SELECT id FROM gym_places WHERE id = ? AND claimed_by = ?", [placeId, accountId]);
  if (!p) return false;
  return (await run("DELETE FROM gym_photos WHERE id = ? AND place_id = ?", [id, placeId])) > 0;
}

/** One picture's bytes, for /api/gyms/photo/?id=. */
export async function mediaImage(id: unknown): Promise<Buffer | null> {
  if (!isMediaId(id)) return null;
  const [r] = await query<{ image: ArrayBuffer | Uint8Array }>("SELECT image FROM gym_photos WHERE id = ?", [id]);
  if (!r?.image) return null;
  return Buffer.from(r.image instanceof Uint8Array ? r.image : new Uint8Array(r.image));
}

// --- The map ---

export const hasMap = () => !!process.env.MAPBOX_TOKEN;

/** Our own address for a gym's map picture (/api/gyms/map/?place=), or '' while Mapbox isn't set up. */
export const mapPath = (placeId: string) => (hasMap() ? `/api/gyms/map/?place=${placeId}` : "");

/**
 * The Mapbox Static Images address for a spot: a dark street map at street level with a pin in the brand blue, 640 by
 * 320 at twice the pixels. Mapbox's logo stays on the picture and the page credits Mapbox and OpenStreetMap, as their
 * terms ask.
 */
export function mapboxUrl(lat: number, lon: number, token: string): string {
  const at = `${lon.toFixed(5)},${lat.toFixed(5)}`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+4c8dff(${at})/${at},15,0/640x320@2x?attribution=false&access_token=${encodeURIComponent(token)}`;
}

/** The map picture for a gym, fetched from Mapbox. Null when there's no token, no gym, or Mapbox didn't answer. */
export async function mapImage(placeId: unknown, fetcher: typeof fetch = fetch): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || !isPlaceId(placeId)) return null;
  const [p] = await query("SELECT lat, lon FROM gym_places WHERE id = ? AND hidden = 0", [placeId]);
  if (!p) return null;
  const r = await fetcher(mapboxUrl(Number(p.lat), Number(p.lon), token)).catch(() => null);
  if (!r?.ok) return null;
  return { bytes: await r.arrayBuffer(), type: r.headers.get("content-type") ?? "image/png" };
}

// --- A map of many gyms (Melvin, 2026-11-13: "a map of all the nearest gyms with a list beneath it") ---

/** Pins one area map carries: the list's first gyms, numbered as the list numbers them. */
export const AREA_PINS = 20;

/**
 * Our address for a map of several gyms (Find gyms near you and the city pages): their ids in list order, so pin 1 is
 * always the list's first gym whatever changed since, plus the searcher's spot (already rounded to about 1 km) as a
 * plain marker. '' while Mapbox isn't set up or there's nothing to show.
 */
export function areaMapPath(ids: readonly string[], at?: { lat: number; lon: number }): string {
  const list = ids.filter(isPlaceId).slice(0, AREA_PINS);
  if (!hasMap() || !list.length) return "";
  const here = at ? `&at=${at.lat.toFixed(2)},${at.lon.toFixed(2)}` : "";
  return `/api/gyms/map/?ids=${list.join(".")}${here}`;
}

/** The Mapbox address for numbered gym pins (and the searcher's spot in cyan), framed to fit them all. */
export function areaMapboxUrl(
  points: readonly { lat: number; lon: number }[],
  at: { lat: number; lon: number } | null,
  token: string,
): string {
  const ll = (p: { lat: number; lon: number }) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`;
  const pins = points.map((p, i) => `pin-s-${i + 1}+4c8dff(${ll(p)})`);
  if (at) pins.push(`pin-s+38d6e8(${ll(at)})`);
  // One spot alone would zoom all the way in, so it gets the single gym's street view instead of "auto".
  const view = pins.length === 1 ? `${ll(points[0] ?? at!)},14,0` : "auto";
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pins.join(",")}/${view}/640x360@2x?padding=40&attribution=false&access_token=${encodeURIComponent(token)}`;
}

const coord = (raw: string | null): { lat: number; lon: number } | null => {
  const m = /^(-?\d{1,2}(?:\.\d{1,2})?),(-?\d{1,3}(?:\.\d{1,2})?)$/.exec(raw ?? "");
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
};

/** The picture for `areaMapPath`. Null when there's no token, no known gym among the ids, or Mapbox didn't answer. */
export async function areaMapImage(
  idsParam: string | null,
  atParam: string | null,
  fetcher: typeof fetch = fetch,
): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  const token = process.env.MAPBOX_TOKEN;
  const ids = (idsParam ?? "").split(".").filter(isPlaceId).slice(0, AREA_PINS);
  if (!token || !ids.length) return null;
  const rows = await query(`SELECT id, lat, lon FROM gym_places WHERE hidden = 0 AND id IN (${ids.map(() => "?").join(",")})`, ids);
  const at = new Map(rows.map((r) => [String(r.id), { lat: Number(r.lat), lon: Number(r.lon) }]));
  const points = ids.flatMap((id) => at.get(id) ?? []);
  if (!points.length) return null;
  const r = await fetcher(areaMapboxUrl(points, coord(atParam), token)).catch(() => null);
  if (!r?.ok) return null;
  return { bytes: await r.arrayBuffer(), type: r.headers.get("content-type") ?? "image/png" };
}
