import type { Metadata } from "next";
import Link from "next/link";

import { Crumbs, CtaBanner, CtaInline, SitePage } from "@/components/site/SiteChrome";
import { COMPETITOR_BY_SLUG, COMPETITORS, TRADEMARKS } from "@/content/compare";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Fitbod alternatives: four workout apps compared",
  description: `Looking for a Fitbod alternative? ${BRAND.name}, Hevy, Strong and Gymverse compared on price, free plans and workout planning, with sourced, dated facts.`,
  alternates: { canonical: "/alternatives/fitbod/" },
};

const firstText = (slug: string, topic: "price" | "plans") => COMPETITOR_BY_SLUG.get(slug)?.rows[topic]?.[0]?.text;

export default function FitbodAlternatives() {
  const fitbod = COMPETITOR_BY_SLUG.get("fitbod")!;
  const others = COMPETITORS.filter((c) => c.slug !== "fitbod");
  return (
    <SitePage kind="alternatives-app" sticky={`Try ${BRAND.name} free`}>
      <Crumbs items={[{ href: "/compare/", label: "Compare" }, { label: "Fitbod alternatives" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Fitbod alternatives</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Fitbod is {fitbod.summary.charAt(0).toLowerCase() + fitbod.summary.slice(1)} If you want a free plan, a lower price, or a different
        approach, these are worth a look. Every fact links to its source on the comparison pages.
      </p>
      <CtaInline
        cta="alternatives-app-top"
        title={`${BRAND.name}: adaptive workouts with a free plan`}
        body="Plans from your equipment and recovery, plates drawn for every set, blocks with planned deloads. Free to start, no account, no ads."
        button="Try it free"
      />
      <ol className="mt-6 space-y-4">
        <li className="card-tint p-5" style={{ ["--tint" as string]: "var(--color-accent)" }}>
          <h2 className="text-xl font-bold">1. {BRAND.name}</h2>
          <p className="mt-2 text-sm text-muted">
            Adaptive planning like Fitbod&apos;s, with training blocks that step reps in reserve down each week and end in a deload, plates
            drawn for every barbell set, a lock-screen rest timer and a 3D recovery map. The logger and every fixed program are free; Pro is
            $6.99 a month or $39.99 a year. Android, iPhone and the web.
          </p>
          <p className="mt-3">
            <Link href="/compare/fitbod/" className="text-sm text-accent underline underline-offset-2">
              {BRAND.name} vs Fitbod, side by side
            </Link>
          </p>
        </li>
        {others.map((c, i) => (
          <li key={c.slug} className="card p-5">
            <h2 className="text-xl font-bold">
              {i + 2}. {c.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {c.summary} {firstText(c.slug, "plans")} {firstText(c.slug, "price")}
            </p>
            <p className="mt-2 text-sm text-muted">A good fit if {c.theirPick}</p>
            <p className="mt-3">
              <Link href={`/compare/${c.slug}/`} className="text-sm text-accent underline underline-offset-2">
                {BRAND.name} vs {c.name}, with sources
              </Link>
            </p>
          </li>
        ))}
      </ol>
      <CtaBanner
        cta="alternatives-app-end"
        title="Try the free alternative today"
        body={`${BRAND.name} builds today's workout from what your gym has and what's recovered, in under a minute. No account needed.`}
      />
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
