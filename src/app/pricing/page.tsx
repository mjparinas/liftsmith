import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { CtaBanner, CtaButton, JsonLd } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { faqJsonLd, HELP } from "@/lib/faqs";
import { FLAGS } from "@/lib/flags";
import { FREE_FEATURES, PLAN_TABLE, PRO_FEATURES } from "@/lib/plans";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { PRICES } from "@/lib/trial";

const name = BRAND.name;
const TRIAL_DAYS = FLAGS.trialDays.default;
const BILLING = HELP.find((g) => g.id === "billing")!.faqs;

export const metadata: Metadata = {
  title: "Pricing",
  description: `${name} is free to start, with no ads ever. Pro is ${PRICES.monthly.price} a month or ${PRICES.annual.price} a year, with a ${TRIAL_DAYS}-day free trial and family sharing on the annual plan.`,
  alternates: { canonical: "/pricing/" },
};

function Mark({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm font-semibold">{value}</span>;
  return value ? (
    <span className="font-bold text-good">
      ✓<span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="text-faint">
      –<span className="sr-only">Not included</span>
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

export default function Pricing() {
  const offers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${name} Pro`,
    url: `${SITE_URL}/pricing/`,
    offers: [
      { "@type": "Offer", price: PRICES.monthly.price.replace("$", ""), priceCurrency: "USD", name: "Pro monthly" },
      { "@type": "Offer", price: PRICES.annual.price.replace("$", ""), priceCurrency: "USD", name: "Pro yearly" },
    ],
  };
  return (
    <InfoPage
      kind="pricing"
      wide
      title="Pricing"
      intro={`Start free, with no account and no card. Go Pro when you want ${name} to plan every workout for you. No ads on any plan, ever.`}
    >
      <JsonLd data={[offers, faqJsonLd(BILLING)]} />
      <div className="grid gap-5 md:grid-cols-2">
        <section aria-labelledby="free-h" className="card flex flex-col p-7">
          <h2 id="free-h" className="text-xl font-semibold">
            Free
          </h2>
          <p className="mt-3">
            <span className="display text-5xl">$0</span> <span className="text-muted">forever</span>
          </p>
          <List items={FREE_FEATURES} />
          <Link
            href={APP_PATH}
            prefetch={false}
            data-cta="pricing-page-free"
            className="press mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-raised text-lg font-semibold"
          >
            Start free
          </Link>
        </section>
        <section aria-labelledby="pro-h" className="card-tint flex flex-col p-7" style={{ ["--tint" as string]: "var(--color-violet)" }}>
          <h2 id="pro-h" className="text-xl font-semibold">
            Pro{" "}
            <span className="ml-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink uppercase">
              {TRIAL_DAYS} days free
            </span>
          </h2>
          <p className="mt-3">
            <span className="display text-5xl">{PRICES.annual.price}</span> <span className="text-muted">{PRICES.annual.per}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            {PRICES.annual.note}, or {PRICES.monthly.price} {PRICES.monthly.per}
          </p>
          <List items={PRO_FEATURES} />
          <div className="mt-8">
            <CtaButton cta="pricing-page-pro" big>
              Start my {TRIAL_DAYS}-day free trial
            </CtaButton>
          </div>
          <p className="mt-3 text-xs text-muted">
            Billed through Google Play or the App Store, or by card on the web app. Cancel any time before the trial ends and you pay
            nothing.
          </p>
        </section>
      </div>

      <Section title="Free and Pro, side by side" id="compare">
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[20rem] border-collapse text-left">
            <caption className="sr-only">What the free plan and Pro include</caption>
            <thead>
              <tr className="bg-raised">
                <th scope="col" className="p-3 font-semibold">
                  Feature
                </th>
                <th scope="col" className="w-20 p-3 text-center font-semibold">
                  Free
                </th>
                <th scope="col" className="w-24 p-3 text-center font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            {PLAN_TABLE.map((g) => (
              <tbody key={g.group}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={3}
                    className="border-t border-line bg-surface p-3 text-sm font-bold tracking-wide text-muted uppercase"
                  >
                    {g.group}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.feature} className="border-t border-line">
                    <th scope="row" className="p-3 font-normal">
                      {r.feature}
                    </th>
                    <td className="p-3 text-center">
                      <Mark value={r.free} />
                    </td>
                    <td className="p-3 text-center">
                      <Mark value={r.pro} />
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
          Billing questions
        </h2>
        <div className="mt-4 space-y-3">
          {BILLING.map((f) => (
            <div key={f.q} className="card p-5">
              <h3 className="text-lg font-semibold">{f.q}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          The full rules are in the{" "}
          <Link href="/terms/#billing" className="text-accent underline">
            terms of use
          </Link>
          .
        </p>
      </section>

      <CtaBanner
        cta="pricing-end"
        title="Your first workout is free"
        body={`Start on the free plan, try Pro free for ${TRIAL_DAYS} days when you're ready, and cancel in two taps.`}
      />
    </InfoPage>
  );
}
