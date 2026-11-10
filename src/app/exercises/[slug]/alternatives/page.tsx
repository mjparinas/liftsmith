import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import { alternativesTo, exerciseBySlug, MUSCLE_NAME, needsText } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Exercise } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => EXERCISES.filter((e) => alternativesTo(e.id).length).map((e) => ({ slug: e.id }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = exerciseBySlug((await params).slug);
  if (!e) return {};
  const n = alternativesTo(e.id).length;
  return {
    title: `${n} ${e.name.toLowerCase()} alternatives for any gym`,
    description: `The best substitutes for the ${e.name.toLowerCase()} that train the same muscles, for a full gym, a home gym or no equipment at all.`,
    alternates: { canonical: `/exercises/${e.id}/alternatives/` },
  };
}

/** Why an alternative fits, in a few words. */
function why(e: Exercise, a: Exercise): string {
  const shared = a.primary.filter((m) => e.primary.includes(m)).map((m) => MUSCLE_NAME[m].toLowerCase());
  const bits = [`Trains the ${shared.join(" and ")}`];
  if (a.pattern === e.pattern) bits.push("same movement");
  if (!a.needs.length) bits.push("no equipment");
  else if (a.needs.some((n) => !e.needs.includes(n)) || a.needs.length < e.needs.length) bits.push(`needs ${needsText(a).toLowerCase()}`);
  return bits.join(", ");
}

export default async function AlternativesPage({ params }: Props) {
  const e = exerciseBySlug((await params).slug);
  if (!e) notFound();
  const alts = alternativesTo(e.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${e.name} alternatives`,
    numberOfItems: alts.length,
    itemListElement: alts.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/exercises/${a.id}/`, name: a.name })),
  };
  return (
    <SitePage kind="alternatives" sticky="Swap exercises in one tap">
      <JsonLd data={jsonLd} />
      <Crumbs
        items={[{ href: "/exercises/", label: "Exercises" }, { href: `/exercises/${e.id}/`, label: e.name }, { label: "Alternatives" }]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{e.name} alternatives</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Machine taken, missing equipment, or something doesn&apos;t feel right? These exercises train the same main muscles as the{" "}
        <Link href={`/exercises/${e.id}/`} className="text-accent underline underline-offset-2">
          {e.name.toLowerCase()}
        </Link>
        , best matches first.
      </p>
      <CtaInline
        cta="alternatives-top"
        title="Swap mid-workout in one tap"
        body={`In ${BRAND.name}, tap Swap and pick from alternatives your gym can actually do. Mark one "not available here" and it stays out of your plans there.`}
        button="Try it free"
      />
      <ol className="mt-6 space-y-3">
        {alts.map((a, i) => (
          <li key={a.id}>
            <Link href={`/exercises/${a.id}/`} className="card press flex items-start gap-4 p-4 hover:border-accent/60">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 font-bold text-accent">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{a.name}</span>
                <span className="mt-0.5 block text-sm text-muted">{why(e, a)}.</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <CtaBanner
        cta="alternatives-end"
        title="A plan that only uses what your gym has"
        body={`Tell ${BRAND.name} your equipment once. Every workout picks exercises you can do there, and swaps rank the closest match first.`}
      />
    </SitePage>
  );
}
