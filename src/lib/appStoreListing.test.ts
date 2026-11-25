import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// docs/APP_STORE_LISTING.md holds the App Store Connect listing text. Apple rejects text over its limits.
const doc = readFileSync(join(process.cwd(), "docs/APP_STORE_LISTING.md"), "utf8");
const bold = (heading: string) => {
  const section = doc.split(`## ${heading}`)[1];
  return /\*\*(.+?)\*\*/.exec(section)![1];
};
const full = /## Description[\s\S]*?```text\n([\s\S]*?)```/.exec(doc)![1].trim();
const keywords = /## Keywords[\s\S]*?```text\n([\s\S]*?)```/.exec(doc)![1].trim();

describe("App Store listing", () => {
  it("fits App Store Connect's limits", () => {
    expect(bold("Name").length).toBeLessThanOrEqual(30);
    expect(bold("Subtitle").length).toBeLessThanOrEqual(30);
    expect(bold("Promotional text").length).toBeLessThanOrEqual(170);
    expect(full.length).toBeLessThanOrEqual(4000);
    expect(keywords.length).toBeLessThanOrEqual(100);
  });

  it("keeps to the metadata rules", () => {
    for (const text of [bold("Name"), bold("Subtitle"), bold("Promotional text"), full, keywords]) {
      expect(text).not.toMatch(/\b(best|#1|number one)\b/i);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(text).not.toMatch(/fitbod|hevy|strong app|stronglifts|gymverse|strava|oura|whoop|wear os|health connect|\$\d/i);
    }
  });

  it("uses www for every getliftsmith.com URL", () => {
    expect(doc).not.toMatch(/https?:\/\/getliftsmith\.com/);
  });

  it("names Apple Watch and Sign in with Apple, not Wear OS", () => {
    expect(full).toMatch(/Apple Watch/);
    expect(full).toMatch(/Sign in with Apple/);
    expect(full).not.toMatch(/Wear OS|Health Connect/i);
  });
});
