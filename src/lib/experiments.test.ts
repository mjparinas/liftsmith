// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { rolledOut } from "./experiments";
import { flag, FLAG_CACHE_KEY, FLAG_LOCAL_KEY, replaceServerFlags, setLocalFlag } from "./flags";
import { flagsUrl, refreshFlags } from "./remoteFlags";

const ids = Array.from({ length: 2000 }, (_, i) => `install-${String(i).padStart(4, "0")}`);

describe("flag rollouts", () => {
  it("gives a partial rollout to about that share of installs, the same ones every time, and only adds as it grows", () => {
    const at = (r: number) => ids.filter((id) => rolledOut("trialDays", { value: 7, rollout: r }, id) === 7);
    const ten = at(10);
    expect(ten.length / ids.length).toBeGreaterThan(0.07);
    expect(ten.length / ids.length).toBeLessThan(0.13);
    expect(at(10)).toEqual(ten);
    const fifty = new Set(at(50));
    expect(ten.every((id) => fifty.has(id))).toBe(true);
  });

  it("keeps the default with no state, a bad value, no id on a partial rollout, or 0%", () => {
    expect(rolledOut("trialDays", undefined, "install-0001")).toBe(14);
    expect(rolledOut("trialDays", { value: 30, rollout: 100 }, "install-0001")).toBe(14);
    expect(rolledOut("trialDays", { value: 7, rollout: 50 }, null)).toBe(14);
    expect(rolledOut("trialDays", { value: 7, rollout: 100 }, null)).toBe(7);
    expect(ids.some((id) => rolledOut("repMotion", { value: true, rollout: 0 }, id))).toBe(false);
  });
});

describe("flags on the device", () => {
  afterEach(() => {
    localStorage.removeItem(FLAG_CACHE_KEY);
    localStorage.removeItem(FLAG_LOCAL_KEY);
    vi.unstubAllEnvs();
  });

  it("lets this device's own setting win over the server, and a server reset clear", () => {
    replaceServerFlags({ repMotion: true, trialDays: 7 });
    expect(flag("repMotion")).toBe(true);
    setLocalFlag("repMotion", false);
    expect(flag("repMotion")).toBe(false);
    replaceServerFlags({ repMotion: true });
    expect(flag("trialDays")).toBe(14);
  });

  it("asks with the install id only while usage stats are on", async () => {
    expect(flagsUrl(null)).toBe("/api/flags/");
    localStorage.setItem("liftsmith.analytics", "off");
    const get = vi.fn(async (url: string) => {
      void url;
      return Response.json({ flags: { trialDays: 7, nope: 1 } });
    });
    expect(await refreshFlags(get as unknown as typeof fetch)).toBe(true);
    expect(get.mock.calls[0]![0]).toBe("/api/flags/");
    expect(flag("trialDays")).toBe(7);
    localStorage.setItem("liftsmith.analytics", "on");
    await refreshFlags(get as unknown as typeof fetch);
    expect(get.mock.calls[1]![0]).toMatch(/\?install=/);
    // A failed answer keeps the last one.
    expect(await refreshFlags((async () => new Response("", { status: 503 })) as unknown as typeof fetch)).toBe(false);
    expect(flag("trialDays")).toBe(7);
    localStorage.removeItem("liftsmith.analytics");
  });
});
