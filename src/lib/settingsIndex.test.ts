import { describe, expect, it } from "vitest";

import { en } from "@/locales/en";

import { fold, searchSettings, SETTINGS_INDEX, type SettingRef } from "./settingsIndex";

// The Settings search (docs/decisions/settings-screen.md "Search"): every entry is a real line the app shows.
const say = (k: string) => {
  const v = (en as Record<string, unknown>)[k];
  return typeof v === "string" ? [v] : [];
};

describe("settings search index", () => {
  it("names only real, plain catalogue lines, each once", () => {
    const keys = SETTINGS_INDEX.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of SETTINGS_INDEX) {
      expect(typeof (en as Record<string, unknown>)[r.key], r.key).toBe("string");
      for (const a of r.also ?? []) expect(typeof (en as Record<string, unknown>)[a], a).toBe("string");
    }
  });

  it("finds a setting by part of its name, any case and without accents", () => {
    const hit = (q: string) => searchSettings(q, SETTINGS_INDEX, say).map((r) => r.key);
    expect(hit("vibra")).toEqual(["settings.vibration"]);
    expect(hit("DARK")).toContain("settings.appearance");
    expect(hit("pounds")).toContain("settings.units");
    expect(hit("rest timer")).toContain("train.autoRest");
    expect(hit("")).toEqual([]);
    expect(hit("zzzz")).toEqual([]);
    expect(fold("Übersicht señal")).toBe("ubersicht senal");
  });

  it("puts a label that starts with the words first", () => {
    const refs: SettingRef[] = [
      { key: "train.autoRest", place: "workout" },
      { key: "train.rest", place: "plan" },
    ];
    expect(searchSettings("rest", refs, say).map((r) => r.key)).toEqual(["train.rest", "train.autoRest"]);
  });
});
