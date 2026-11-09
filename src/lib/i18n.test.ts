import { afterEach, describe, expect, it } from "vitest";
import { en, type MessageKey } from "@/locales/en";
import { es } from "@/locales/es";
import { fr } from "@/locales/fr";
import { currentLang, currentTag, list, num, parseNum, relative, resolve, setLanguage, t, type Message } from "./i18n";
import { fmtNum, plainNum } from "./units";
import { EQUIPMENT_GROUPS, EQUIPMENT_LABEL, MUSCLE_LABEL } from "./types";
import { bandOf } from "./recovery";

const holes = (m: Message) => [...new Set(Object.values(typeof m === "string" ? { m } : m).flatMap((s) => [...s!.matchAll(/\{(\w+)\}/g)].map((x) => x[1])))].sort();

afterEach(() => setLanguage("system"));

describe("catalogues", () => {
  for (const [name, cat] of Object.entries({ es, fr })) {
    it(`${name} has every English key, and no others`, () => {
      expect(Object.keys(cat).sort()).toEqual(Object.keys(en).sort());
    });
    it(`${name} keeps every placeholder`, () => {
      for (const k of Object.keys(en) as MessageKey[]) expect(holes(cat[k]!), k).toEqual(holes(en[k]));
    });
  }
});

describe("language", () => {
  it("follows the phone's first supported language, keeping its region for formats", () => {
    expect(resolve(["de-DE", "es-MX", "en-US"])).toEqual({ lang: "es", tag: "es-MX" });
    expect(resolve(["fr-CA"])).toEqual({ lang: "fr", tag: "fr-CA" });
    expect(resolve(["ja-JP"])).toEqual({ lang: "en", tag: "en" });
    expect(resolve(["en-GB", "fr-FR"])).toEqual({ lang: "en", tag: "en-GB" });
  });

  it("lets Settings pick one, keeping the phone's region when it matches", () => {
    expect(resolve(["en-GB", "es-AR"], "es")).toEqual({ lang: "es", tag: "es-AR" });
    expect(resolve(["en-GB"], "fr")).toEqual({ lang: "fr", tag: "fr" });
  });

  it("translates, fills placeholders and falls back to English", () => {
    setLanguage("es");
    expect(currentLang()).toBe("es");
    expect(t("tab.today")).toBe("Hoy");
    expect(t("workout.setOf", { n: 2, total: 4 })).toBe("Serie 2 de 4");
    setLanguage("fr");
    expect(t("workout.setOf", { n: 2, total: 4 })).toBe("Série 2 sur 4");
    setLanguage("en");
    expect(t("today.hello", { greeting: t("today.morning"), name: "Melvin" })).toBe("Good morning, Melvin");
  });

  it("formats numbers, lists and relative times with the platform's Intl", () => {
    setLanguage("fr");
    expect(currentTag()).toBe("fr");
    expect(fmtNum(82.5)).toBe("82,5");
    expect(num(1234.5)).toMatch(/^1\s234,5$/);
    expect(list(["squat", "développé couché", "soulevé de terre"])).toBe("squat, développé couché et soulevé de terre");
    expect(relative(-1, "day")).toBe("hier");
    setLanguage("es");
    expect(fmtNum(2.25)).toBe("2,25");
    setLanguage("en");
    expect(fmtNum(82.5)).toBe("82.5");
    expect(fmtNum(100)).toBe("100");
  });

  it("keeps a point in input boxes and reads a comma typed in any language", () => {
    setLanguage("fr");
    expect(plainNum(82.5)).toBe("82.5");
    expect(parseNum("82,5")).toBe(82.5);
    expect(parseNum(" 82.5 ")).toBe(82.5);
  });

  it("translates engine labels (muscles, recovery bands) on each read", () => {
    expect(MUSCLE_LABEL.chest).toBe("Chest");
    expect(bandOf(95).label).toBe("Fresh");
    setLanguage("fr");
    expect(MUSCLE_LABEL.chest).toBe("Pectoraux");
    expect(bandOf(20).label).toBe("Fatigué");
    expect(Object.keys(MUSCLE_LABEL)).toContain("hamstrings");
    setLanguage("es");
    expect(MUSCLE_LABEL.hamstrings).toBe("Isquiotibiales");
    expect(EQUIPMENT_LABEL.bench).toBe("Banco plano");
    expect(EQUIPMENT_GROUPS[2].title).toBe("Máquinas");
    expect(t("done.prs", { count: 2 })).toBe("¡2 récords nuevos!");
  });
});
