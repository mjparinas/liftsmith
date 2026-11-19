// The app's version has one source, package.json (docs/decisions/app-versions.md): the lockfile, the Xcode project
// and the Gradle files follow it, so the Android app, the iPhone app, the watches and the web app all say the same
// number. `node scripts/bump-version.mjs minor` (a feature) or `patch` (a fix) moves them together.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { compareVersions } from "./build";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const pkg = JSON.parse(read("package.json")) as { version: string };

describe("app version", () => {
  it("is major.minor.patch", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("is the same in the lockfile", () => {
    const lock = JSON.parse(read("package-lock.json")) as { version: string; packages: Record<string, { version?: string }> };
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[""]?.version).toBe(pkg.version);
  });

  it("is every iOS target's MARKETING_VERSION (app, widgets, watch)", () => {
    const found = [...read("ios/App/App.xcodeproj/project.pbxproj").matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
    expect(found.length).toBeGreaterThan(0);
    for (const v of found) expect(v).toBe(pkg.version);
  });

  it("is read from package.json by the phone and Wear OS Gradle files, never written into them", () => {
    for (const f of ["android/app/build.gradle", "android/wear/build.gradle"]) {
      const line = read(f)
        .split("\n")
        .find((l) => l.includes("versionName("));
      expect(line, f).toContain("package.json");
      expect(line, f).not.toMatch(/"\d+\.\d+\.\d+"/);
    }
  });
});

describe("compareVersions", () => {
  it("compares as numbers, not text", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
    expect(compareVersions("0.2.0", "0.2.1")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "0.99.99")).toBeGreaterThan(0);
  });
});
