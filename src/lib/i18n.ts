import { en, type MessageKey } from "@/locales/en";
import { es } from "@/locales/es";
import { fr } from "@/locales/fr";
import { isNative } from "./juice";

// Languages (Melvin, 2026-11-09: "i18n and l10n, use as much native as possible").
//
// - The language follows the phone: on Android and iOS it's read with @capacitor/device (Android's
//   per-app language from system settings, iOS's per-app language in Settings › Liftsmith), and in a
//   browser from navigator.languages. Settings › Language can override it.
// - All formatting goes through the platform's own Intl APIs (numbers, dates, times, lists, plurals,
//   relative times, units), with the phone's full tag ("en-GB", "es-MX") so regional formats are
//   right even where the text is the base language.
// - Text lives in one catalogue per language (src/locales). English is the source; a missing key
//   falls back to English, and a test checks every catalogue has the same keys and placeholders.

export const LANGS = ["en", "es", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export type LangPref = "system" | Lang;
/** Each language's name in itself, for the picker. */
export const LANG_NAME: Record<Lang, string> = { en: "English", es: "Español", fr: "Français" };

type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type Message = string | Plural;
const CATALOG: Record<Lang, Partial<Record<MessageKey, Message>>> = { en, es, fr };

let phoneTags: readonly string[] = typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : ["en"];
let pref: LangPref = "system";
let lang: Lang = "en";
let tag = "en";
const listeners = new Set<() => void>();

/** The first supported language in a list of BCP 47 tags, and the tag to format with. */
export function resolve(tags: readonly string[], choice: LangPref = "system"): { lang: Lang; tag: string } {
  if (choice !== "system") {
    // Keep the phone's region when it speaks the chosen language (es-MX stays es-MX).
    const same = tags.find((t) => t.toLowerCase().split("-")[0] === choice);
    return { lang: choice, tag: same ?? choice };
  }
  for (const t of tags) {
    const base = t.toLowerCase().split("-")[0] as Lang;
    if (LANGS.includes(base)) return { lang: base, tag: t };
  }
  return { lang: "en", tag: tags.find((t) => t.toLowerCase().startsWith("en")) ?? "en" };
}

function update(): void {
  const r = resolve(phoneTags, pref);
  if (r.lang === lang && r.tag === tag) return;
  lang = r.lang;
  tag = r.tag;
  if (typeof document !== "undefined") document.documentElement.lang = tag;
  for (const l of listeners) l();
}

/** Sets the language choice (Settings › Language), or follows the phone with "system". */
export function setLanguage(choice: LangPref | undefined): void {
  pref = choice && (choice === "system" || LANGS.includes(choice)) ? choice : "system";
  update();
}

/** Reads the phone's languages: the native per-app language on Android and iOS, else the browser's. */
export async function readPhoneLanguage(): Promise<void> {
  if (isNative()) {
    try {
      const { Device } = await import("@capacitor/device");
      const { value } = await Device.getLanguageTag();
      if (value) phoneTags = [value, ...phoneTags.filter((t) => t !== value)];
    } catch {}
  } else if (typeof navigator !== "undefined") {
    phoneTags = navigator.languages?.length ? navigator.languages : [navigator.language];
  }
  update();
}

export const currentLang = () => lang;
export const currentTag = () => tag;

/** Calls `on` when the language changes; returns the unsubscribe. `useLang` (useLang.ts) builds on it. */
export function subscribeLang(on: () => void): () => void {
  listeners.add(on);
  return () => {
    listeners.delete(on);
  };
}

const rules = new Map<string, Intl.PluralRules>();
function plural(m: Plural, n: number): string {
  const key = `${lang}`;
  if (!rules.has(key)) rules.set(key, new Intl.PluralRules(tag));
  const cat = rules.get(key)!.select(n);
  return m[cat] ?? m.other;
}

/**
 * The text for `key` in the current language, with {name} placeholders filled. A plural message
 * picks its form from `vars.count` with the platform's plural rules; numbers in `vars` are
 * formatted for the language (1 234,5 in French).
 */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const m = CATALOG[lang][key] ?? en[key];
  const text = typeof m === "string" ? m : plural(m, Number(vars?.count ?? 0));
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v === undefined ? `{${k}}` : typeof v === "number" ? num(v) : v;
  });
}

const nf = new Map<string, Intl.NumberFormat>();
/** A number for display in the current language: whole numbers stay whole, up to two decimals. */
export function num(n: number, opts: Intl.NumberFormatOptions = { maximumFractionDigits: 2 }): string {
  const k = `${tag}|${JSON.stringify(opts)}`;
  if (!nf.has(k)) nf.set(k, new Intl.NumberFormat(tag, opts));
  return nf.get(k)!.format(n);
}

/** A date or time in the current language and region. */
export function date(ms: number | Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(tag, opts).format(ms);
}

/** "in 3 days", "2 hours ago", "yesterday", in the current language. */
export function relative(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return new Intl.RelativeTimeFormat(tag, { numeric: "auto" }).format(value, unit);
}

/** "squat, bench and deadlift" with the language's own conjunction. */
export function list(items: string[], type: "conjunction" | "disjunction" = "conjunction"): string {
  return new Intl.ListFormat(tag, { style: "long", type }).format(items);
}

/** Parses a number typed in any language: a comma decimal (82,5) counts like a point. */
export function parseNum(s: string): number {
  return Number(s.trim().replace(/\s/g, "").replace(",", "."));
}

/**
 * A lookup table whose values are translated on each read, for labels kept in engine tables
 * (muscle names, recovery bands): `MUSCLE_LABEL.chest` reads `muscle.chest` in the current language.
 */
export function translated<K extends string>(keys: readonly K[], key: (k: K) => MessageKey): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const k of keys) Object.defineProperty(out, k, { get: () => t(key(k)), enumerable: true });
  return out;
}

/** A weekday's name in the current language, Sunday = 0 (Intl, so "lun." in French, "lun" in Spanish). */
export function weekday(day: number, style: "short" | "long" = "short"): string {
  return date(new Date(2024, 0, 7 + day, 12), { weekday: style });
}

/** A clock time ("6:00 PM", "18:00") in the current language and region. */
export function clockTime(hh: number, mm: number): string {
  return date(new Date(2000, 0, 1, hh, mm), { hour: "numeric", minute: "2-digit" });
}
