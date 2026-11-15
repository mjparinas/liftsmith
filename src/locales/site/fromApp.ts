// Words the website borrows from the app's own catalogues (src/locales/text), so a muscle, lift or demo control is
// named the same on the site as in the app. Server-only: pages pick the few lines they need and pass them to their
// client components as props, so no catalogue reaches the browser.
import type { DemoWords } from "@/components/demo/LiftDemoCore";
import type { Message } from "@/lib/i18n";
import { EQUIPMENT_NAME, MUSCLE_NAME } from "@/lib/seo";
import type { SiteLang } from "@/lib/siteLang";
import { ACTIVITIES, type Activity } from "@/lib/tdee";
import type { Equipment, Exercise, Muscle } from "@/lib/types";
import * as activity from "@/locales/text/activity";
import * as bmi from "@/locales/text/bmi";
import * as demo from "@/locales/text/demo";
import * as equipment from "@/locales/text/equipment";
import * as ex from "@/locales/text/ex";
import * as muscle from "@/locales/text/muscle";
import * as tdee from "@/locales/text/tdee";

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

/** The activity levels' names and what each means, for the TDEE and macro calculators. */
export function activityWords(lang: SiteLang): Record<Activity, { label: string; detail: string }> {
  const out = {} as Record<Activity, { label: string; detail: string }>;
  for (const a of ACTIVITIES)
    out[a] = { label: line(activity, lang, `activity.${a}`) ?? a, detail: line(activity, lang, `activity.${a}.detail`) ?? "" };
  return out;
}

/** The lines the TDEE results draw (TdeeResults and BmiBar), so the public calculator says them in the page's language. */
export const TDEE_RESULT_KEYS = [
  "tdee.maintenance",
  "tdee.perDay",
  "tdee.bmr",
  "tdee.formulaKatch",
  "tdee.formulaMifflin",
  "tdee.protein",
  "tdee.proteinNote",
  "tdee.cut",
  "tdee.bulk",
  "tdee.bmi",
  "tdee.byActivity",
  "bmi.under",
  "bmi.healthy",
  "bmi.over",
  "bmi.obese",
  "bmi.where",
  "bmi.note",
] as const;

export function tdeeWords(lang: SiteLang): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of TDEE_RESULT_KEYS) out[key] = line(key.startsWith("bmi.") ? bmi : tdee, lang, key) ?? key;
  return out;
}
