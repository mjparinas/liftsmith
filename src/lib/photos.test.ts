import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { parseBackup } from "./backup";
import { defaultProfile, makeGym } from "./defaults";
import { backupJson } from "./exportData";
import {
  coverCrop,
  fromSaved,
  listPhotos,
  nextPhotoDue,
  parseSavedPhotos,
  PHOTO_EVERY_DAYS,
  pickPair,
  restorePhotos,
  savePhoto,
  sideBySideLayout,
  stepPair,
  toSaved,
  weightNear,
  type Photo,
} from "./photos";

const DAY = 86_400_000;
const ph = (id: string, at: number, pose: Photo["pose"] = "front"): Photo => ({ id, at, pose, blob: new Blob([id]), w: 3, h: 4 });
const list = [ph("a", 1 * DAY), ph("s", 2 * DAY, "side"), ph("b", 3 * DAY), ph("c", 5 * DAY), ph("d", 9 * DAY)];

describe("choosing the two photos to compare", () => {
  it("defaults to the first and the latest of the pose", () => {
    expect(pickPair(list, "front")).toMatchObject({ before: { id: "a" }, after: { id: "d" } });
    expect(pickPair(list, "side")).toEqual({ before: null, after: list[1] });
    expect(pickPair(list, "back")).toEqual({ before: null, after: null });
  });
  it("keeps a chosen pair, and falls back when a choice is gone or out of order", () => {
    expect(pickPair(list, "front", "b", "c")).toMatchObject({ before: { id: "b" }, after: { id: "c" } });
    expect(pickPair(list, "front", "gone", "c")).toMatchObject({ before: { id: "a" }, after: { id: "c" } });
    // Before newer than after: before goes back to the first.
    expect(pickPair(list, "front", "d", "b")).toMatchObject({ before: { id: "a" }, after: { id: "b" } });
    // After can't be the oldest photo.
    expect(pickPair(list, "front", undefined, "a")).toMatchObject({ before: { id: "a" }, after: { id: "d" } });
    // Another pose's photo isn't picked.
    expect(pickPair(list, "front", "s", "d")).toMatchObject({ before: { id: "a" }, after: { id: "d" } });
  });
  it("steps one side at a time and never past the other", () => {
    const [a, b, c, d] = [list[0]!, list[2]!, list[3]!, list[4]!];
    expect(stepPair(list, "front", a, d, "before", 1)).toBe("b");
    expect(stepPair(list, "front", a, d, "before", -1)).toBeNull();
    expect(stepPair(list, "front", a, d, "after", -1)).toBe("c");
    expect(stepPair(list, "front", a, d, "after", 1)).toBeNull();
    expect(stepPair(list, "front", c, d, "before", 1)).toBeNull();
    expect(stepPair(list, "front", b, c, "after", -1)).toBeNull();
  });
});

describe("the weight on a photo's day and the next photo", () => {
  const w = [
    { at: 0, kg: 82 },
    { at: 6 * DAY, kg: 81 },
    { at: 30 * DAY, kg: 79 },
  ];
  it("takes the closest weigh-in within a week", () => {
    expect(weightNear(w, 5 * DAY)?.kg).toBe(81);
    expect(weightNear(w, 1 * DAY)?.kg).toBe(82);
    expect(weightNear(w, 18 * DAY)).toBeNull();
    expect(weightNear(w, 23 * DAY)?.kg).toBe(79);
  });
  it("puts the next photo four weeks after the last of the pose", () => {
    expect(nextPhotoDue(list, "front")).toBe(9 * DAY + PHOTO_EVERY_DAYS * DAY);
    expect(nextPhotoDue(list, "back")).toBeNull();
  });
});

describe("the side by side image", () => {
  it("lays out two equal panels with room for labels", () => {
    const L = sideBySideLayout(100, 200, 10, 40);
    expect(L).toMatchObject({ width: 210, height: 240, right: { x: 110, w: 100 }, labelY: 220 });
  });
  it("crops like cover: fills the panel, centred, without stretching", () => {
    expect(coverCrop(1000, 1000, 300, 400)).toEqual({ sx: 125, sy: 0, sw: 750, sh: 1000 });
    expect(coverCrop(600, 1200, 300, 400)).toEqual({ sx: 0, sy: 200, sw: 600, sh: 800 });
  });
});

describe("photos in the backup file", () => {
  it("round-trips a photo's bytes", async () => {
    const p: Photo = { id: "x", at: 5, pose: "side", w: 2, h: 2, blob: new Blob([new Uint8Array([255, 216, 0, 1, 2])]) };
    const s = await toSaved(p);
    const back = fromSaved(s);
    expect(new Uint8Array(await back.blob.arrayBuffer())).toEqual(new Uint8Array([255, 216, 0, 1, 2]));
    expect(back).toMatchObject({ id: "x", at: 5, pose: "side", w: 2, h: 2 });
  });
  it("leaves photos out unless asked, and reads them back when they're in", async () => {
    const gym = { ...makeGym("commercial", "kg"), id: "g1" };
    const profile = { ...defaultProfile(1), activeGymId: "g1", onboarded: true };
    expect(JSON.parse(backupJson(profile, [gym], [])).photos).toBeUndefined();
    const saved = await toSaved(ph("y", 7));
    const b = parseBackup(backupJson(profile, [gym], [], 1, [saved]))!;
    expect(b.photos).toEqual([saved]);
    expect(parseBackup(backupJson(profile, [gym], []))!.photos).toEqual([]);
  });
  it("drops anything that isn't a well-formed photo", () => {
    const good = { id: "a", at: 1, pose: "front", w: 10, h: 10, jpeg: "AAEC" };
    expect(
      parseSavedPhotos([
        good,
        { ...good, pose: "top" },
        { ...good, id: "" },
        { ...good, w: 99_999 },
        { ...good, jpeg: "<script>" },
        { ...good, at: Number.NaN },
        null,
        "x",
      ]),
    ).toEqual([good]);
    expect(parseSavedPhotos("nope")).toEqual([]);
  });
  it("restores only the photos this device doesn't have", async () => {
    await savePhoto(ph("have", 1));
    const added = await restorePhotos([await toSaved(ph("have", 1)), await toSaved(ph("new", 2)), await toSaved(ph("new", 2))]);
    expect(added).toBe(1);
    expect((await listPhotos()).map((p) => p.id)).toEqual(["have", "new"]);
  });
});
