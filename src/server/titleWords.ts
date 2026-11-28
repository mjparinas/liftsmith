import { EXERCISE_BY_ID } from "@/lib/exercises";
import { parseTitle } from "@/lib/titles";
import * as cos from "@/locales/text/cos";
import * as mst from "@/locales/text/mst";

// A profile title's words for the server's pages (the public profile), which don't load the app's catalogues; the app
// uses titleLine (src/lib/titleText.ts) through t().

type Lang = keyof typeof mst & keyof typeof cos;
const LANGS = ["en", "es", "fr", "de", "it", "ja", "pt", "ko", "pl", "tr"] as const satisfies readonly Lang[];

/**
 * A title's words in `lang`. Exercise names are the English ones the public pages use.
 */
export function titleWords(code: unknown, lang: string): string {
  const x = parseTitle(code);
  if (!x) return "";
  const l: Lang = (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
  if (x.lift) {
    const key = `mst.t.${x.id}` as keyof typeof mst.en;
    const line = String((mst[l] as Partial<Record<string, unknown>>)[key] ?? mst.en[key]);
    return line.replace("{lift}", EXERCISE_BY_ID.get(x.lift)?.name ?? x.lift);
  }
  const key = `cos.${x.id}` as keyof typeof cos.en;
  return String((cos[l] as Partial<Record<string, unknown>>)[key] ?? cos.en[key]);
}
