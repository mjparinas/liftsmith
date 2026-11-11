import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { CtaBanner, CtaButton, JsonLd } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { faqJsonLd } from "@/lib/faqs";
import { pageMeta } from "@/lib/pageMeta";
import { PLAN_TABLE } from "@/lib/plans";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { fill, localPath, usd, type SiteLang } from "@/lib/siteLang";
import { PRICES } from "@/lib/trial";
import { siteText } from "@/locales/site";
import { filledFaqs, siteVars } from "@/locales/site/vars";

// The pricing page, in every site language (src/lib/siteLang.ts): /pricing/ in English, /es/pricing/ and friends.

const name = BRAND.name;

export function pricingMetadata(lang: SiteLang): Metadata {
  const p = siteText(lang).pricing;
  const vars = siteVars(lang);
  return pageMeta({ title: fill(p.title, vars), description: fill(p.description, vars), path: "/pricing/", lang });
}

function Mark({ value, words }: { value: boolean | string; words: { yes: string; no: string; text: (s: string) => string } }) {
  if (typeof value === "string") return <span className="text-sm font-semibold">{words.text(value)}</span>;
  return value ? (
    <span className="font-bold text-good">
      ✓<span className="sr-only">{words.yes}</span>
    </span>
  ) : (
    <span className="text-faint">
      –<span className="sr-only">{words.no}</span>
    </span>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex-1 space-y-2.5">
      {items.map((x) => (
        <li key={x} className="flex gap-2.5">
          <span aria-hidden className="font-bold text-good">
            ✓
          </span>
          {x}
        </li>
      ))}
    </ul>
  );
}

export function PricingView({ lang }: { lang: SiteLang }) {
  const t = siteText(lang);
  const p = t.pricing;
  const card = t.home.pricing;
  const plans = t.plans;
  const vars = siteVars(lang);
  const billing = filledFaqs(t.billing, vars);
  const words = {
    yes: p.included,
    no: p.notIncluded,
    text: (s: string) => (s === "Never" ? plans.never : s === "Annual plan" ? plans.annualPlan : s),
  };
  const offers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${name} Pro`,
    url: `${SITE_URL}${localPath(lang, "/pricing/")}`,
    offers: [
      { "@type": "Offer", price: PRICES.monthly.price.replace("$", ""), priceCurrency: "USD", name: "Pro monthly" },
      { "@type": "Offer", price: PRICES.annual.price.replace("$", ""), priceCurrency: "USD", name: "Pro yearly" },
    ],
  };
  return (
    <InfoPage kind="pricing" wide title={p.h1} intro={fill(p.intro, vars)} lang={lang} path="/pricing/">
      <JsonLd data={[offers, faqJsonLd(billing)]} />
      <div className="grid gap-5 md:grid-cols-2">
        <section aria-labelledby="free-h" className="card flex flex-col p-7">
          <h2 id="free-h" className="text-xl font-semibold">
            {card.free}
          </h2>
          <p className="mt-3">
            <span className="display text-4xl min-[360px]:text-5xl">{usd(lang, 0)}</span> <span className="text-muted">{card.forever}</span>
          </p>
          <List items={plans.free} />
          <Link
            href={APP_PATH}
            prefetch={false}
            data-cta="pricing-page-free"
            className="press mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-raised text-lg font-semibold"
          >
            {card.startFree}
          </Link>
        </section>
        <section aria-labelledby="pro-h" className="card-tint flex flex-col p-7" style={{ ["--tint" as string]: "var(--color-violet)" }}>
          <h2 id="pro-h" className="text-xl font-semibold">
            Pro{" "}
            <span className="ml-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink uppercase">
              {fill(card.daysFree, vars)}
            </span>
          </h2>
          <p className="mt-3">
            <span className="display text-4xl min-[360px]:text-5xl">{vars.annual}</span> <span className="text-muted">{card.perYear}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{fill(card.priceNote, vars)}</p>
          <List items={plans.pro} />
          <div className="mt-8">
            <CtaButton cta="pricing-page-pro" big>
              {fill(card.trialCta, vars)}
            </CtaButton>
          </div>
          <p className="mt-3 text-xs text-muted">{card.billed}</p>
        </section>
      </div>

      <Section title={p.compare} id="compare">
        <div className="relative overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[20rem] border-collapse text-left">
            <caption className="sr-only">{p.caption}</caption>
            <thead>
              <tr className="bg-raised">
                <th scope="col" className="p-3 font-semibold">
                  {p.feature}
                </th>
                <th scope="col" className="w-20 p-3 text-center font-semibold">
                  {card.free}
                </th>
                <th scope="col" className="w-24 p-3 text-center font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            {PLAN_TABLE.map((g, gi) => (
              <tbody key={g.group}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={3}
                    className="border-t border-line bg-surface p-3 text-sm font-bold tracking-wide text-muted uppercase"
                  >
                    {plans.groups[gi] ?? g.group}
                  </th>
                </tr>
                {g.rows.map((r, ri) => (
                  <tr key={r.feature} className="border-t border-line">
                    <th scope="row" className="p-3 font-normal">
                      {plans.rows[gi]?.[ri] ?? r.feature}
                    </th>
                    <td className="p-3 text-center">
                      <Mark value={r.free} words={words} />
                    </td>
                    <td className="p-3 text-center">
                      <Mark value={r.pro} words={words} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Section>

      <section id="billing" aria-labelledby="billing-h" className="scroll-mt-20">
        <h2 id="billing-h" className="text-2xl font-bold tracking-tight">
          {p.billing}
        </h2>
        <div className="mt-4 space-y-3">
          {billing.map((f) => (
            <div key={f.q} className="card p-5">
              <h3 className="text-lg font-semibold">{f.q}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          {p.termsBefore}
          <Link href="/terms/#billing" className="text-accent underline" hrefLang={lang === "en" ? undefined : "en"}>
            {p.termsLink}
          </Link>
          {p.termsAfter}
        </p>
      </section>

      <CtaBanner cta="pricing-end" title={p.endTitle} body={fill(p.endBody, vars)} lang={lang} />
    </InfoPage>
  );
}
