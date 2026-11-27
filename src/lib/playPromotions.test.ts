import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as ssn from "@/locales/text/ssn";

import { ART, renderDoc, type PromoEvent } from "../../scripts/play-promotions.mjs";
import { LANGS } from "./i18n";
import { DEFAULT_SEASONS, KITS } from "./seasons";

// Google Play promotional content for training seasons (docs/PLAY_PROMOTIONS.md, docs/decisions/play-promotions.md):
// one event at each season's start and one for its finale week, in every app language, within Play's rules.
const root = process.cwd();
const events = (JSON.parse(readFileSync(join(root, "store/play/promotions/events.json"), "utf8")) as { events: PromoEvent[] }).events;
const DAY = 86_400_000;
const at = (iso: string) => new Date(iso).getTime();
const catalogue = (lang: string) =>
  ({ ...ssn.en, ...(ssn as unknown as Record<string, Record<string, string>>)[lang] }) as unknown as Record<string, string>;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k]));

describe("Play promotional content", () => {
  it("has a finale for every built-in season and a start for every one after the first", () => {
    const want = DEFAULT_SEASONS.flatMap((s, i) => [...(i ? [`${s.id}-launch`] : []), `${s.id}-finale`]);
    expect(events.map((e) => e.id)).toEqual(want);
  });

  it("runs each event in its season, one at a time, within four weeks, submitted two weeks ahead", () => {
    for (const e of events) {
      const season = DEFAULT_SEASONS.find((s) => s.id === e.season)!;
      expect(e.kit).toBe(season.kit);
      const start = at(`${season.start}T00:00:00Z`);
      const first = e.kind === "launch" ? start : start + (season.weeks - 1) * 7 * DAY;
      expect(at(e.start), e.id).toBe(first + DAY / 2);
      expect(at(e.end) - at(e.start), e.id).toBeLessThanOrEqual(28 * DAY);
      expect(at(e.end), e.id).toBeLessThanOrEqual(start + season.weeks * 7 * DAY);
      expect(at(e.submitBy), e.id).toBe(first - 14 * DAY);
      expect(e.deepLink).toBe("https://www.getliftsmith.com/app/#/season");
    }
    for (let i = 1; i < events.length; i++) expect(at(events[i]!.start)).toBeGreaterThan(at(events[i - 1]!.end));
  });

  for (const e of events) {
    it(`${e.id}: every language, named the way the app names the season, within Play's rules`, () => {
      expect(Object.keys(e.text)).toEqual([...LANGS]);
      const n = DEFAULT_SEASONS.findIndex((s) => s.id === e.season) + 1;
      for (const lang of LANGS) {
        const { tagline, description } = e.text[lang]!;
        const cat = catalogue(lang);
        expect(tagline, lang).toContain(fill(cat["ssn.title"]!, { n, name: cat[`ssn.kit.${e.kit}`]! }));
        const cjk = lang === "ja" || lang === "ko";
        // 80 is Play's limit; 48 (23 in Japanese and Korean) also fits the spotlight format.
        expect([...tagline].length, `${lang} tagline`).toBeLessThanOrEqual(cjk ? 23 : 48);
        expect([...description].length, `${lang} description`).toBeLessThanOrEqual(500);
        expect([...description].length, `${lang} description`).toBeGreaterThanOrEqual(100);
        for (const t of [tagline, description]) {
          expect(t).not.toMatch(/[\n<>•]|\.\.\.|…|[!?]{2}/);
          expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
          expect(t).not.toMatch(/(?<![\p{L}\p{N}])(best app|#1|number one|top-rated|award)(?![\p{L}\p{N}])|[$€£¥₩₺]\s?\d|\d\s?(zł|R\$)/iu);
          expect(t).not.toMatch(/fitbod|hevy|strong app|stronglifts|gymverse|strava|oura|whoop|apple watch|google play/i);
          expect(t).not.toMatch(/download|install now|get it now|descarga|téléchargez|herunterladen|scarica|baixe|pobierz|indir/i);
        }
        expect(tagline).not.toMatch(/ [–-] /);
      }
    });

    it(`${e.id}: has its 1920×1080 image under 1 MB`, () => {
      const file = join(root, e.image);
      const png = readFileSync(file);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1920, 1080]);
      expect(statSync(file).size).toBeLessThanOrEqual(1_000_000);
      expect(e.image).toBe(`store/play/promotions/${e.kit}-${e.kind}.png`);
      expect(ART[e.kit]).toBeDefined();
      expect(KITS[e.kit]).toBeDefined();
    });
  }

  it("has docs/PLAY_PROMOTIONS.md up to date (node scripts/play-promotions.mjs --doc)", () => {
    expect(readFileSync(join(root, "docs/PLAY_PROMOTIONS.md"), "utf8")).toBe(renderDoc(events));
  });
});
