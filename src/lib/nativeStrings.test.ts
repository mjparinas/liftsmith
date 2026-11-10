import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LANGS } from "./i18n";
import { MSG_LANGS } from "./messageText";

// The iOS app's own Swift text (Siri phrases, widget, Live Activity, rest-over alert) is translated in
// .strings files, which follow the phone's language. Each file needs every app language with the same keys,
// must be in the Xcode project, and every Siri phrase in ShortcutIntents.swift needs a line.
const IOS = join(__dirname, "../../ios/App");
// Every app language besides English (src/lib/i18n.ts LANGS); English is the keys themselves.
const OTHERS = LANGS.filter((l) => l !== "en");
const FILES = ["App/{l}.lproj/Localizable.strings", "App/{l}.lproj/AppShortcuts.strings", "LiftsmithWidgets/{l}.lproj/Localizable.strings"];

function keys(path: string): string[] {
  return [...readFileSync(join(IOS, path), "utf8").matchAll(/^"((?:[^"\\]|\\.)*)" = "(?:[^"\\]|\\.)*";$/gm)].map((m) => m[1]!);
}

describe("iOS strings files", () => {
  it("every language has the same keys, and the project builds them", () => {
    const project = readFileSync(join(IOS, "App.xcodeproj/project.pbxproj"), "utf8");
    for (const f of FILES) {
      const es = keys(f.replace("{l}", "es"));
      expect(es.length, f).toBeGreaterThan(0);
      for (const l of OTHERS) {
        expect(keys(f.replace("{l}", l)), `${f} ${l}`).toEqual(es);
        expect(project, `${f} ${l}`).toContain(`path = ${l}.lproj/${f.split("/").pop()}`);
      }
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

describe("app languages", () => {
  // One list of languages everywhere: the web app, emails and push text, Android's per-app language
  // setting and translated strings (phone and watch), and the iOS app's declared localizations.
  const ANDROID = join(__dirname, "../../android");
  it("are the same on the web, in messages, on Android and on iOS", () => {
    expect([...MSG_LANGS]).toEqual([...LANGS]);
    const localeConfig = readFileSync(join(ANDROID, "app/src/main/res/xml/locales_config.xml"), "utf8");
    expect([...localeConfig.matchAll(/android:name="(\w+)"/g)].map((m) => m[1])).toEqual([...LANGS]);
    for (const mod of ["app", "wear"])
      for (const l of OTHERS)
        expect(readFileSync(join(ANDROID, `${mod}/src/main/res/values-${l}/strings.xml`), "utf8"), `${mod} ${l}`).toContain("<string");
    const plist = readFileSync(join(IOS, "App/Info.plist"), "utf8");
    const localizations = plist.split("<key>CFBundleLocalizations</key>")[1]!.split("</array>")[0]!;
    expect([...localizations.matchAll(/<string>(\w+)<\/string>/g)].map((m) => m[1])).toEqual([...LANGS]);
    const project = readFileSync(join(IOS, "App.xcodeproj/project.pbxproj"), "utf8");
    const regions = project.split("knownRegions = (")[1]!.split(");")[0]!;
    for (const l of LANGS) expect(regions, l).toMatch(new RegExp(`\\b${l},`));
    for (const l of OTHERS) expect(project, l).toContain(`path = ${l}.lproj/Localizable.strings`);
  });
});
