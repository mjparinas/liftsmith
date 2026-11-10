import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The iOS app's own Swift text (Siri phrases, widget, Live Activity, rest-over alert) is translated in
// .strings files, which follow the phone's language. Each file needs Spanish and French with the same
// keys, must be in the Xcode project, and every Siri phrase in ShortcutIntents.swift needs a line.
const IOS = join(__dirname, "../../ios/App");
const FILES = ["App/{l}.lproj/Localizable.strings", "App/{l}.lproj/AppShortcuts.strings", "LiftsmithWidgets/{l}.lproj/Localizable.strings"];

function keys(path: string): string[] {
  return [...readFileSync(join(IOS, path), "utf8").matchAll(/^"((?:[^"\\]|\\.)*)" = "(?:[^"\\]|\\.)*";$/gm)].map((m) => m[1]!);
}

describe("iOS strings files", () => {
  it("Spanish and French have the same keys, and the project builds them", () => {
    const project = readFileSync(join(IOS, "App.xcodeproj/project.pbxproj"), "utf8");
    for (const f of FILES) {
      const es = keys(f.replace("{l}", "es"));
      expect(es.length, f).toBeGreaterThan(0);
      expect(keys(f.replace("{l}", "fr")), f).toEqual(es);
      expect(project, f).toContain(`path = es.lproj/${f.split("/").pop()}`);
    }
  });

  it("every Siri phrase has a translation", () => {
    const swift = readFileSync(join(IOS, "App/ShortcutIntents.swift"), "utf8");
    const phrases = [...swift.matchAll(/"([^"]*\\\(\.applicationName\)[^"]*)"/g)].map((m) =>
      m[1]!.replace("\\(.applicationName)", "${applicationName}"),
    );
    expect(phrases.length).toBeGreaterThan(0);
    expect(keys("App/es.lproj/AppShortcuts.strings").sort()).toEqual([...new Set(phrases)].sort());
  });
});
