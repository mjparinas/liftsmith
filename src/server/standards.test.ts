import { beforeEach, describe, expect, it } from "vitest";

import { SITE_LANGS } from "@/lib/siteLang";
import { STANDARDS_TEXT } from "@/locales/site/standards";

import { query, resetDb, run } from "./db";
import {
  bandOf,
  countsByDefault,
  lifterOf,
  MIN_CELL,
  MIN_LIFT,
  noteCountry,
  percentile,
  publishedLifts,
  refreshStandards,
  standardsOf,
} from "./standards";
import { liftHtml, standardsGoneHtml, standardsIndexHtml } from "./standardsPage";

// Strength standards from real lifters (docs/decisions/public-pages-and-seo.md "Strength standards from lifters").
const NOW = Date.UTC(2026, 10, 15);
const DAY = 86_400_000;
let seq = 0;

async function lifter(o: { id: string; country?: string; profile: Record<string, unknown>; sets: [string, number, number, number?][] }) {
  await run("INSERT INTO accounts (id, email, created_at, last_seen, country) VALUES (?, ?, ?, ?, ?)", [
    o.id,
    `${o.id}@example.com`,
    NOW,
    NOW,
    o.country ?? "CA",
  ]);
  await run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    o.id,
    JSON.stringify(o.profile),
    NOW,
  ]);
  for (const [exerciseId, weight, reps, ago = 10] of o.sets) {
    const id = `e${++seq}`;
    await run("INSERT INTO sync_events (account_id, id, at, body) VALUES (?, ?, ?, ?)", [
      o.id,
      id,
      NOW - ago * DAY,
      JSON.stringify({ type: "set", id, at: NOW - ago * DAY, sessionId: "s", exerciseId, weight, reps, targetReps: reps, rir: 2 }),
    ]);
  }
}

const adult = { birthYear: 1990, sex: "male", bodyweight: 85 };

/** `count` men of 80 to 89 kg benching 60 kg upwards for 5. */
async function crowd(count: number, extra: Record<string, unknown> = {}, prefix = "m") {
  for (let i = 0; i < count; i++)
    await lifter({ id: `${prefix}${i}`, profile: { ...adult, ...extra }, sets: [["bench-press", 60 + i, 5]] });
}

beforeEach(async () => {
  await resetDb();
  seq = 0;
});

describe("who counts", () => {
  it("counts adults with sex and body weight, by default only outside the EU, EEA, UK and Switzerland", () => {
    expect(lifterOf(JSON.stringify(adult), "CA", NOW)).toEqual({ sex: "male", kg: 85 });
    expect(lifterOf(JSON.stringify(adult), "DE", NOW)).toBeNull();
    expect(lifterOf(JSON.stringify({ ...adult, standards: true }), "DE", NOW)).not.toBeNull();
    expect(lifterOf(JSON.stringify({ ...adult, standards: false }), "CA", NOW)).toBeNull();
    expect(lifterOf(JSON.stringify(adult), null, NOW)).toBeNull();
    expect(countsByDefault("gb")).toBe(false);
    expect(countsByDefault("US")).toBe(true);
  });

  it("never counts under-18s, or anyone without a birth year, sex or body weight", () => {
    expect(lifterOf(JSON.stringify({ ...adult, birthYear: 2010, standards: true }), "CA", NOW)).toBeNull();
    expect(lifterOf(JSON.stringify({ sex: "male", bodyweight: 85 }), "CA", NOW)).toBeNull();
    expect(lifterOf(JSON.stringify({ birthYear: 1990, bodyweight: 85 }), "CA", NOW)).toBeNull();
    expect(lifterOf(JSON.stringify({ birthYear: 1990, sex: "female" }), "CA", NOW)).toBeNull();
    expect(lifterOf("not json", "CA", NOW)).toBeNull();
  });

  it("groups body weight in 10 kg steps, open at both ends", () => {
    expect(bandOf("male", 55)).toBe(50);
    expect(bandOf("male", 84.9)).toBe(80);
    expect(bandOf("male", 140)).toBe(120);
    expect(bandOf("female", 45)).toBe(40);
    expect(bandOf("female", 101)).toBe(100);
  });

  it("takes percentiles by nearest rank, to the nearest half kilogram", () => {
    const list = Array.from({ length: 100 }, (_, i) => i + 1.2);
    expect(percentile(list, 50)).toBe(50);
    expect(percentile(list, 90)).toBe(90);
    expect(percentile([7.3], 25)).toBe(7.5);
  });
});

describe("the daily rebuild", () => {
  it("keeps only groups with enough lifters, and only percentiles and counts", async () => {
    await crowd(MIN_CELL);
    await crowd(MIN_CELL - 1, { sex: "female", bodyweight: 62 }, "w");
    expect(await refreshStandards(NOW)).toBe(2); // the men's 80 kg group and all men
    const rows = await standardsOf("bench-press");
    expect(rows.map((r) => [r.sex, r.band, r.n])).toEqual([
      ["male", 0, MIN_CELL],
      ["male", 80, MIN_CELL],
    ]);
    // 60 + i kg for 5 reps: Epley 1 + 5/30.
    expect(rows[0]!.p50).toBe(Math.round((60 + 14) * (1 + 5 / 30) * 2) / 2);
    const cols = (await query("PRAGMA table_info(strength_standards)")).map((c) => c.name);
    expect(cols).not.toContain("account_id");
  });

  it("leaves out sets older than a year, over 10 reps, impossible results and lifters who said no", async () => {
    await crowd(MIN_CELL);
    await lifter({ id: "old", profile: adult, sets: [["bench-press", 300, 1, 400]] });
    await lifter({ id: "long", profile: adult, sets: [["bench-press", 200, 15]] });
    await lifter({ id: "slip", profile: adult, sets: [["bench-press", 900, 1]] });
    await lifter({ id: "no", profile: { ...adult, standards: false }, sets: [["bench-press", 150, 1]] });
    await lifter({ id: "eu", country: "FR", profile: adult, sets: [["bench-press", 150, 1]] });
    await lifter({ id: "teen", profile: { ...adult, birthYear: 2011, standards: true }, sets: [["bench-press", 100, 1]] });
    await refreshStandards(NOW);
    const all = (await standardsOf("bench-press")).find((r) => r.band === 0)!;
    expect(all.n).toBe(MIN_CELL);
  });

  it("publishes a lift's page once one sex has enough lifters", async () => {
    await crowd(MIN_CELL);
    await refreshStandards(NOW);
    expect(await publishedLifts()).toEqual([]);
    await crowd(MIN_LIFT - MIN_CELL, {}, "n");
    await refreshStandards(NOW);
    expect((await publishedLifts()).map((l) => [l.lift, l.n])).toEqual([["bench-press", MIN_LIFT]]);
  });

  it("remembers the country an account syncs from", async () => {
    await lifter({ id: "a", profile: adult, sets: [] });
    await noteCountry("a", "de");
    await noteCountry("a", "not a country");
    expect((await query("SELECT country FROM accounts WHERE id = 'a'"))[0]!.country).toBe("DE");
  });
});

describe("the pages", () => {
  it("draws a lift's table in every language, indexed only with enough lifters", async () => {
    await crowd(MIN_CELL);
    await refreshStandards(NOW);
    const rows = await standardsOf("bench-press");
    for (const lang of SITE_LANGS) {
      const html = liftHtml(lang, "bench-press", rows, []);
      expect(html, lang).toContain("<table>");
      expect(html, lang).toContain('"@type":"Dataset"');
      expect(html, lang).not.toMatch(/\{\w+\}|undefined|NaN/);
      expect(html, lang).toContain('name="robots" content="noindex"');
    }
    expect(standardsIndexHtml("en", [])).toContain(STANDARDS_TEXT.en.index.empty);
    expect(standardsGoneHtml("ja")).toContain(STANDARDS_TEXT.ja.gone);
  });

  it("has every line in every language, with English's placeholders", () => {
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const strings = (o: unknown, path = ""): [string, string][] =>
      typeof o === "string"
        ? [[path, o]]
        : o && typeof o === "object"
          ? Object.entries(o).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
          : [];
    const en = new Map(strings(STANDARDS_TEXT.en));
    for (const lang of SITE_LANGS) {
      const local = new Map(strings(STANDARDS_TEXT[lang]));
      expect([...local.keys()].sort(), lang).toEqual([...en.keys()].sort());
      for (const [k, v] of local) expect(holes(v), `${lang} ${k}`).toEqual(holes(en.get(k)!));
    }
  });
});
