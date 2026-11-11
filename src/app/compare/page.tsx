import type { Metadata } from "next";

import { Crumbs, CtaBanner, CtaInline, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { ALTERNATIVES, COMPETITOR_BY_SLUG, COMPETITORS, TRADEMARKS } from "@/content/compare";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const metadata: Metadata = pageMeta({
  title: `${BRAND.name} compared with other workout apps`,
  description: `How ${BRAND.name} compares with Fitbod, Hevy, Strong and ${COMPETITORS.length - 3} more workout apps on price, free plans, planning, plates and platforms, every fact sourced and dated.`,
  path: "/compare/",
});

export default function CompareIndex() {
  return (
    <SitePage kind="compare-index">
      <Crumbs items={[{ label: "Compare" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{BRAND.name} compared</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Side by side with the workout apps people ask about most. Every fact about another app links to where we read it and when, and we
        re-check them at least every 90 days.
      </p>
      <CtaInline
        cta="compare-index-top"
        title="Quickest way to compare: try it"
        body={`${BRAND.name} is free to start, with no account. Your first workout is ready in under a minute.`}
        button="Try it free"
      />
      <LinkGrid
        items={[
          ...COMPETITORS.map((c) => ({ href: `/compare/${c.slug}/`, title: `${BRAND.name} vs ${c.name}`, body: c.summary })),
          {
            href: "/compare/best-workout-apps/",
            title: "Workout tracker apps compared",
            body: `${COMPETITORS.length + 1} apps grouped by what they're for, with a good fit for each.`,
          },
          ...ALTERNATIVES.map((a) => ({
            href: `/alternatives/${a.slug}/`,
            title: `${COMPETITOR_BY_SLUG.get(a.slug)!.name} alternatives`,
            body: `For lifters who ${a.reason}.`,
          })),
        ]}
      />
      <CtaBanner
        cta="compare-index-end"
        title="Try it and decide for yourself"
        body={`${BRAND.name} is free to start with no account. Bring your history: import a CSV export from your current app.`}
      />
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
