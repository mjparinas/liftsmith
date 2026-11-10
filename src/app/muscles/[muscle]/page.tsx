import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import {
  EQUIPMENT_NAME,
  equipmentSlug,
  exercisesFor,
  MUSCLE_ABOUT,
  MUSCLE_NAME,
  muscleBySlug,
  muscleSlug,
  needsText,
  pairsFor,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { MUSCLES } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => MUSCLES.filter((m) => exercisesFor(m).length).map((m) => ({ muscle: muscleSlug(m) }));

type Props = { params: Promise<{ muscle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = muscleBySlug((await params).muscle);
  if (!m) return {};
  const n = exercisesFor(m).length;
  return {
    title: `${n} best ${MUSCLE_NAME[m].toLowerCase()} exercises`,
    description: `${MUSCLE_ABOUT[m]} Here are ${n} exercises that train it, with form cues, 3D demos and how many sets a week to do.`.slice(
      0,
      300,
    ),
    alternates: { canonical: `/muscles/${muscleSlug(m)}/` },
  };
}

export default async function MusclePage({ params }: Props) {
  const m = muscleBySlug((await params).muscle);
  if (!m) notFound();
  const list = exercisesFor(m);
  const name = MUSCLE_NAME[m].toLowerCase();
  const pairs = pairsFor(m);
  const compound = list.filter((e) => e.compound);
  const iso = list.filter((e) => !e.compound);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${MUSCLE_NAME[m]} exercises`,
    numberOfItems: list.length,
    itemListElement: list.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/exercises/${e.id}/`, name: e.name })),
  };
  return (
    <SitePage kind="muscle" sticky={`Build ${name} with a plan`}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/muscles/", label: "Muscles" }, { label: MUSCLE_NAME[m] }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{MUSCLE_NAME[m]} exercises</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{MUSCLE_ABOUT[m]}</p>
      {pairs.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="self-center text-muted">By equipment:</span>
          {pairs.map((p) => (
            <Link
              key={p.equipment}
              href={`/muscles/${muscleSlug(m)}/${equipmentSlug(p.equipment)}/`}
              className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 hover:border-accent/60"
            >
              {EQUIPMENT_NAME[p.equipment]} ({p.count})
            </Link>
          ))}
        </p>
      )}
      {compound.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight">Compound lifts</h2>
          <p className="mt-1 text-muted">Several muscles at once. Do these first, while you&apos;re fresh.</p>
          <LinkGrid items={compound.map((e) => ({ href: `/exercises/${e.id}/`, title: e.name, meta: needsText(e), body: e.cues[0] }))} />
        </section>
      )}
      <CtaInline
        cta="muscle-mid"
        title={`How many ${name} sets should you do this week?`}
        body={`${BRAND.name} counts them for you and plans the rest, only when your ${name} have recovered.`}
        button="Plan my week"
      />
      {iso.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight">Isolation exercises</h2>
          <p className="mt-1 text-muted">One muscle, one joint. Good for adding sets without much extra fatigue.</p>
          <LinkGrid items={iso.map((e) => ({ href: `/exercises/${e.id}/`, title: e.name, meta: needsText(e), body: e.cues[0] }))} />
        </section>
      )}
      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">How much to train your {name}</h2>
        <p className="mt-2 text-muted">
          About 8 to 12 hard sets a week to start, up to 12 to 20 as you get more experienced, split over two or more sessions, each set
          ending 1 to 3 reps short of failure. More in{" "}
          <Link href="/blog/how-many-sets-per-week-to-build-muscle/" className="text-accent underline underline-offset-2">
            how many sets per week
          </Link>{" "}
          and{" "}
          <Link href="/guides/reps-in-reserve/" className="text-accent underline underline-offset-2">
            reps in reserve
          </Link>
          .
        </p>
      </section>
      <CtaBanner
        cta="muscle-end"
        title={`A ${name} plan that adapts to you`}
        body={`${BRAND.name} picks ${name} exercises your gym can do, sets the weight for every set, and only trains them again once they've recovered.`}
      />
    </SitePage>
  );
}
