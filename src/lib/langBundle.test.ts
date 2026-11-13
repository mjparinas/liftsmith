import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { english, setLanguage, t } from "./i18n";

// The app loads one language at a time (docs/decisions/speed.md "One language at a time"). One run-time import of a
// whole catalogue from app code would put every language back into the first load, so this fails on one.

const ROOTS = ["src/lib", "src/components", "src/content"];
// Reminder text (rmd.*) is small and also read on the server, so it's allowed whole.
const ALLOWED = new Set(["src/lib/messageText.ts"]);
const CATALOGUE = /^import (?!type\b)[^;]*from "@\/locales\/(en|es|fr|de|it|ja|text\/[\w]+)"/m;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return files(p);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [p] : [];
  });
}

describe("one language at a time", () => {
  it("app code never imports a whole catalogue at run time", () => {
    const bad = ROOTS.flatMap(files).filter((f) => !ALLOWED.has(f) && CATALOGUE.test(fs.readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });

  it("still reads the English text in another language", () => {
    setLanguage("fr");
    expect(t("settings.lean")).toBe("Mode sobre");
    expect(english("settings.lean")).toBe("Lean mode");
    setLanguage("system");
  });
});
