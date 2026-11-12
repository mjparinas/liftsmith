// Words the website borrows from the app's own catalogues (src/locales/text), so a muscle, lift or demo control is
// named the same on the site as in the app. Server-only: pages pick the few lines they need and pass them to their
// client components as props, so no catalogue reaches the browser.
import type { DemoWords } from "@/components/demo/LiftDemoCore";
import type { Message } from "@/lib/i18n";
import { EQUIPMENT_NAME, MUSCLE_NAME } from "@/lib/seo";
import type { SiteLang } from "@/lib/siteLang";
import type { Equipment, Exercise, Muscle } from "@/lib/types";
import * as demo from "@/locales/text/demo";
import * as equipment from "@/locales/text/equipment";
import * as ex from "@/locales/text/ex";
import * as muscle from "@/locales/text/muscle";

type Catalogue = { en: Record<string, Message> } & Partial<Record<SiteLang, Partial<Record<string, Message>>>>;

function line(cat: Catalogue, lang: SiteLang, key: string): string | undefined {
  const m = cat[lang]?.[key] ?? cat.en[key];
  return typeof m === "string" ? m : m?.other;
}

/** Muscle names for the 3D figures' labels. English keeps the site's own names (MUSCLE_NAME). */
export function muscleLabels(lang: SiteLang): Record<Muscle, string> {
  if (lang === "en") return MUSCLE_NAME;
  const out = { ...MUSCLE_NAME };
  for (const m of Object.keys(out) as Muscle[]) out[m] = line(muscle, lang, `muscle.${m}`) ?? out[m];
  return out;
}

/** Exercise names by id, for the few lifts a page shows. */
export function exerciseNames(lang: SiteLang, ids: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    const name = line(ex, lang, `ex.${id}`);
    if (name) out[id] = name;
  }
  return out;
}

/** The 3D demo's controls and labels. */
export function demoWords(lang: SiteLang): DemoWords {
  // From the catalogue's own keys: LiftDemoCore is a client module, so its DEMO_WORDS can't be read on the server.
  // The catalogue matches DEMO_WORDS key for key (translations.test.ts).
  const out: Record<string, string> = {};
  for (const key of Object.keys(demo.en)) out[key.slice("demo.".length)] = line(demo, lang, key) ?? "";
  return out as DemoWords;
}

/** Equipment names, for a translated page's equipment line and chips. */
export function equipmentLabels(lang: SiteLang): Record<Equipment, string> {
  const out = { ...EQUIPMENT_NAME };
  for (const q of Object.keys(out) as Equipment[]) out[q] = line(equipment, lang, `equipment.${q}`) ?? out[q];
  return out;
}

/** A lift's name, setup line and cues as the app shows them in that language (English where a line is missing). */
export function exerciseWords(lang: SiteLang, e: Exercise): { name: string; setup: string; cues: string[] } {
  return {
    name: line(ex, lang, `ex.${e.id}`) ?? e.name,
    setup: line(ex, lang, `ex.${e.id}.setup`) ?? e.setup,
    cues: e.cues.map((c, i) => line(ex, lang, `ex.${e.id}.cue${i + 1}`) ?? c),
  };
}
