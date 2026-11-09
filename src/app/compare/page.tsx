import type { Metadata } from "next";
import { COMPETITORS, TRADEMARKS } from "@/content/compare";
import { CtaBanner, CtaInline, Crumbs, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} compared with other workout apps`,
  description: `How ${BRAND.name} compares with Fitbod, Hevy, Strong and Gymverse on price, free plans, workout planning, plates, recovery and platforms, with every fact sourced and dated.`,
  alternates: { canonical: "/compare/" },
};

export default function CompareIndex() {
  return (
    <SitePage kind="compare-index">
      <Crumbs items={[{ label: "Compare" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{BRAND.name} compared</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Side by side with the workout apps people ask about most. Every fact about another app links to where we read it and when, and we re-check them at least every 90 days.</p>
      <CtaInline cta="compare-index-top" title="Quickest way to compare: try it" body={`${BRAND.name} is free to start, with no account. Your first workout is ready in under a minute.`} button="Try it free" />
      <LinkGrid items={[...COMPETITORS.map((c) => ({ href: `/compare/${c.slug}/`, title: `${BRAND.name} vs ${c.name}`, body: c.summary })), { href: "/alternatives/fitbod/", title: "Fitbod alternatives", body: "Four apps compared for lifters looking for something different." }]} />
      <CtaBanner cta="compare-index-end" title="Try it and decide for yourself" body={`${BRAND.name} is free to start with no account. Bring your history: import a CSV export from your current app.`} />
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
