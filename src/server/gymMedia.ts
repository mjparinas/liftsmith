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
