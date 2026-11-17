import type { Metadata } from "next";
import Link from "next/link";

import { EmbedCode } from "@/components/site/EmbedCode";
import { PlateCalculator } from "@/components/site/PlateCalculator";
import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { embedFor } from "@/lib/embeds";
import { pageMeta } from "@/lib/pageMeta";
import { KG_BAR, LB_BAR, plateChart, plateQuestions } from "@/lib/plateChart";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Plate calculator: plates per side for any weight (lb and kg)",
  description:
    "Free plate calculator: enter a weight and see which plates go on each side of the bar, in lb or kg. Chart: 3 plates is 315 lb, 2 plates and a 25 is 275 lb.",
  path: "/tools/plate-calculator/",
  translated: true,
});

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
  ...plateQuestions(),
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
    <SitePage kind="tool" sticky="Plates drawn for every set" path="/tools/plate-calculator/">
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
        title="Stop doing plate math between sets"
        body={`${BRAND.name} draws the plates for every set and shows what to change for the next one while you rest.`}
        button="Try it free"
      />
      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">Plates per side chart</h2>
        <p className="mt-2 text-muted">
          What the bar weighs with 1 to 8 plates on each side. Pounds use a {LB_BAR} lb bar and 45 lb plates; kilograms a {KG_BAR} kg bar.
        </p>
        <div className="mt-4 overflow-x-auto" role="region" aria-label="Plates per side chart" tabIndex={0}>
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Plates a side
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  45s
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  45s and a 25
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  45s and a 10
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  20 kg plates
                </th>
                <th scope="col" className="py-2 font-semibold">
                  25 kg plates
                </th>
              </tr>
            </thead>
            <tbody>
              {plateChart().map((r) => (
                <tr key={r.n} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {r.n}
                  </th>
                  <td className="py-2 pr-3">{r.lb} lb</td>
                  <td className="py-2 pr-3">{r.lbPlus25} lb</td>
                  <td className="py-2 pr-3">{r.lbPlus10} lb</td>
                  <td className="py-2 pr-3">{r.kg20} kg</td>
                  <td className="py-2">{r.kg25} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
      <EmbedCode embed={embedFor("plate-calculator")!} />
      <CtaBanner
        cta="tool-plates-end"
        title="Every set loaded for you"
        body={`Tell ${BRAND.name} which plates your gym has once. Every weight it plans is one you can actually load, with the plates for each side shown.`}
      />
    </SitePage>
  );
}
