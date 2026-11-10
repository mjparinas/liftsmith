import type { Metadata } from "next";
import Link from "next/link";

import { OneRmCalculator } from "@/components/site/OneRmCalculator";
import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "One-rep max calculator: estimate your 1RM from any set",
  description:
    "Estimate your one-rep max from weight, reps and reps in reserve, with a reps-to-weight table and the answers from Epley, Brzycki and six other formulas.",
  alternates: { canonical: "/tools/one-rep-max-calculator/" },
};

const FAQ: [string, string][] = [
  [
    "How is the one-rep max estimated?",
    "From the weight and the reps you could have done to failure (your reps plus the reps you had left). Up to 10 reps to failure it averages Brzycki, Epley and a 2026 weight-dependent equation; above 10 it uses Mayhew, Wathan and the same newer equation, which hold up better at higher reps.",
  ],
  [
    "Why count the reps I had left?",
    "The formulas assume you went to failure. A set of 5 with 2 reps left is really a 7-rep effort, so leaving that out makes the estimate low.",
  ],
  [
    "How accurate is it?",
    "Closest from hard sets of 2 to 6 reps, still useful to about 10, and rough past 15. Treat it as a range, and watch the trend over time.",
  ],
  [
    `Does ${BRAND.name} track this for me?`,
    `Yes. Every set you log updates the estimate for that lift, weighting recent and closer-to-failure sets more, and charts it over time.`,
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${BRAND.name} one-rep max calculator`,
    url: `${SITE_URL}/tools/one-rep-max-calculator/`,
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

export default function OneRmPage() {
  return (
    <SitePage kind="tool" sticky="Your max, tracked from every set">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/tools/", label: "Tools" }, { label: "One-rep max calculator" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">One-rep max calculator</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Your estimated max from any set, without testing it. Tap + and − to enter a set; hold a button to go faster.
      </p>
      <div className="mt-8">
        <OneRmCalculator />
      </div>
      <CtaInline
        cta="tool-onerm-mid"
        title="See your max climb, set by set"
        body={`${BRAND.name} updates your estimate from every set you log and shows the trend for every lift.`}
        button="Start tracking free"
      />
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
        <dl className="mt-4 space-y-5">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-muted">
          More:{" "}
          <Link href="/blog/how-to-estimate-your-one-rep-max/" className="text-accent underline underline-offset-2">
            how to estimate your one-rep max
          </Link>{" "}
          and{" "}
          <Link href="/guides/reps-in-reserve/" className="text-accent underline underline-offset-2">
            reps in reserve
          </Link>
          .
        </p>
      </section>
      <CtaBanner
        cta="tool-onerm-end"
        title="Get stronger without guessing"
        body={`${BRAND.name} turns your max into the right weight for every set, and moves it forward when you've earned it.`}
      />
    </SitePage>
  );
}
