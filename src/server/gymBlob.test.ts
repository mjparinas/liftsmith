import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { movePictures, pictureStore, runMover, usePictureStore, type PictureStore } from "./gymBlob";
import { addMedia, mediaImage, mediaOf, removeMedia } from "./gymMedia";
import { actOnPlace, placesFromOsm, savePlaces } from "./gymPlaces";

// Gym pictures in Vercel Blob, with only their address in the database (docs/decisions/gyms.md "Pictures in Vercel Blob").
const NOW = 1_800_000_000_000;
const jpegBytes = (n = 100, fill = 7) => {
  const b = Buffer.alloc(n, fill);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  return b;
};
const jpeg = (n = 100, fill = 7) => `data:image/jpeg;base64,${jpegBytes(n, fill).toString("base64")}`;

/** A store in memory, standing in for Vercel Blob. */
function memoryStore(opts: { failPut?: boolean } = {}) {
  const files = new Map<string, Uint8Array>();
  const store: PictureStore = {
    async put(path, bytes) {
      if (opts.failPut) throw new Error("store down");
      const url = `https://blob.example.com/${path}`;
      files.set(url, new Uint8Array(bytes));
      return url;
    },
    async del(urls) {
      for (const u of urls) files.delete(u);
    },
    async get(url) {
      return files.get(url) ?? null;
    },
  };
  return { store, files };
}

let gym = "";
beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gym = String((await query("SELECT id FROM gym_places"))[0]!.id);
  await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [gym]);
});
afterEach(() => usePictureStore(null));

describe("gym pictures in Vercel Blob", () => {
  it("stays in the database while Blob isn't set up", async () => {
    expect(pictureStore()).toBeNull();
    const p = await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg() }, NOW);
    if (!p.ok) throw new Error("not added");
    expect(await query("SELECT url, length(image) AS n FROM gym_photos")).toEqual([{ url: "", n: 100 }]);
    expect((await mediaImage(p.id))!.length).toBe(100);
    expect(await movePictures()).toEqual({ moved: 0, failed: 0, more: false });
  });

  it("keeps a new picture's bytes in the store and only its address in the database, and serves it the same way", async () => {
    const { store, files } = memoryStore();
    usePictureStore(store);
    const p = await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg(300) }, NOW);
    if (!p.ok) throw new Error("not added");
    expect(await query("SELECT url, length(image) AS n FROM gym_photos")).toEqual([{ url: `https://blob.example.com/gyms/${p.id}`, n: 0 }]);
    expect(files.size).toBe(1);
    const served = await mediaImage(p.id);
    expect(served!.length).toBe(300);
    expect(served![0]).toBe(0xff);
  });

  it("removes the files when the pictures go: a new logo, the owner taking one down, staff taking all down, a deleted gym", async () => {
    const { store, files } = memoryStore();
    usePictureStore(store);
    const add = (kind: string) => addMedia("acc-owner", { place: gym, kind, image: jpeg() }, NOW);
    const a = await add("logo");
    const b = await add("logo");
    if (!a.ok || !b.ok) throw new Error("not added");
    expect([...files.keys()]).toEqual([`https://blob.example.com/gyms/${b.id}`]);
    const p = await add("photo");
    if (!p.ok) throw new Error("not added");
    expect(await removeMedia("acc-owner", gym, p.id)).toBe(true);
    expect(await removeMedia("acc-owner", gym, p.id)).toBe(false);
    expect(files.size).toBe(1);
    await add("photo");
    expect(files.size).toBe(2);
    expect(await actOnPlace(gym, "pictures")).toBe(true);
    expect(files.size).toBe(0);
    await add("photo");
    expect(await actOnPlace(gym, "delete")).toBe(true);
    expect(files.size).toBe(0);
  });

  it("keeps the bytes in the database when an upload fails, and moves them later", async () => {
    usePictureStore(memoryStore({ failPut: true }).store);
    const p = await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg() }, NOW);
    if (!p.ok) throw new Error("not added");
    expect(await query("SELECT url FROM gym_photos")).toEqual([{ url: "" }]);
    expect(await movePictures()).toEqual({ moved: 0, failed: 1, more: false });
    const { store, files } = memoryStore();
    usePictureStore(store);
    expect(await movePictures()).toEqual({ moved: 1, failed: 0, more: false });
    expect(files.size).toBe(1);
    expect((await mediaImage(p.id))!.length).toBe(100);
  });

  it("moves the pictures already in the database, in batches, measuring old icons first, and leaves the ids alone", async () => {
    // Before Blob: an owner's logo, five photos and a website icon not measured yet (on another gym).
    await addMedia("acc-owner", { place: gym, kind: "logo", image: jpeg(120, 1) }, NOW);
    for (let i = 0; i < 5; i++) await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg(200 + i, 2) }, NOW);
    const png = new Uint8Array(200).fill(7);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    new DataView(png.buffer).setUint32(16, 192);
    new DataView(png.buffer).setUint32(20, 192);
    await run("INSERT INTO gym_photos (id, place_id, kind, image, created_at) VALUES ('00000000000000ab', 'other', 'icon', ?, 0)", [png]);
    const before = await mediaOf(gym);

    const { store, files } = memoryStore();
    usePictureStore(store);
    // The icon waits for measuring; the rest move, four at a time here.
    expect(await movePictures(4)).toEqual({ moved: 4, failed: 0, more: true });
    expect(await runMover()).toEqual({ moved: 3, more: false });
    expect(files.size).toBe(7);
    expect(await query("SELECT COUNT(*) AS n FROM gym_photos WHERE url = '' OR length(image) > 0")).toEqual([{ n: 0 }]);
    expect(await query("SELECT px FROM gym_photos WHERE id = '00000000000000ab'")).toEqual([{ px: 192 }]);
    expect(await mediaOf(gym)).toEqual(before);
    const sizes = await Promise.all(before.photos.map(async (id) => (await mediaImage(id))!.length));
    expect(sizes.sort()).toEqual([200, 201, 202, 203, 204]);
    expect((await mediaImage("00000000000000ab"))!.length).toBe(200);
    // Nothing left: one empty read.
    expect(await movePictures()).toEqual({ moved: 0, failed: 0, more: false });
  });
});
