// Where a gym's pictures live (Melvin, 2026-11-19: moved off the database, docs/decisions/gyms.md "Pictures in Vercel Blob").
//
// Owners' logos and photos and websites' icons are kept as files in Vercel Blob (`gyms/<id>`), and `gym_photos` keeps
// only the file's address in `url` (its `image` is left empty). Pages and the apps still load every picture from our own
// /api/gyms/photo/?id=, which reads the file and answers with it under a one-year immutable cache, so the gym pages'
// image policy (our origin only), the addresses the apps have cached and the ids all stay the same.
//
// Off until BLOB_READ_WRITE_TOKEN is set (Vercel adds it when a Blob store is connected to the project): then pictures
// stay in the database as before, and once it's set the gym import worker moves the old ones over (movePictures).
import { del, put } from "@vercel/blob";

import { batch, query } from "./db";
import { imageType, measureIcons } from "./gymEnrich";

/** The few things we ask of the file store, so tests can stand in for it. */
export interface PictureStore {
  put(path: string, bytes: Uint8Array, type: string): Promise<string>;
  del(urls: string[]): Promise<void>;
  get(url: string): Promise<Uint8Array | null>;
}

const YEAR = 31_536_000;

const vercelStore: PictureStore = {
  async put(path, bytes, type) {
    const r = await put(path, Buffer.from(bytes), {
      access: "public",
      contentType: type,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: YEAR,
    });
    return r.url;
  },
  async del(urls) {
    if (urls.length) await del(urls);
  },
  async get(url) {
    const r = await fetch(url).catch(() => null);
    return r?.ok ? new Uint8Array(await r.arrayBuffer()) : null;
  },
};

let testStore: PictureStore | null = null;
/** Tests only: a stand-in store (null puts the real one back). */
export function usePictureStore(s: PictureStore | null) {
  testStore = s;
}

/** The store, or null while Blob isn't set up (pictures then stay in the database). */
export const pictureStore = (): PictureStore | null => testStore ?? (process.env.BLOB_READ_WRITE_TOKEN ? vercelStore : null);

/** The empty value `image` holds once a picture's bytes are in the store. */
export const MOVED = new Uint8Array(0);

/**
 * Puts one picture in the store under its id. Returns its address, or '' when there's no store or the upload failed,
 * so the caller keeps the bytes in the database instead (movePictures moves them later).
 */
export async function storePicture(id: string, bytes: Uint8Array): Promise<string> {
  const s = pictureStore();
  if (!s) return "";
  try {
    return await s.put(`gyms/${id}`, bytes, imageType(bytes) || "application/octet-stream");
  } catch (e) {
    console.error("gym picture upload", id, e instanceof Error ? e.message : e);
    return "";
  }
}

/** Removes files whose rows are gone. Best effort: a file left behind costs a few kilobytes and is never shown. */
export async function dropPictures(urls: readonly string[]): Promise<void> {
  const list = urls.filter(Boolean);
  const s = pictureStore();
  if (!list.length || !s) return;
  await s.del(list).catch((e: unknown) => console.error("gym picture delete", e instanceof Error ? e.message : e));
}

/** The addresses of a gym's stored pictures (or one kind of them), read before the rows go. */
export async function pictureUrls(placeId: string, kind?: string): Promise<string[]> {
  const rows = await query<{ url: string }>(
    `SELECT url FROM gym_photos WHERE place_id = ?${kind ? " AND kind = ?" : ""} AND url <> ''`,
    kind ? [placeId, kind] : [placeId],
  );
  return rows.map((r) => String(r.url));
}

/** One picture's bytes from the store. */
export async function readPicture(url: string): Promise<Uint8Array | null> {
  const s = pictureStore();
  return s ? s.get(url).catch(() => null) : null;
}

/**
 * Moves pictures still kept in the database into the store, `limit` at a time, eight uploads at once. Old website icons
 * not measured yet wait for measureIcons, which reads their first bytes from the database. Through the partial index
 * gym_photos_unmoved, which is empty once every picture has moved, so this costs one empty read after that.
 */
export async function movePictures(limit = 100): Promise<{ moved: number; failed: number; more: boolean }> {
  if (!pictureStore()) return { moved: 0, failed: 0, more: false };
  const rows = await query<{ id: string; image: ArrayBuffer | Uint8Array }>(
    `SELECT id, image FROM gym_photos WHERE url = '' AND (kind <> 'icon' OR px > 0) LIMIT ?`,
    [limit],
  );
  const done: { id: string; url: string }[] = [];
  let failed = 0;
  for (let i = 0; i < rows.length; i += 8) {
    const urls = await Promise.all(
      rows.slice(i, i + 8).map(async (r) => {
        const bytes = r.image instanceof Uint8Array ? r.image : new Uint8Array(r.image);
        return { id: String(r.id), url: bytes.length ? await storePicture(String(r.id), bytes) : "" };
      }),
    );
    for (const u of urls) if (u.url) done.push(u);
    failed += urls.filter((u) => !u.url).length;
  }
  if (done.length)
    await batch(
      done.map((d) => ({ sql: "UPDATE gym_photos SET url = ?, image = ? WHERE id = ? AND url = ''", args: [d.url, MOVED, d.id] })),
    );
  // Stop when a whole batch failed, so a broken store isn't hammered until the next run.
  return { moved: done.length, failed, more: rows.length === limit && done.length > 0 };
}

/**
 * The mover the gym import worker runs every five minutes (/api/cron/gym-imports/): measures old icons, then moves
 * pictures in batches until none are left or `ms` has passed. Safe to run twice at once: a file is written to the same
 * path, and a row takes its address only while it has none.
 */
export async function runMover(ms = 240_000): Promise<{ moved: number; more: boolean }> {
  if (!pictureStore()) return { moved: 0, more: false };
  const stop = Date.now() + ms;
  let moved = 0;
  while ((await measureIcons()).measured > 0 && Date.now() < stop);
  for (;;) {
    const r = await movePictures();
    moved += r.moved;
    if (!r.more || Date.now() >= stop) return { moved, more: r.more };
  }
}
