import type { Metadata } from "next";
import Link from "next/link";

import { PlateCalculator } from "@/components/site/PlateCalculator";
import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Plate calculator: which plates go on each side of the bar",
  description:
    "Enter a weight and see exactly which plates to load on each side of a barbell, in kg or lb, with the plates you have. Finds the nearest weight when it can't be made.",
  alternates: { canonical: "/tools/plate-calculator/" },
};

const FAQ: [string, string][] = [
  [
    "How do I work out plates per side?",
    "Take the weight you want, subtract the bar (20 kg or 45 lb for a standard Olympic bar), and divide by two. That's what goes on each side. Load the heaviest plates first.",
  ],
  [
    "What if my plates can't make the weight?",
    "The calculator finds the nearest weights you can make, above and below. Go with the lighter one: it's the safer miss.",
  ],
  [
    "How much does the bar weigh?",
    "A standard Olympic bar is 20 kg or 45 lb. Women's bars are 15 kg or 35 lb. EZ bars, trap bars and smith machines vary, so check yours.",
  ],
  [
    `Does ${BRAND.name} do this for me?`,
    `Yes. ${BRAND.name} only suggests weights your gym's plates can make, draws the plates for every set, and shows what to change between sets while you rest.`,
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${BRAND.name} plate calculator`,
    url: `${SITE_URL}/tools/plate-calculator/`,
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

export default function PlatePage() {
  return (
    <SitePage kind="tool" sticky="Plates drawn for every set">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/tools/", label: "Tools" }, { label: "Plate calculator" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Plate calculator</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Which plates go on each side of the bar for any weight. Tap + and − to set it; switch off plates you don&apos;t have.
      </p>
      <div className="mt-8">
        <PlateCalculator />
      </div>
      <CtaInline
        cta="tool-plates-mid"
        title="Stop doing plate maths between sets"
        body={`${BRAND.name} draws the plates for every set and shows what to change for the next one while you rest.`}
        button="Try it free"
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
          <Link href="/blog/how-to-load-a-barbell/" className="text-accent underline underline-offset-2">
            how to load a barbell
          </Link>
          .
        </p>
      </section>
      <CtaBanner
        cta="tool-plates-end"
        title="Every set loaded for you"
        body={`Tell ${BRAND.name} which plates your gym has once. Every weight it plans is one you can actually load, with the plates for each side shown.`}
      />
    </SitePage>
  );
}
