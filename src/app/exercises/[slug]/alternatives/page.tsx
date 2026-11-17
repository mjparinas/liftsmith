import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { alternativesMeta } from "@/lib/exerciseMeta";
import { EXERCISES } from "@/lib/exercises";
import { pageMeta } from "@/lib/pageMeta";
import { alternativesTo, exerciseBySlug, indexAlternatives, MUSCLE_NAME, needsText } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Exercise } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => EXERCISES.filter((e) => alternativesTo(e.id).length).map((e) => ({ slug: e.id }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = exerciseBySlug((await params).slug);
  if (!e) return {};
  return pageMeta({
    ...alternativesMeta(e),
    path: `/exercises/${e.id}/alternatives/`,
    noindex: !indexAlternatives(e.id),
  });
}

const KIND_WORDS: Partial<Record<Exercise["load"], string>> = {
  dumbbell: "dumbbell",
  machine: "machine or cable",
  kettlebell: "kettlebell",
};

/** The questions people search about swapping a lift, answered from the same list the page shows. */
function alternativesFaq(e: Exercise, alts: Exercise[]): [string, string][] {
  const l = e.name.toLowerCase();
  const name = (a: Exercise) => `the ${a.name.toLowerCase()}`;
  const faq: [string, string][] = [];
  const [best, ...rest] = alts;
  if (!best) return faq;
  const next = rest.slice(0, 2).map(name);
  faq.push([
    `What is the best alternative to the ${l}?`,
    `${best.name}: ${why(e, best).toLowerCase()}.${next.length ? ` If you can't do that one either, ${next.join(" and ")} ${next.length > 1 ? "are" : "is"} the next closest.` : ""}`,
  ]);
  const free = alts.filter((a) => !a.needs.length).slice(0, 2);
  if (e.needs.length && free.length)
    faq.push([
      `What can I do instead of the ${l} at home with no equipment?`,
      `Try ${free.map(name).join(" or ")}. ${free.length > 1 ? "Both train" : "It trains"} the ${shared(e, free[0]!)} with only your body weight; make ${free.length > 1 ? "them" : "it"} harder with slower reps or more reps once 15 feel easy.`,
    ]);
  for (const kind of ["dumbbell", "machine", "kettlebell"] as const) {
    if (e.load === kind) continue;
    const a = alts.find((x) => x.load === kind);
    if (a) faq.push([`What is a ${KIND_WORDS[kind]} alternative to the ${l}?`, `${a.name}: ${why(e, a).toLowerCase()}.`]);
  }
  faq.push([
    `What muscles should a ${l} alternative work?`,
    `The ${l} mainly works the ${e.primary.map((m) => MUSCLE_NAME[m].toLowerCase()).join(" and ")}${e.secondary.length ? `, with help from the ${e.secondary.map((m) => MUSCLE_NAME[m].toLowerCase()).join(", ")}` : ""}. A good swap trains the same main muscles, ideally with the same kind of movement, so every exercise here does.`,
  ]);
  return faq;
}

const shared = (e: Exercise, a: Exercise) =>
  a.primary
    .filter((m) => e.primary.includes(m))
    .map((m) => MUSCLE_NAME[m].toLowerCase())
    .join(" and ");

/** Why an alternative fits, in a few words. */
function why(e: Exercise, a: Exercise): string {
  const bits = [`Trains the ${shared(e, a)}`];
  if (a.pattern === e.pattern) bits.push("same movement");
  if (!a.needs.length) bits.push("no equipment");
  else if (a.needs.some((n) => !e.needs.includes(n)) || a.needs.length < e.needs.length) bits.push(`needs ${needsText(a).toLowerCase()}`);
  return bits.join(", ");
}

export default async function AlternativesPage({ params }: Props) {
  const e = exerciseBySlug((await params).slug);
  if (!e) notFound();
  const alts = alternativesTo(e.id);
  const faq = alternativesFaq(e, alts);
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
      {faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
          }}
        />
      )}
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
      {faq.length > 0 && (
        <section className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          <dl className="mt-4 space-y-5">
            {faq.map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-muted">
            How to do the original:{" "}
            <Link href={`/exercises/${e.id}/`} className="text-accent underline underline-offset-2">
              {e.name.toLowerCase()} form, muscles and cues
            </Link>
            .
          </p>
        </section>
      )}
      <CtaBanner
        cta="alternatives-end"
        title="A plan that only uses what your gym has"
        body={`Tell ${BRAND.name} your equipment once. Every workout picks exercises you can do there, and swaps rank the closest match first.`}
      />
    </SitePage>
  );
}
