import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, SitePage } from "@/components/site/SiteChrome";
import { ALTERNATIVE_BY_SLUG, ALTERNATIVES, COMPETITOR_BY_SLUG, COMPETITORS, TRADEMARKS } from "@/content/compare";
import { IMPORT_BY_SLUG } from "@/content/imports";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";

export const dynamicParams = false;
export const generateStaticParams = () => ALTERNATIVES.map((a) => ({ slug: a.slug }));

type Props = { params: Promise<{ slug: string }> };

const firstText = (slug: string, topic: "price" | "plans") => COMPETITOR_BY_SLUG.get(slug)?.rows[topic]?.[0]?.text;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = COMPETITOR_BY_SLUG.get((await params).slug);
  if (!c) return {};
  const n = COMPETITORS.length;
  return pageMeta({
    title: `${c.name} alternatives: ${n} workout apps compared`,
    description: `Looking for a ${c.name} alternative? ${n} workout apps compared on price, free plans and workout planning, with every fact sourced and dated.`,
    path: `/alternatives/${c.slug}/`,
  });
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const c = COMPETITOR_BY_SLUG.get(slug);
  const alt = ALTERNATIVE_BY_SLUG.get(slug);
  if (!c || !alt) notFound();
  const others = COMPETITORS.filter((x) => x !== c);
  const imp = IMPORT_BY_SLUG.get(slug);
  return (
    <SitePage kind="alternatives-app" sticky={`Try ${BRAND.name} free`}>
      <Crumbs items={[{ href: "/compare/", label: "Compare" }, { label: `${c.name} alternatives` }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{c.name} alternatives</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {c.name} is {c.summary.charAt(0).toLowerCase() + c.summary.slice(1)} If you {alt.reason}, these are worth a look. We make{" "}
        {BRAND.name}, so it comes first; every fact about the others links to its source on the comparison pages.
      </p>
      <CtaInline
        cta="alternatives-app-top"
        title={`${BRAND.name}: free to start, no account, no ads`}
        body="Your first workout is planned in under a minute, with the plates for every set."
        button="Try it free"
      />
      <ol className="mt-6 space-y-4">
        <li className="card-tint p-5" style={{ ["--tint" as string]: "var(--color-accent)" }}>
          <h2 className="text-xl font-bold">1. {BRAND.name}</h2>
          <p className="mt-2 text-sm text-muted">{alt.pitch} Android, iPhone, the watch apps and the web.</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={`/compare/${c.slug}/`} className="text-accent underline underline-offset-2">
              {BRAND.name} vs {c.name}, side by side
            </Link>
            {imp ? (
              <Link href={`/import/${imp.slug}/`} className="text-accent underline underline-offset-2">
                Bring your {c.name} history
              </Link>
            ) : null}
          </p>
        </li>
        {others.map((o, i) => (
          <li key={o.slug} className="card p-5">
            <h2 className="text-xl font-bold">
              {i + 2}. {o.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {o.summary} {firstText(o.slug, "plans")} {firstText(o.slug, "price")}
            </p>
            <p className="mt-2 text-sm text-muted">A good fit if {o.theirPick}</p>
            <p className="mt-3">
              <Link href={`/compare/${o.slug}/`} className="text-sm text-accent underline underline-offset-2">
                {BRAND.name} vs {o.name}, with sources
              </Link>
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-muted">
        Comparing them all at once? See{" "}
        <Link href="/compare/best-workout-apps/" className="text-accent underline underline-offset-2">
          workout tracker apps compared
        </Link>
        .
      </p>
      <CtaBanner
        cta="alternatives-app-end"
        title="Try the free alternative today"
        body={`${BRAND.name} builds today's workout from what your gym has and what's recovered, in under a minute. No account needed.`}
      />
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
