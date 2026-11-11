// The Android and iOS apps carry only the app, not the website (scripts/native-web.mjs, docs/decisions/app-size.md).
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { KEEP, prune } from "../../scripts/native-web.mjs";

const file = (path: string, body = "x") => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body);
};

describe("native web files", () => {
  it("keeps the app, its build files, rep counting and the icons, and drops the website", () => {
    const root = mkdtempSync(join(tmpdir(), "native-web-"));
    const out = join(root, "out");
    const shell = join(root, "public");
    for (const dir of [out, shell]) {
      for (const p of ["app/index.html", "_next/static/a.js", "mediapipe/pose.task", "index.html", "icon.svg", "manifest.webmanifest"])
        file(join(dir, p));
      for (const p of [
        "exercises/back-squat/index.html",
        "og/exercises/back-squat.jpg",
        "stills/back-squat.webp",
        "blog/index.html",
        "sitemap.xml",
      ])
        file(join(dir, p), "website");
    }
    // Capacitor adds its own files to the shell's copy; they aren't in out/ and must stay.
    file(join(shell, "cordova.js"));
    file(join(shell, "plugins/x.js"));

    const { removed, bytes } = prune(out, shell);

    expect(removed.sort()).toEqual(["blog", "exercises", "og", "sitemap.xml", "stills"]);
    expect(bytes).toBe("website".length * 5);
    expect(readdirSync(shell).sort()).toEqual([
      "_next",
      "app",
      "cordova.js",
      "icon.svg",
      "index.html",
      "manifest.webmanifest",
      "mediapipe",
      "plugins",
    ]);
    // out/ itself is untouched: the browser tests and the website use all of it.
    expect(existsSync(join(out, "exercises/back-squat/index.html"))).toBe(true);
  });

  it("refuses a folder with no app page, so a wrong path can't empty a shell", () => {
    const root = mkdtempSync(join(tmpdir(), "native-web-"));
    file(join(root, "public/app/index.html"));
    expect(() => prune(join(root, "missing"), join(root, "public"))).toThrow(/app\/index.html/);
    expect(existsSync(join(root, "public/app/index.html"))).toBe(true);
  });

  it("keeps what the app page loads", () => {
    // Everything the app's <head> links to by a root path (icons, manifest) must be on the list.
    for (const name of ["favicon.ico", "icon.svg", "apple-touch-icon.png", "icon-192.png", "manifest.webmanifest", "sw.js", "mediapipe"]) {
      expect(KEEP).toContain(name);
    }
  });

  it("runs after every Capacitor copy and sync", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["capacitor:copy:after"]).toBe("node scripts/native-web.mjs");
  });
});
