import { describe, expect, it } from "vitest";

import { CLOUD, CLOUD_NAME } from "@/lib/cloud";
import { PRO_FEATURES } from "@/lib/entitlements";
import { LABS } from "@/lib/labs";

import { ALL_CONNECTIONS, ALL_FEATURES, FEATURE_GROUPS, newestFeatures } from "./features";
import { IMPORT_SOURCES } from "./imports";
import { LANDINGS } from "./landings";

// The features page must list what the app has (AGENTS.md "Features page"). These fail when a feature lands
// without its line on /features/, so the page can't fall behind.
describe("the features page list", () => {
  it("has unique ids and real days", () => {
    for (const ids of [ALL_FEATURES.map((f) => f.id), FEATURE_GROUPS.map((g) => g.id)]) expect(new Set(ids).size).toBe(ids.length);
    const cids = ALL_CONNECTIONS.map((c) => c.id);
    expect(new Set(cids).size).toBe(cids.length);
    for (const f of ALL_FEATURES) expect(f.added, f.id).toMatch(/^2\d{3}-\d{2}-\d{2}$/);
  });

  it("lists every lab, marked Labs", () => {
    for (const lab of LABS) {
      const f = ALL_FEATURES.find((x) => x.lab === lab.flag);
      expect(f, `${lab.flag} is missing from src/content/features.ts`).toBeDefined();
      expect(f!.tier).toBe("lab");
      if (lab.native) expect(f!.where, `${lab.flag} is in the phone apps only`).toBe("phones");
    }
    // And nothing claims to be a lab that isn't one any more (a lab that graduated changes its tier).
    for (const f of ALL_FEATURES.filter((x) => x.tier === "lab"))
      expect(
        LABS.some((l) => l.flag === f.lab),
        f.id,
      ).toBe(true);
  });

  it("lists every Pro feature, marked Pro", () => {
    for (const key of PRO_FEATURES) {
      if (key === "labs") continue; // Labs is its own group.
      const f = ALL_FEATURES.find((x) => x.pro === key);
      expect(f, `Pro feature ${key} is missing from src/content/features.ts`).toBeDefined();
      expect(["pro", "both"]).toContain(f!.tier);
    }
  });

  it("lists every connected service and import source in the table", () => {
    const text = ALL_CONNECTIONS.map((c) => c.name).join(" | ");
    for (const c of CLOUD) expect(text, `${CLOUD_NAME[c]} is missing from the connections table`).toContain(CLOUD_NAME[c]);
    for (const s of IMPORT_SOURCES) expect(text, `${s.name} is missing from the connections table`).toContain(s.name);
  });

  it("links every feature page from its feature", () => {
    const linked = new Set(ALL_FEATURES.map((f) => f.landing));
    for (const l of LANDINGS.filter((x) => x.group === "features")) expect(linked.has(l.slug), l.slug).toBe(true);
    for (const f of ALL_FEATURES.filter((x) => x.landing))
      expect(LANDINGS.some((l) => l.group === "features" && l.slug === f.landing)).toBe(true);
  });

  it("shows the latest features, grouped by category in page order", () => {
    const groups = newestFeatures();
    expect(groups.length).toBeGreaterThan(0);
    const order = FEATURE_GROUPS.map((g) => g.id);
    expect(groups.map((g) => order.indexOf(g.group.id))).toEqual(groups.map((g) => order.indexOf(g.group.id)).sort((a, b) => a - b));
    const latest = ALL_FEATURES.map((f) => f.added)
      .sort()
      .at(-1);
    const shown = groups.flatMap((g) => g.features);
    for (const f of ALL_FEATURES.filter((x) => x.added === latest)) expect(shown).toContain(f);
  });
});
