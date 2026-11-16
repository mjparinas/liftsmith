"use client";
// Progress photos. Private by design: kept in their own IndexedDB database on this device, never in the
// event log, so sync, analytics, coaches and feedback reports never see them. They go into a backup file only
// when the lifter switches "Include progress photos" on (Melvin, 2026-11-15: phone only, plus the backup file).
// "Erase this device" and signing out delete them too. Photos are shrunk to 1440 px JPEG before saving, which also drops the camera's location data.

export type Pose = "front" | "side" | "back";

export interface Photo {
  id: string;
  at: number;
  pose: Pose;
  blob: Blob;
  w: number;
  h: number;
}

const DB = "liftsmith-photos";
const STORE = "photos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(req ? req.result : undefined);
    };
    t.onerror = () => reject(t.error);
  });
}

export async function listPhotos(): Promise<Photo[]> {
  const all = ((await tx<Photo[]>("readonly", (s) => s.getAll() as IDBRequest<Photo[]>)) ?? []) as Photo[];
  return all.sort((a, b) => a.at - b.at);
}

export async function savePhoto(p: Photo): Promise<void> {
  await tx("readwrite", (s) => void s.put(p));
}

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => void s.delete(id));
}

export async function erasePhotos(): Promise<void> {
  try {
    await tx("readwrite", (s) => void s.clear());
  } catch {}
}

/** Longest side in pixels after shrinking. */
export const MAX_SIDE = 1440;

export function fitSize(w: number, h: number, max = MAX_SIDE): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

/** Shrinks a picked or taken photo and re-encodes it (no EXIF, so no location) . */
export async function preparePhoto(file: Blob, pose: Pose, at = Date.now()): Promise<Photo> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const { w, h } = fitSize(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(at);
  return { id, at, pose, blob, w, h };
}

/** The photo to compare against: the earliest of the same pose (the "before"). */
export function pairFor(photos: readonly Photo[], pose: Pose): { before: Photo | null; after: Photo | null } {
  const xs = photos.filter((p) => p.pose === pose).sort((a, b) => a.at - b.at);
  return { before: xs.length > 1 ? xs[0] : null, after: xs.at(-1) ?? null };
}

// ---- Picking any two photos to compare (Melvin, 2026-11-15) ----

/** Photos of one pose, oldest first. */
export const ofPose = (photos: readonly Photo[], pose: Pose): Photo[] => photos.filter((p) => p.pose === pose).sort((a, b) => a.at - b.at);

/**
 * The pair shown in Compare: the chosen ids when they're still there and in order, otherwise the first and the latest.
 * Before is always older than after, so the slider and the side by side read left to right in time.
 */
export function pickPair(
  photos: readonly Photo[],
  pose: Pose,
  beforeId?: string | null,
  afterId?: string | null,
): { before: Photo | null; after: Photo | null } {
  const xs = ofPose(photos, pose);
  if (xs.length < 2) return { before: null, after: xs.at(-1) ?? null };
  let ai = afterId ? xs.findIndex((p) => p.id === afterId) : -1;
  if (ai < 1) ai = xs.length - 1;
  let bi = beforeId ? xs.findIndex((p) => p.id === beforeId) : -1;
  if (bi < 0 || bi >= ai) bi = 0;
  return { before: xs[bi]!, after: xs[ai]! };
}

/**
 * Moves one side of the pair to the next older (-1) or newer (+1) photo, never past the other side. Null when it
 * can't move (so the arrow is disabled).
 */
export function stepPair(
  photos: readonly Photo[],
  pose: Pose,
  before: Photo,
  after: Photo,
  side: "before" | "after",
  dir: -1 | 1,
): string | null {
  const xs = ofPose(photos, pose);
  const i = xs.findIndex((p) => p.id === (side === "before" ? before.id : after.id));
  const j = i + dir;
  if (i < 0 || j < 0 || j >= xs.length) return null;
  if (side === "before" && xs[j]!.at >= after.at) return null;
  if (side === "after" && xs[j]!.at <= before.at) return null;
  return xs[j]!.id;
}

/** The weigh-in closest to a photo's day, within a week either side, so each photo can say what you weighed. */
export function weightNear<T extends { at: number; kg: number }>(weighIns: readonly T[], at: number, days = 7): T | null {
  let best: T | null = null;
  for (const w of weighIns) {
    const d = Math.abs(w.at - at);
    if (d <= days * 86_400_000 && (!best || d < Math.abs(best.at - at))) best = w;
  }
  return best;
}

/** How often a fresh photo is worth taking: changes show over weeks, not days. */
export const PHOTO_EVERY_DAYS = 28;

/** The day the next photo of a pose is due, or null with no photo yet. */
export function nextPhotoDue(photos: readonly Photo[], pose: Pose): number | null {
  const last = ofPose(photos, pose).at(-1);
  return last ? last.at + PHOTO_EVERY_DAYS * 86_400_000 : null;
}

// ---- Backup file (Melvin, 2026-11-15: photos stay on the phone, and can go into the backup file) ----

/** A photo as it's written in a backup file: the JPEG as base64. */
export interface SavedPhoto {
  id: string;
  at: number;
  pose: Pose;
  w: number;
  h: number;
  jpeg: string;
}

const POSES: readonly Pose[] = ["front", "side", "back"];
/** A photo is at most 1440 px, so its JPEG is well under this; anything bigger isn't one of ours. */
const MAX_B64 = 8_000_000;

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function blobBytes(b: Blob): Promise<Uint8Array> {
  if (typeof b.arrayBuffer === "function") return new Uint8Array(await b.arrayBuffer());
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => rej(r.error);
    r.readAsArrayBuffer(b);
  });
}

export async function toSaved(p: Photo): Promise<SavedPhoto> {
  return { id: p.id, at: p.at, pose: p.pose, w: p.w, h: p.h, jpeg: toB64(await blobBytes(p.blob)) };
}

export function fromSaved(s: SavedPhoto): Photo {
  return { id: s.id, at: s.at, pose: s.pose, w: s.w, h: s.h, blob: new Blob([fromB64(s.jpeg) as BlobPart], { type: "image/jpeg" }) };
}

/** Every photo on this device, ready for a backup file. */
export async function photosForBackup(): Promise<SavedPhoto[]> {
  return Promise.all((await listPhotos()).map(toSaved));
}

/** Keeps only well-formed photos from a backup file; anything else is dropped, not trusted. */
export function parseSavedPhotos(raw: unknown): SavedPhoto[] {
  if (!Array.isArray(raw)) return [];
  const ok = (n: unknown, max: number) => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= max;
  return raw.filter(
    (p): p is SavedPhoto =>
      !!p &&
      typeof p === "object" &&
      typeof (p as SavedPhoto).id === "string" &&
      !!(p as SavedPhoto).id &&
      ok((p as SavedPhoto).at, 8.64e15) &&
      POSES.includes((p as SavedPhoto).pose) &&
      ok((p as SavedPhoto).w, MAX_SIDE) &&
      ok((p as SavedPhoto).h, MAX_SIDE) &&
      typeof (p as SavedPhoto).jpeg === "string" &&
      (p as SavedPhoto).jpeg.length <= MAX_B64 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test((p as SavedPhoto).jpeg),
  );
}

/** Adds the backup's photos this device doesn't have yet. Returns how many were added. */
export async function restorePhotos(saved: readonly SavedPhoto[]): Promise<number> {
  if (!saved.length) return 0;
  const have = new Set((await listPhotos()).map((p) => p.id));
  let added = 0;
  for (const s of saved) {
    if (have.has(s.id)) continue;
    have.add(s.id);
    await savePhoto(fromSaved(s));
    added++;
  }
  return added;
}

// ---- Side by side image to share (adults only; Photos.tsx) ----

/** Where each photo goes in a side by side image: two equal portrait panels with a label strip under them. */
export function sideBySideLayout(panelW = 720, panelH = 960, gap = 12, strip = 120) {
  return {
    width: panelW * 2 + gap,
    height: panelH + strip,
    left: { x: 0, y: 0, w: panelW, h: panelH },
    right: { x: panelW + gap, y: 0, w: panelW, h: panelH },
    labelY: panelH + strip / 2,
  };
}

/** Crop rectangle in the source that fills a panel without stretching (like object-fit: cover). */
export function coverCrop(sw: number, sh: number, dw: number, dh: number): { sx: number; sy: number; sw: number; sh: number } {
  const k = Math.max(dw / sw, dh / sh);
  const w = dw / k;
  const h = dh / k;
  return { sx: (sw - w) / 2, sy: (sh - h) / 2, sw: w, sh: h };
}

/** Draws the before and after photos side by side with their dates (and weights) under them. */
export async function drawSideBySide(
  canvas: HTMLCanvasElement,
  before: Photo,
  after: Photo,
  labels: { before: string; after: string; brand: string },
): Promise<void> {
  const L = sideBySideLayout();
  canvas.width = L.width;
  canvas.height = L.height;
  const ctx = canvas.getContext("2d")!;
  // The share image stays dark whatever the app's theme, like every share card (shareImage.ts).
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, L.width, L.height);
  for (const [p, box] of [
    [before, L.left],
    [after, L.right],
  ] as const) {
    const bmp = await createImageBitmap(p.blob);
    const c = coverCrop(bmp.width, bmp.height, box.w, box.h);
    ctx.drawImage(bmp, c.sx, c.sy, c.sw, c.sh, box.x, box.y, box.w, box.h);
    bmp.close?.();
  }
  ctx.fillStyle = "#e8edf3";
  ctx.font = "600 36px system-ui, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labels.before, L.left.x + L.left.w / 2, L.labelY - 14);
  ctx.fillText(labels.after, L.right.x + L.right.w / 2, L.labelY - 14);
  ctx.fillStyle = "#8a97a8";
  ctx.font = "500 24px system-ui, Roboto, sans-serif";
  ctx.fillText(labels.brand, L.width / 2, L.labelY + 32);
}
