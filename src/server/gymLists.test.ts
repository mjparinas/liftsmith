// The city list and the sitemap's gym list read every gym row, and Turso bills every row read (2026-11-16), so the public
// pages use a copy each server keeps for LIST_KEEP_MS (keptList in gymPlaces.ts).
import { beforeEach, describe, expect, it } from "vitest";

import { forgetKeptLists, keptList, LIST_KEEP_MS } from "./gymPlaces";

describe("keptList", () => {
  beforeEach(() => forgetKeptLists());

  it("reads once, then answers from the kept copy until it's old", async () => {
    let reads = 0;
    const load = async () => ++reads;
    expect(await keptList("t", load, 0)).toBe(1);
    expect(await keptList("t", load, LIST_KEEP_MS - 1)).toBe(1);
    expect(reads).toBe(1);
    expect(await keptList("t", load, LIST_KEEP_MS)).toBe(2);
  });

  it("shares one read between requests that arrive together", async () => {
    let reads = 0;
    const load = async () => ++reads;
    const [a, b] = await Promise.all([keptList("t", load, 0), keptList("t", load, 0)]);
    expect([a, b, reads]).toEqual([1, 1, 1]);
  });

  it("doesn't keep a failed read", async () => {
    await expect(keptList("t", () => Promise.reject(new Error("down")), 0)).rejects.toThrow("down");
    expect(await keptList("t", async () => "ok", 1)).toBe("ok");
  });

  it("keeps each list apart", async () => {
    expect(await keptList("a", async () => "a", 0)).toBe("a");
    expect(await keptList("b", async () => "b", 0)).toBe("b");
  });
});
