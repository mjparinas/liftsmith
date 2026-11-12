import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// docs/PLAY_LISTING.md holds the Google Play listing text. Play rejects text over its limits, and our own
// rules keep claims and URLs honest, so check them here rather than at upload time.
const doc = readFileSync(join(process.cwd(), "docs/PLAY_LISTING.md"), "utf8");
const bold = (heading: string) => {
  const section = doc.split(`## ${heading}`)[1];
  return /\*\*(.+?)\*\*/.exec(section)![1];
};
const full = /## Full description[\s\S]*?```text\n([\s\S]*?)```/.exec(doc)![1].trim();

describe("Play listing", () => {
  it("fits Play's limits", () => {
    expect(bold("App name").length).toBeLessThanOrEqual(30);
    expect(bold("Short description").length).toBeLessThanOrEqual(80);
    expect(full.length).toBeLessThanOrEqual(4000);
  });

  it("keeps to the metadata rules", () => {
    for (const text of [bold("App name"), bold("Short description"), full]) {
      expect(text).not.toMatch(/\b(best|#1|number one)\b/i);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      // No other apps' names, and nothing that isn't built yet.
      expect(text).not.toMatch(/fitbod|hevy|strong app|stronglifts|gymverse|strava|oura|whoop|apple watch|\$\d/i);
    }
  });

  it("uses www for every getliftsmith.com URL", () => {
    expect(doc).not.toMatch(/https?:\/\/getliftsmith\.com/);
  });

  it("has the art the listing names", () => {
    hasArt(doc);
  });
});

// docs/PLAY_LISTING_TRANSLATIONS.md holds the same listing in the app's other languages, one "## " section each.
const translations = readFileSync(join(process.cwd(), "docs/PLAY_LISTING_TRANSLATIONS.md"), "utf8");
const languages = translations.split(/^## /m).slice(1);
const captions = JSON.parse(readFileSync(join(process.cwd(), "scripts/play-captions.json"), "utf8")) as Record<string, string[][]>;

describe("Play listing translations", () => {
  it("has every language the app speaks but English", () => {
    expect(languages.map((l) => l.split("\n")[0]!.trim())).toEqual(["Español", "Français", "Deutsch", "Italiano", "日本語"]);
  });

  for (const section of languages) {
    const lang = section.split("\n")[0]!.trim();
    const part = (heading: string) => section.split(`### ${heading}`)[1]!.split("### ")[0]!;
    const name = /\*\*(.+?)\*\*/.exec(part("App name"))![1]!;
    const short = /\*\*(.+?)\*\*/.exec(part("Short description"))![1]!;
    const text = /```text\n([\s\S]*?)```/.exec(section)![1]!.trim();

    it(`${lang}: fits Play's limits and keeps to the metadata rules`, () => {
      expect(name.length).toBeLessThanOrEqual(30);
      expect(short.length).toBeLessThanOrEqual(80);
      expect(text.length).toBeLessThanOrEqual(4000);
      for (const t of [name, short, text]) {
        expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
        // Word edges that know letters like ä, so "bestätigst" isn't read as "best".
        expect(t).not.toMatch(
          /(?<![\p{L}\p{N}])(best|#1|number one|mejor|meilleure?|beste[nrs]?|migliore)(?![\p{L}\p{N}])|ナンバーワン|最高の|No\.1/iu,
        );
        expect(t).not.toMatch(/fitbod|hevy|strong app|stronglifts|gymverse|strava|oura|whoop|apple watch|[$€£¥]\s?\d/i);
      }
    });

    it(`${lang}: has its screenshots, with the captions play-compose.mjs draws`, () => {
      hasArt(section);
      const code = /`store\/play\/phone-(\w+)\/`/.exec(section)![1]!;
      const rows = [...section.matchAll(/^\| \d \| [\w-]+\.jpg \| (.+?) \| (.+?) \|$/gm)].map((m) => [m[1], m[2]]);
      expect(rows).toEqual(captions[code]);
    });
  }
});

function hasArt(doc: string) {
  // Each screenshot table names files in the folder its section points to (`store/play/<folder>/`).
  for (const section of doc.split(/^## /m)) {
    const folder = /`store\/play\/(\w[\w-]*)\/`/.exec(section)?.[1];
    const files = [...section.matchAll(/\| \d \| (\d\d-[\w-]+\.jpg) \|/g)].map((m) => m[1]!);
    if (files.length) expect(folder, section.split("\n")[0]).toBeTruthy();
    for (const f of files) expect(existsSync(join(process.cwd(), "store/play", folder!, f)), `${folder}/${f}`).toBe(true);
  }
  expect(existsSync(join(process.cwd(), "store/play/feature-graphic.png"))).toBe(true);
}
