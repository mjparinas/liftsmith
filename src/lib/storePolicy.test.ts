// Store review rules that live in config files rather than code: the Android manifest must ask for
// exactly the Health Connect permissions health.ts uses (Play rejects unused ones), and precise
// location must stop at Android 11, where Bluetooth scanning no longer needs it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { READ, WRITE } from "./health";
import { CONTACT_EMAIL } from "./site";

const root = join(__dirname, "..", "..");
const manifest = readFileSync(join(root, "android/app/src/main/AndroidManifest.xml"), "utf8");

// The health plugin's data type names and their Health Connect permission suffixes.
const PERMISSION: Record<string, string> = {
  weight: "WEIGHT",
  height: "HEIGHT",
  bodyFat: "BODY_FAT",
  restingHeartRate: "RESTING_HEART_RATE",
  heartRate: "HEART_RATE",
  heartRateVariability: "HEART_RATE_VARIABILITY",
  sleep: "SLEEP",
  steps: "STEPS",
  vo2Max: "VO2_MAX",
  respiratoryRate: "RESPIRATORY_RATE",
  calories: "ACTIVE_CALORIES_BURNED",
};

const tags = [...manifest.matchAll(/<uses-permission[^>]*android:name="android\.permission\.health\.([A-Z0-9_]+)"([^>]*)\/>/g)];
const kept = tags.filter((m) => !m[2].includes('tools:node="remove"')).map((m) => m[1]);

describe("Play store policy config", () => {
  it("declares exactly the Health Connect permissions health.ts requests", () => {
    const wanted = [...READ.map((t) => `READ_${PERMISSION[t]}`), ...WRITE.map((t) => `WRITE_${PERMISSION[t]}`)];
    expect(wanted.every((w) => !w.includes("undefined"))).toBe(true);
    expect([...kept].sort()).toEqual([...wanted].sort());
  });

  it("removes every other health permission the plugin adds", () => {
    const removed = tags.filter((m) => m[2].includes('tools:node="remove"')).map((m) => m[1]);
    for (const p of [
      "READ_HEART_RATE",
      "READ_OXYGEN_SATURATION",
      "READ_BLOOD_PRESSURE",
      "READ_BLOOD_GLUCOSE",
      "READ_NUTRITION",
      "READ_EXERCISE",
      "WRITE_WEIGHT",
    ]) {
      expect(removed).toContain(p);
    }
  });

  it("caps precise location at Android 11", () => {
    expect(manifest).toMatch(/android\.permission\.ACCESS_FINE_LOCATION"\s+android:maxSdkVersion="30"\s+tools:node="replace"/);
  });

  it("names every health type and a contact on the Health Connect privacy page", () => {
    const page = readFileSync(join(root, "public/privacypolicy.html"), "utf8");
    expect(page).toContain("Limited Use");
    expect(page).toContain(CONTACT_EMAIL);
    for (const t of [
      "weight",
      "height",
      "body fat",
      "resting heart rate",
      "sleep",
      "heart rate variability",
      "steps",
      "VO2 max",
      "respiratory rate",
    ])
      expect(page).toContain(t);
    expect(page).not.toMatch(/blood|oxygen saturation|nutrition/i);
  });
});
