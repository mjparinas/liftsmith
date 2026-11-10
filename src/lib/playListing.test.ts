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
      expect(text).not.toMatch(/fitbod|hevy|strong app|stronglifts|gymverse|strava|oura|whoop|apple watch|wear os|\$\d/i);
    }
  });

  it("uses www for every getliftsmith.com URL", () => {
    expect(doc).not.toMatch(/https?:\/\/getliftsmith\.com/);
  });

  it("has the art the listing names", () => {
    // Each screenshot table names files in the folder its section points to (`store/play/<folder>/`).
    for (const section of doc.split(/^## /m)) {
      const folder = /`store\/play\/(\w[\w-]*)\/`/.exec(section)?.[1];
      const files = [...section.matchAll(/\| \d \| (\d\d-[\w-]+\.jpg) \|/g)].map((m) => m[1]!);
      if (files.length) expect(folder, section.split("\n")[0]).toBeTruthy();
      for (const f of files) expect(existsSync(join(process.cwd(), "store/play", folder!, f)), `${folder}/${f}`).toBe(true);
    }
    expect(existsSync(join(process.cwd(), "store/play/feature-graphic.png"))).toBe(true);
  });
});
