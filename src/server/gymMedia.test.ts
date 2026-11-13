import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { query, resetDb, run } from "./db";
import { ownedGyms } from "./gymClaims";
import { addMedia, mapboxUrl, mapImage, mapPath, MEDIA_LIMITS, mediaImage, mediaOf, removeMedia } from "./gymMedia";
import { actOnPlace, placeById, placesFromOsm, savePlaces } from "./gymPlaces";

// A gym's map picture, logo and photos (docs/decisions/gyms.md).
const NOW = 1_800_000_000_000;
const jpeg = (bytes = 100) => {
  const b = Buffer.alloc(bytes, 7);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  return `data:image/jpeg;base64,${b.toString("base64")}`;
};

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
afterEach(() => vi.unstubAllEnvs());

describe("logo and photos", () => {
  it("lets only the owner add them, keeps one logo, and shows them on the gym", async () => {
    expect(await addMedia("acc-other", { place: gym, kind: "photo", image: jpeg() }, NOW)).toEqual({ ok: false, error: "owner" });
    const a = await addMedia("acc-owner", { place: gym, kind: "logo", image: jpeg() }, NOW);
    const b = await addMedia("acc-owner", { place: gym, kind: "logo", image: jpeg() }, NOW);
    const p = await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg() }, NOW);
    if (!a.ok || !b.ok || !p.ok) throw new Error("not added");
    expect(await mediaOf(gym)).toEqual({ logo: b.id, photos: [p.id] });
    expect(await mediaImage(a.id)).toBeNull();
    expect((await mediaImage(p.id))![0]).toBe(0xff);
    const place = (await placeById(gym))!;
    expect(place.logo).toBe(b.id);
    expect(place.photos).toEqual([p.id]);
    const owned = (await ownedGyms("acc-owner", NOW))[0]!;
    expect(owned.logo).toBe(b.id);
    expect(owned.photos).toEqual([p.id]);
  });

  it("refuses anything that isn't a small JPEG, and a seventh photo", async () => {
    const add = (image: string, kind = "photo") => addMedia("acc-owner", { place: gym, kind, image }, NOW);
    expect(await add("data:image/png;base64,iVBORw0KGgo=")).toEqual({ ok: false, error: "image" });
    expect(await add(`data:image/jpeg;base64,${Buffer.from("hello world").toString("base64")}`)).toEqual({ ok: false, error: "image" });
    expect(await add(jpeg(MEDIA_LIMITS.logo + 1), "logo")).toEqual({ ok: false, error: "big" });
    expect(await add(jpeg(), "banner")).toEqual({ ok: false, error: "image" });
    for (let i = 0; i < MEDIA_LIMITS.photos; i++) expect((await add(jpeg())).ok).toBe(true);
    expect(await add(jpeg())).toEqual({ ok: false, error: "full" });
  });

  it("lets the owner take one down, and staff take them all down", async () => {
    const p = await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg() }, NOW);
    if (!p.ok) throw new Error("not added");
    expect(await removeMedia("acc-other", gym, p.id)).toBe(false);
    expect(await removeMedia("acc-owner", gym, p.id)).toBe(true);
    await addMedia("acc-owner", { place: gym, kind: "logo", image: jpeg() }, NOW);
    await addMedia("acc-owner", { place: gym, kind: "photo", image: jpeg() }, NOW);
    await actOnPlace(gym, "pictures", NOW);
    expect(await mediaOf(gym)).toEqual({ logo: "", photos: [] });
  });
});

describe("the map", () => {
  it("is off until the token is set", async () => {
    vi.stubEnv("MAPBOX_TOKEN", "");
    expect(mapPath(gym)).toBe("");
    expect((await placeById(gym))!.map).toBeFalsy();
    expect(await mapImage(gym, () => Promise.reject(new Error("no call")))).toBeNull();
  });

  it("draws the gym's spot through our own server, never handing out the token", async () => {
    vi.stubEnv("MAPBOX_TOKEN", "pk.test");
    expect(mapboxUrl(49.1, -122.6, "pk.test")).toBe(
      "https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+4c8dff(-122.60000,49.10000)/-122.60000,49.10000,15,0/640x320@2x?attribution=false&access_token=pk.test",
    );
    expect((await placeById(gym))!.map).toBe(`/api/gyms/map/?place=${gym}`);
    const seen: string[] = [];
    const fetcher = (url: string | URL | Request) => {
      seen.push(String(url));
      return Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } }));
    };
    const img = await mapImage(gym, fetcher as typeof fetch);
    expect(img?.type).toBe("image/png");
    expect(new Uint8Array(img!.bytes)).toEqual(new Uint8Array([1, 2, 3]));
    expect(seen[0]).toContain("49.10000");
    expect(await mapImage(gym, () => Promise.resolve(new Response("no", { status: 401 })))).toBeNull();
  });
});
