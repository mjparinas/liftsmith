// What's new (docs/decisions/whats-new.md): every change has its words in all ten languages, a lifter only hears
// about what they can reach, and the note on Today shows once, never to someone with no workouts yet.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as wn from "@/locales/text/wn";

import { autoAction, countKinds, LATEST, RELEASES, visibleChanges, type NewsView } from "./appNews";
import { compareVersions } from "./build";
import { LANGS } from "./i18n";
import { WHATS_NEW } from "./whatsNew";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string };

const all: NewsView = { unlocked: () => true, community: true, teen: false, native: true };

describe("releases", () => {
  it("are newest first, each with changes, and ids are unique", () => {
    const days = RELEASES.map((r) => r.day);
    expect([...days].sort().reverse()).toEqual(days);
    expect(LATEST).toBe(RELEASES[0]);
    const ids = RELEASES.flatMap((r) => r.changes.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RELEASES) expect(r.changes.length).toBeGreaterThan(0);
  });

  // docs/decisions/app-versions.md: a feature bumps the minor version and comes with its release here, a fix
  // bumps the patch, and several bumps before one promotion share the top release.
  it("are keyed by version, newest first, and the newest matches package.json's minor version", () => {
    const versions = RELEASES.map((r) => r.version);
    for (const v of versions) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
    for (let i = 1; i < versions.length; i++) expect(compareVersions(versions[i - 1]!, versions[i]!), versions[i]).toBeGreaterThan(0);
    expect(compareVersions(LATEST.version, pkg.version)).toBeLessThanOrEqual(0);
    expect(LATEST.version.split(".").slice(0, 2), "a minor bump needs a release in RELEASES").toEqual(pkg.version.split(".").slice(0, 2));
  });

  it("have a title and a body for every change in every language", () => {
    const cats = wn as unknown as Record<string, Record<string, unknown>>;
    for (const lang of LANGS)
      for (const r of RELEASES)
        for (const c of r.changes)
          for (const part of ["title", "body"]) expect(cats[lang]?.[`wn.c.${c.id}.${part}`], `${lang} wn.c.${c.id}.${part}`).toBeTruthy();
  });

  it("feed the website's page in English", () => {
    const day = WHATS_NEW.find((d) => d.day === LATEST.day);
    expect(day?.items).toHaveLength(LATEST.changes.length);
    expect(day?.items.every((i) => i.title && i.body)).toBe(true);
  });
});

describe("visibleChanges", () => {
  it("leaves out what a lifter hasn't unlocked yet or what doesn't apply", () => {
    const n = LATEST.changes.length;
    expect(visibleChanges(LATEST, all)).toHaveLength(n);
    const fresh = visibleChanges(LATEST, { ...all, unlocked: () => false });
    expect(fresh.some((c) => c.unlock)).toBe(false);
    expect(visibleChanges(LATEST, { ...all, teen: true }).some((c) => c.gate === "adult")).toBe(false);
    expect(visibleChanges(LATEST, { ...all, native: false }).some((c) => c.gate === "native")).toBe(false);
    expect(visibleChanges(LATEST, { ...all, community: false }).some((c) => c.gate === "community")).toBe(false);
  });

  it("counts each kind", () => {
    const n = countKinds(LATEST.changes);
    expect(n.new + n.better + n.fixed).toBe(LATEST.changes.length);
  });
});

describe("autoAction", () => {
  it("shows once to a lifter who has trained", () => {
    expect(autoAction(null, "2026-11-19", 4)).toBe("show");
    expect(autoAction("2026-11-09", "2026-11-19", 4)).toBe("show");
    expect(autoAction("2026-11-19", "2026-11-19", 4)).toBe("none");
  });

  it("only marks it seen for a lifter with no workouts", () => {
    expect(autoAction(null, "2026-11-19", 0)).toBe("mark");
  });
});
