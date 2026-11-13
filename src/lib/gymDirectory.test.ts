// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findNearby, lastNearby, type Found } from "./gymDirectory";

// Find gyms near you, made quick (2026-11-13): the last answer shows at once, and the server is asked for the last
// spot while the phone works out where it is.
const answer = (name: string) => ({ gyms: [], places: [{ id: name, name }], map: `/api/gyms/map/?ids=${name}` });
let asked: string[] = [];

beforeEach(() => {
  localStorage.clear();
  asked = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      asked.push(url);
      return Promise.resolve(Response.json(answer(url.includes("lat=49.1&") ? "langley" : "elsewhere")));
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("findNearby", () => {
  it("rounds the spot before sending it, and keeps only the rounded spot and the answer", async () => {
    const early = vi.fn();
    const r = await findNearby(early, () => Promise.resolve({ lat: 49.1049, lon: -122.6612 }));
    expect(early).not.toHaveBeenCalled();
    expect(asked).toEqual(["/api/gyms/?lat=49.1&lon=-122.66"]);
    expect((r as Found).places[0]!.name).toBe("langley");
    expect((r as Found).map).toBe("/api/gyms/map/?ids=langley");
    expect(lastNearby()).toMatchObject({ lat: 49.1, lon: -122.66 });
    expect(localStorage.getItem("liftsmith.gymsNear")).not.toContain("49.1049");
  });

  it("shows the last answer at once and asks for that spot before the phone has a fix", async () => {
    await findNearby(undefined, () => Promise.resolve({ lat: 49.1, lon: -122.66 }));
    asked = [];
    const early = vi.fn();
    let fixed: (f: { lat: number; lon: number }) => void = () => {};
    const run = findNearby(early, () => new Promise((resolve) => (fixed = resolve)));
    expect(early).toHaveBeenCalledWith(expect.objectContaining({ places: [expect.objectContaining({ name: "langley" })] }));
    // Asked already, while the position is still coming.
    expect(asked).toEqual(["/api/gyms/?lat=49.1&lon=-122.66"]);
    fixed({ lat: 49.1, lon: -122.66 });
    expect(((await run) as Found).places[0]!.name).toBe("langley");
    expect(asked).toHaveLength(1);
  });

  it("asks again when the lifter has moved, and remembers the new spot", async () => {
    await findNearby(undefined, () => Promise.resolve({ lat: 49.1, lon: -122.66 }));
    const r = await findNearby(undefined, () => Promise.resolve({ lat: 43.65, lon: -79.38 }));
    expect((r as Found).places[0]!.name).toBe("elsewhere");
    expect(asked.at(-1)).toBe("/api/gyms/?lat=43.65&lon=-79.38");
    expect(lastNearby()).toMatchObject({ lat: 43.65, lon: -79.38 });
  });

  it("says when location is off, and forgets an answer older than a week", async () => {
    expect(await findNearby(undefined, () => Promise.resolve(null))).toEqual({ error: "location" });
    await findNearby(undefined, () => Promise.resolve({ lat: 49.1, lon: -122.66 }));
    expect(lastNearby(Date.now() + 8 * 86_400_000)).toBeNull();
    localStorage.setItem("liftsmith.gymsNear", "{junk");
    expect(lastNearby()).toBeNull();
  });
});
