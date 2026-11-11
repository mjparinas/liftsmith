// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { setBillingLive } from "./billing";
import { cacheFlags, FLAGS } from "./flags";
import { labOn, LABS, setLab } from "./labs";

afterEach(() => {
  localStorage.clear();
  setBillingLive(false);
});

describe("labs", () => {
  it("lists every lab flag in Settings › Labs, once", () => {
    // A merge once dropped a lab's line from LABS, which hid its switch while its flag stayed.
    const flags = Object.keys(FLAGS).filter((f) => f.startsWith("lab") || f === "repMotion");
    expect(LABS.map((l) => l.flag).sort()).toEqual(flags.sort());
  });

  it("are off until switched on", () => {
    expect(labOn("labRepCount")).toBe(false);
    setLab("labRepCount", true);
    expect(labOn("labRepCount")).toBe(true);
    setLab("labRepCount", false);
    expect(labOn("labRepCount")).toBe(false);
  });

  it("are Pro only, whatever the flag says", () => {
    setLab("labRepCount", true);
    setBillingLive(true, null);
    expect(labOn("labRepCount")).toBe(false);
    setBillingLive(true, { active: true, trial: false, plan: "annual", expiresAt: null, willRenew: true });
    expect(labOn("labRepCount")).toBe(true);
  });

  it("need the lab they build on", () => {
    setLab("repMotion", true);
    expect(labOn("repMotion")).toBe(false);
    setLab("labRepCount", true);
    expect(labOn("repMotion")).toBe(true);
  });

  it("switched on this device win over the server", () => {
    setLab("labRepCount", true);
    cacheFlags({ labRepCount: false });
    expect(labOn("labRepCount")).toBe(true);
  });
});
