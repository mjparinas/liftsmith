"use client";
// Progress photos. Private by design: kept in their own IndexedDB database on this device, never in the
// event log, so sync, backups, analytics and feedback reports never see them. "Erase this device" deletes
// them too. Photos are shrunk to 1440 px JPEG before saving, which also drops the camera's location data.

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
