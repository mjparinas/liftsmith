// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { pickOffering } from "./billing";
import {
  activeCode,
  clearCode,
  codeFromReferrer,
  codeFromUrl,
  CREATOR_KEY,
  normalizeCode,
  playLinkWithCode,
  readClaim,
  sendClaim,
  setCode,
  startCreator,
} from "./creator";

const res = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  localStorage.clear();
});

describe("creator codes in the app", () => {
  it("normalises codes and reads them from links and the Play referrer", () => {
    expect(normalizeCode(" lift-alex ")).toBe("LIFT-ALEX");
    expect(normalizeCode("LIFT ALEX")).toBe("LIFTALEX");
    expect(normalizeCode("ab")).toBeNull();
    expect(normalizeCode("-ALEX")).toBeNull();
    expect(normalizeCode("LIFT_ALEX")).toBeNull();
    expect(normalizeCode("x".repeat(25))).toBeNull();
    expect(codeFromUrl("https://www.getliftsmith.com/c/lift-alex/")).toBe("LIFT-ALEX");
    expect(codeFromUrl("https://www.getliftsmith.com/app/?c=lift-sam#/today")).toBe("LIFT-SAM");
    expect(codeFromUrl("https://www.getliftsmith.com/c/?code=LIFT-JO")).toBe("LIFT-JO");
    expect(codeFromUrl("https://www.getliftsmith.com/exercises/")).toBeNull();
    expect(codeFromReferrer("utm_source=creator&utm_medium=creator&utm_campaign=LIFT-ALEX")).toBe("LIFT-ALEX");
    expect(codeFromReferrer("utm_source=google-play&utm_medium=organic")).toBeNull();
    const link = playLinkWithCode("https://play.google.com/store/apps/details?id=com.getliftsmith.app", "LIFT-ALEX");
    expect(codeFromReferrer(new URL(link).searchParams.get("referrer"))).toBe("LIFT-ALEX");
  });

  it("keeps a typed code over a link, and locks once a trial has started", () => {
    expect(setCode("nope!", "typed", false)).toBe("invalid");
    expect(setCode("LIFT-ALEX", "typed", false)).toBe("ok");
    expect(setCode("LIFT-SAM", "link", false)).toBe("locked");
    expect(setCode("lift-alex", "typed", false)).toBe("same");
    expect(setCode("LIFT-SAM", "typed", false)).toBe("ok");
    expect(readClaim()).toMatchObject({ code: "LIFT-SAM", source: "typed", status: "pending" });
    expect(setCode("LIFT-JO", "typed", true)).toBe("locked");
    expect(clearCode(true)).toBe(false);
    expect(clearCode(false)).toBe(true);
    expect(readClaim()).toBeNull();
  });

  it("checks a code with the server: known, unknown, or offline", async () => {
    setCode("LIFT-ALEX", "typed", false);
    const post = vi
      .fn()
      .mockResolvedValueOnce(res(503))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(res(200, { code: "LIFT-ALEX", name: "Alex" }));
    expect(await sendClaim(post)).toBeNull();
    expect(await sendClaim(post)).toBeNull();
    expect(readClaim()?.status).toBe("pending");
    expect(activeCode()).toBe("LIFT-ALEX");
    expect(await sendClaim(post)).toBe("ok");
    expect(readClaim()).toMatchObject({ status: "ok", name: "Alex" });
    const sent = JSON.parse(post.mock.calls[2][1].body as string);
    expect(Object.keys(sent).sort()).toEqual(["code", "installId", "platform", "source"]);

    setCode("LIFT-NOPE", "typed", false);
    expect(await sendClaim(vi.fn().mockResolvedValue(res(404)))).toBe("unknown");
    expect(activeCode()).toBeNull();
    // An unknown code can be replaced by a link.
    expect(setCode("LIFT-SAM", "link", false)).toBe("ok");
  });

  it("takes the server's code when the subscription already belongs to another", async () => {
    setCode("LIFT-SAM", "typed", false);
    await sendClaim(vi.fn().mockResolvedValue(res(200, { code: "LIFT-ALEX", name: "Alex" })));
    expect(readClaim()).toMatchObject({ code: "LIFT-ALEX", name: "Alex" });
  });

  it("picks a code up from the address on open, but not after the lifter removed one", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res(503)));
    await startCreator("https://www.getliftsmith.com/app/?c=lift-alex");
    expect(readClaim()).toMatchObject({ code: "LIFT-ALEX", source: "link" });
    clearCode(false);
    await startCreator("https://www.getliftsmith.com/app/?c=lift-alex");
    expect(localStorage.getItem(CREATOR_KEY)).toBeNull();
    vi.unstubAllGlobals();
  });

  it("sells from the creator offering when a code is active", () => {
    const all = { creator30: "c30", trial7: "t7" };
    expect(pickOffering(all, "default", "LIFT-ALEX", 14)).toBe("c30");
    expect(pickOffering(all, "default", null, 7)).toBe("t7");
    expect(pickOffering(all, "default", null, 14)).toBe("default");
    expect(pickOffering({}, "default", "LIFT-ALEX", 7)).toBe("default");
  });
});
