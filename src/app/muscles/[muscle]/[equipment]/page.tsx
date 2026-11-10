import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import {
  EQUIPMENT_NAME,
  equipmentBySlug,
  equipmentSlug,
  MUSCLE_ABOUT,
  MUSCLE_NAME,
  muscleBySlug,
  muscleSlug,
  needsText,
  PAIR_MIN,
  pairExercises,
  pairs,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => pairs().map((p) => ({ muscle: muscleSlug(p.muscle), equipment: equipmentSlug(p.equipment) }));

type Props = { params: Promise<{ muscle: string; equipment: string }> };

async function read(params: Props["params"]) {
  const p = await params;
  const m = muscleBySlug(p.muscle);
  const eq = equipmentBySlug(p.equipment);
  if (!m || !eq || pairExercises(m, eq).length < PAIR_MIN) return null;
  return { m, eq, list: pairExercises(m, eq) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await read(params);
  if (!r) return {};
  const title = `${r.list.length} ${MUSCLE_NAME[r.m].toLowerCase()} exercises with ${EQUIPMENT_NAME[r.eq].toLowerCase()}`;
  return {
    title,
    description: `${title}: how to do each one, the muscles it works and a 3D demo, plus how to fit them into your week.`,
    alternates: { canonical: `/muscles/${muscleSlug(r.m)}/${equipmentSlug(r.eq)}/` },
  };
}

export default async function PairPage({ params }: Props) {
  const r = await read(params);
  if (!r) notFound();
  const { m, eq, list } = r;
  const mn = MUSCLE_NAME[m].toLowerCase();
  const en = EQUIPMENT_NAME[eq].toLowerCase();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${MUSCLE_NAME[m]} exercises with ${en}`,
    numberOfItems: list.length,
    itemListElement: list.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/exercises/${e.id}/`, name: e.name })),
  };
  return (
    <SitePage kind="pair" sticky={`A ${mn} plan for your kit`}>
      <JsonLd data={jsonLd} />
      <Crumbs
        items={[
          { href: "/muscles/", label: "Muscles" },
          { href: `/muscles/${muscleSlug(m)}/`, label: MUSCLE_NAME[m] },
          { label: EQUIPMENT_NAME[eq] },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
        {MUSCLE_NAME[m]} exercises with {en}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {MUSCLE_ABOUT[m]} These {list.length} exercises train it with {en}. See every{" "}
        <Link href={`/muscles/${muscleSlug(m)}/`} className="text-accent underline underline-offset-2">
          {mn} exercise
        </Link>{" "}
        or everything you can do with{" "}
        <Link href={`/equipment/${equipmentSlug(eq)}/`} className="text-accent underline underline-offset-2">
          {en}
        </Link>
        .
      </p>
      <LinkGrid items={list.map((e) => ({ href: `/exercises/${e.id}/`, title: e.name, meta: needsText(e), body: e.setup }))} />
      <CtaInline
        cta="pair-mid"
        title={`Only have ${en}?`}
        body={`Tell ${BRAND.name} what you own and every workout uses only that, with the weight for each set worked out for you.`}
        button="Plan with my equipment"
      />
      <CtaBanner
        cta="pair-end"
        title={`Build your ${mn} with the kit you have`}
        body={`${BRAND.name} picks from these exercises when your ${mn} have recovered, and moves the weight or reps forward every session.`}
      />
    </SitePage>
  );
}
