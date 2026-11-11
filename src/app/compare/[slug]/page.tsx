import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompareTable } from "@/components/site/CompareTable";
import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { checkedYear, COMPETITOR_BY_SLUG, COMPETITORS, lastChecked, TRADEMARKS } from "@/content/compare";
import { BRAND } from "@/lib/brand";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { absolute } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => COMPETITORS.map((c) => ({ slug: c.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = COMPETITOR_BY_SLUG.get((await params).slug);
  if (!c) return {};
  return pageMeta({
    title: `${BRAND.name} vs ${c.name} (${checkedYear(c)}): price, features and which to pick`,
    description: `${BRAND.name} and ${c.name} side by side: price, free plan, workout planning, plates, rest timer, platforms and health apps, with every ${c.name} fact sourced and dated.`,
    path: `/compare/${c.slug}/`,
  });
}

export default async function ComparePage({ params }: Props) {
  const c = COMPETITOR_BY_SLUG.get((await params).slug);
  if (!c) notFound();
  const others = COMPETITORS.filter((x) => x !== c);
  const checked = lastChecked(c);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${BRAND.name} vs ${c.name}`,
    description: `${BRAND.name} and ${c.name} side by side, with every ${c.name} fact sourced and dated.`,
    url: absolute(`/compare/${c.slug}/`),
    image: absolute(ogImage(`/compare/${c.slug}/`)),
    datePublished: "2026-11-09",
    dateModified: checked,
    author: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    publisher: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
  };
  return (
    <SitePage kind="compare" sticky={`Try ${BRAND.name} free`}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/compare/", label: "Compare" }, { label: `${BRAND.name} vs ${c.name}` }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
        {BRAND.name} vs {c.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {c.name} is {c.summary.charAt(0).toLowerCase() + c.summary.slice(1)} Here&apos;s how the two compare, with a link to where we read
        each {c.name} fact.
      </p>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card-tint p-5" style={{ ["--tint" as string]: "var(--color-accent)" }}>
          <h2 className="text-lg font-bold">Where {BRAND.name} differs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {c.ourPick.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-bold">When {c.name} may suit you better</h2>
          <p className="mt-3 text-sm text-muted">If {c.theirPick}</p>
        </div>
      </section>
      <CtaInline
        cta="compare-top"
        title={`Switching from ${c.name}?`}
        body={`Start ${BRAND.name} free with no account. Your plan is ready in under a minute${c.slug === "hevy" || c.slug === "strong" ? `, and you can import your ${c.name} CSV export to keep your history` : ""}.`}
        button="Try it free"
      />
      <h2 className="mt-10 text-2xl font-bold tracking-tight">Side by side</h2>
      <CompareTable c={c} />
      <p className="mt-3 text-xs text-muted">
        Prices are US prices from the store listings on the date shown and can differ by country. Topics {c.name}&apos;s own pages
        don&apos;t cover are left out.
      </p>
      <CtaBanner
        cta="compare-end"
        title="See the difference on your next workout"
        body={`${BRAND.name} plans your sets, reps and weights, draws the plates and starts the rest timer for you. Free to start, no ads, ever.`}
      />
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">More comparisons</h2>
        <LinkGrid items={others.map((o) => ({ href: `/compare/${o.slug}/`, title: `${BRAND.name} vs ${o.name}`, body: o.summary }))} />
      </section>
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
