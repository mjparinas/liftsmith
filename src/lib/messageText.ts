// The words of reminder notifications and emails, in the lifter's language. messages.ts runs on the
// phone and on the server, and the server must not import i18n.ts (it holds the app's React hook and
// every catalogue), so this reads only the reminder catalogue (src/locales/text/rmd.ts) and formats it
// the same way t() does: {placeholders}, and {one, other} plurals picked by `count`.
import * as rmd from "@/locales/text/rmd";

export const MSG_LANGS = ["en", "es", "fr"] as const;
export type MsgLang = (typeof MSG_LANGS)[number];
export type MsgKey = keyof typeof rmd.en;

const CATALOG: Record<MsgLang, Partial<Record<MsgKey, unknown>>> = { en: rmd.en, es: rmd.es, fr: rmd.fr };

export const isMsgLang = (x: unknown): x is MsgLang => typeof x === "string" && (MSG_LANGS as readonly string[]).includes(x);

/** One line of reminder text in `lang`, falling back to English. */
export function say(lang: MsgLang | undefined, key: MsgKey, vars: Record<string, string | number> = {}): string {
  const l = lang ?? "en";
  const m = (CATALOG[l][key] ?? rmd.en[key]) as string | { one: string; other: string };
  const text = typeof m === "string" ? m : new Intl.PluralRules(l).select(Number(vars.count ?? 0)) === "one" ? m.one : m.other;
  return text.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}

/** A weekday's full name in `lang` (0 = Sunday). */
export function dayName(lang: MsgLang | undefined, wd: number): string {
  // 2023-01-01 was a Sunday.
  return new Intl.DateTimeFormat(lang ?? "en", { weekday: "long", timeZone: "UTC" }).format(Date.UTC(2023, 0, 1 + wd));
}
