import type { Metadata } from "next";
import Link from "next/link";

import { Crumbs, CtaBanner, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { TdeeCalculator } from "@/components/site/TdeeCalculator";
import { BRAND } from "@/lib/brand";
import { APP_PATH, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "TDEE calculator: calories a day to maintain, cut or bulk",
  description:
    "Work out your total daily energy expenditure from age, sex, height, weight and activity, with BMR, BMI, cutting and lean bulk targets and a protein range for lifters.",
  alternates: { canonical: "/tools/tdee-calculator/" },
};

const FAQ: [string, string][] = [
  [
    "What is TDEE?",
    "Total daily energy expenditure: the calories you burn in a day, counting your resting metabolism (BMR), digestion, daily movement and exercise. Eat about this much and your weight holds steady.",
  ],
  [
    "Which formula does this use?",
    "Mifflin-St Jeor for resting burn, the most accurate of the common equations for most people. Add a body fat reading and it switches to Katch-McArdle, which works from lean mass and suits muscular lifters better. BMR is then multiplied by an activity factor from 1.2 (sedentary) to 1.9 (athlete).",
  ],
  [
    "How many calories to lose or gain weight?",
    "About 500 below TDEE loses roughly 0.5 kg (1 lb) a week. For a lean bulk, about 250 above keeps fat gain small while you build muscle. Weigh yourself a few times a week and adjust if the trend doesn't match.",
  ],
  [
    "How accurate is it?",
    "Any formula is an estimate, often within 10% for most people. Your scale tells the truth: if your weight trend over two to three weeks doesn't match, move your intake up or down by 100 to 200 calories.",
  ],
  [
    `Does ${BRAND.name} keep my TDEE up to date?`,
    `Yes. In the ${BRAND.name} app your TDEE recalculates itself when your weight, age or training changes, reads weight, height and body fat from Health Connect or Apple Health when you allow it, sets your activity level from how many days a week you actually train, and charts it over time.`,
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${BRAND.name} TDEE calculator`,
    url: `${SITE_URL}/tools/tdee-calculator/`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  },
];

export default function TdeePage() {
  return (
    <SitePage kind="tool" sticky="Calories that follow your weigh-ins">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/tools/", label: "Tools" }, { label: "TDEE calculator" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">TDEE calculator</h1>
      <p className="mt-2 max-w-2xl text-muted">
        How many calories a day you burn, and what to eat to hold, lose or gain weight. Tap + and − to set your numbers; hold a button to go
        faster.
      </p>
      <div className="mt-8">
        <TdeeCalculator />
      </div>
      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">Keep it current without thinking about it</h2>
        <p className="mt-2 text-muted">
          Your TDEE moves as your weight and training change. {BRAND.name} recalculates it on its own from your weigh-ins and how often you
          actually train, and charts it over time.
        </p>
        <Link
          href={APP_PATH}
          data-cta="tdee-page"
          className="press mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
        >
          Open {BRAND.name}
        </Link>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold">Questions</h2>
        <dl className="mt-4 space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaBanner
        cta="tool-tdee-end"
        title="Your TDEE, kept up to date"
        body={`${BRAND.name} recalculates it from your weigh-ins and the days you actually train, and plans your workouts too.`}
      />
    </SitePage>
  );
}
