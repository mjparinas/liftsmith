import { readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { en, type MessageKey } from "@/locales/en";
import { es } from "@/locales/es";
import { fr } from "@/locales/fr";

import { CATEGORY_LABEL, TIER_LABEL } from "./achievements";
import { RARITY_LABEL } from "./game";
import { GLOSSARY } from "./glossary";
import { clockTime, currentLang, currentTag, list, num, parseNum, relative, resolve, setLanguage, t, weekday, type Message } from "./i18n";
import { FIX_TEXT } from "./plateau";
import { CALL_TEXT } from "./readiness";
import { bandOf } from "./recovery";
import { EQUIPMENT_GROUPS, EQUIPMENT_LABEL, MUSCLE_LABEL } from "./types";
import { fmtNum, plainNum } from "./units";
import { callWhy } from "./why";

const holes = (m: Message) =>
  [...new Set(Object.values(typeof m === "string" ? { m } : m).flatMap((s) => [...s!.matchAll(/\{(\w+)\}/g)].map((x) => x[1])))].sort();

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

describe("catalogue files", () => {
  // Text lives in src/locales/text/<prefix>.ts, one file per key prefix (see en.ts).
  const dir = new URL("../locales/text/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
  it("each file holds only its own prefix, in every language", async () => {
    for (const f of files) {
      const prefix = f.replace(/\.ts$/, "");
      const mod = (await import(`../locales/text/${prefix}.ts`)) as Record<string, object>;
      for (const lang of ["en", "es", "fr"]) for (const k of Object.keys(mod[lang])) expect(k.split(".")[0], `${f} ${lang}`).toBe(prefix);
    }
  });
  it("every file is part of every language", () => {
    for (const lang of ["en", "es", "fr"]) {
      const src = readFileSync(new URL(`../locales/${lang}.ts`, import.meta.url), "utf8");
      for (const f of files) expect(src, `${lang}.ts`).toContain(`from "./text/${f.replace(/\.ts$/, "")}"`);
    }
  });
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

  it("names weekdays and clock times with the platform's own formats", () => {
    setLanguage("en");
    expect(weekday(0)).toBe("Sun");
    expect(weekday(1, "long")).toBe("Monday");
    setLanguage("fr");
    expect(weekday(3, "long")).toBe("mercredi");
    expect(clockTime(18, 0)).toBe("18:00");
    expect(t("msgKind.missed")).toBe("Séances manquées");
  });

  it("explains glossary terms in the chosen language, one paragraph per line", () => {
    setLanguage("fr");
    expect(GLOSSARY.deload.title).toBe("Semaine de décharge");
    expect(GLOSSARY.rir.body).toHaveLength(2);
    setLanguage("es");
    expect(GLOSSARY.superset.title).toBe("Superserie");
    setLanguage("en");
    expect(GLOSSARY.deloadWeeks.body[1]).toMatch(/^Then comes one deload week/);
  });

  it("gives coaching reasons in the chosen language", () => {
    // Signals are worded when readiness runs, in the language of the moment.
    const sig = () => ({
      call: "push" as const,
      score: 70,
      signals: [
        { points: 10, text: t("sig.bigRecovered") },
        { points: 8, text: t("sig.rested") },
      ],
      challenge: false,
    });
    const r = sig();
    setLanguage("fr");
    expect(CALL_TEXT.push.label).toBe("Jour pour pousser");
    expect(FIX_TEXT.rest.title).toBe("Se reposer plus longtemps");
    expect(
      callWhy(
        {
          ...sig(),
          signals: [
            { points: 10, text: t("sig.bigRecovered") },
            { points: 5, text: t("sig.hrvHigh") },
          ],
        },
        "push",
        false,
      ),
    ).toBe(
      "On pousse aujourd’hui : grands muscles entièrement récupérés et VFC au-dessus de votre normale (forme 70). Votre premier gros exercice va une répétition plus près de l’échec.",
    );
    setLanguage("es");
    expect(callWhy(sig(), "recover", false)).toBe(
      "Hoy decides tú. Sugerimos un día para apretar porque: músculos grandes recuperados del todo y has descansado desde el último entrenamiento (preparación 70).",
    );
    setLanguage("en");
    expect(callWhy(r, "push", false)).toBe(
      "Push today: big muscles fully recovered and rested since your last workout (readiness 70). Your first big lift goes one rep closer to failure.",
    );
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
    expect(RARITY_LABEL.epic).toBe("Épico");
    expect(CATEGORY_LABEL.smart).toBe("Entrenar con cabeza");
    setLanguage("fr");
    expect(TIER_LABEL.gold).toBe("Or");
    setLanguage("es");
    expect(t("done.prs", { count: 2 })).toBe("¡2 récords nuevos!");
  });
});
