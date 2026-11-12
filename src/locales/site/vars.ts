// The numbers the website's translated text fills in (see types.ts for the placeholders).
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import type { Faq } from "@/lib/faqs";
import { FLAGS } from "@/lib/flags";
import { amountOf, fill, usd, type SiteLang } from "@/lib/siteLang";
import { PRICES } from "@/lib/trial";

export function siteVars(lang: SiteLang) {
  const annual = amountOf(PRICES.annual.price);
  return {
    name: BRAND.name,
    days: FLAGS.trialDays.default,
    n: EXERCISES.length.toLocaleString(lang === "en" ? "en-US" : lang),
    annual: usd(lang, annual),
    monthly: usd(lang, amountOf(PRICES.monthly.price)),
    perMonth: usd(lang, Math.floor((annual / 12) * 100) / 100),
  };
}

export const filledFaqs = (faqs: Faq[], vars: Record<string, string | number>): Faq[] =>
  faqs.map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) }));
