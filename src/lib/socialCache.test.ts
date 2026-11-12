// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { forgetAccount } from "./auth";
import { cached, fetchPart, fetchParts, fresh, FRIENDS_CACHE_KEY, keep, remember } from "./socialCache";

beforeEach(() => localStorage.clear());

describe("Friends' last copy (socialCache)", () => {
  it("lets every part join the one home request instead of asking for itself", async () => {
    let asked = 0;
    let answer!: (v: { feed: string; me: string }) => void;
    void fetchParts(
      "a",
      ["me", "feed"],
      () => new Promise<{ feed: string; me: string }>((r) => (answer = r)),
      (r) => r,
    );
    const own = () => (asked++, Promise.resolve("own"));
    const feed = fetchPart("a", "feed", own);
    answer({ me: "me", feed: "posts" });
    expect(await feed).toBe("posts");
    expect(asked).toBe(0);
    expect(fresh("a", "feed")).toBe(true);
  });

  it("fetches a part itself when the shared request fails (an older server)", async () => {
    void fetchParts(
      "a",
      ["feed"],
      () => Promise.reject(new Error("Unknown op.")),
      () => null,
    ).catch(() => undefined);
    expect(await fetchPart("a", "feed", () => Promise.resolve("own"))).toBe("own");
  });

  it("keeps the feed for the next launch for that account only, and drops it on sign-out", () => {
    remember("a", "feed", { posts: [1] });
    remember("a", "training", ["live"]);
    keep("a", "suggest", ["x"]);
    expect(fresh("a", "suggest")).toBe(false);
    const saved = JSON.parse(localStorage.getItem(FRIENDS_CACHE_KEY)!) as { account: string; parts: Record<string, unknown> };
    expect(saved.account).toBe("a");
    // Training now is live, so it's never kept on the device.
    expect(Object.keys(saved.parts).sort()).toEqual(["feed", "suggest"]);
    expect(cached("b", "feed")).toBeUndefined();
    forgetAccount();
    expect(localStorage.getItem(FRIENDS_CACHE_KEY)).toBeNull();
    expect(cached("a", "feed")).toBeUndefined();
  });
});
