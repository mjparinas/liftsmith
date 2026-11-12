// The website's languages (Melvin, 2026-11-11: translate the landing and pricing pages). English pages live at their
// usual paths; the other languages under /<lang>/ (/es/, /fr/pricing/). Only the pages in LOCALIZED_PATHS are translated
// for now: the exercise library and articles wait for the English SEO work, and terms and privacy stay English-first.
// Every translated page lists all its languages in hreflang tags (`languageAlternates`), and the sitemap does too.
// Kept apart from src/lib/i18n.ts so site pages never load the app's catalogues.

export const SITE_LANGS = ["en", "es", "fr", "de", "it", "ja"] as const;
export type SiteLang = (typeof SITE_LANGS)[number];

/** The translated paths, English form (with the trailing slash). */
export const LOCALIZED_PATHS = ["/", "/pricing/", "/coaches/"] as const;

/** Each language's name in itself, for the language switcher. */
export const SITE_LANG_NAME: Record<SiteLang, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ja: "日本語",
};

/** Open Graph locale for each language. */
export const OG_LOCALE: Record<SiteLang, string> = {
  en: "en_CA",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  it: "it_IT",
  ja: "ja_JP",
};

export const isSiteLang = (s: string): s is SiteLang => (SITE_LANGS as readonly string[]).includes(s);

/** A path in a language: "/pricing/" → "/es/pricing/". English keeps the plain path. */
export const localPath = (lang: SiteLang, path: string) => (lang === "en" ? path : `/${lang}${path}`);

/** Every language's version of a translated path, plus x-default (English), for hreflang tags and the sitemap. */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of SITE_LANGS) out[l] = localPath(l, path);
  out["x-default"] = path;
  return out;
}

/** A US dollar price written the way each language writes money ("$39.99", "39,99 $US", "39,99 $"). */
export function usd(lang: SiteLang, amount: number): string {
  const whole = Number.isInteger(amount);
  if (lang === "en") return whole ? `$${amount}` : `$${amount.toFixed(2)}`;
  const digits = whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
  return new Intl.NumberFormat(lang, { style: "currency", currency: "USD", ...digits }).format(amount);
}

/** "$39.99" → 39.99. */
export const amountOf = (price: string) => Number(price.replace(/[^0-9.]/g, ""));

/** Fills {placeholders} in a line of site text. */
export function fill(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
