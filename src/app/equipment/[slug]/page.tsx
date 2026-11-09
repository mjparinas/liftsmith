import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBanner, CtaInline, Crumbs, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { EQUIPMENT_NAME, equipmentBySlug, equipmentSlug, equipmentWithPages, exercisesWith, MUSCLE_NAME, muscleSlug, needsText, pairsWith } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => equipmentWithPages().map((eq) => ({ slug: equipmentSlug(eq) }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const eq = equipmentBySlug((await params).slug);
  if (!eq || !exercisesWith(eq).length) return {};
  const n = exercisesWith(eq).length;
  return {
    title: `${n} ${EQUIPMENT_NAME[eq].toLowerCase()} exercise${n === 1 ? "" : "s"}`,
    description: `Exercises you can do with ${EQUIPMENT_NAME[eq].toLowerCase()}, grouped by muscle, with setup, form cues and a 3D demo for each.`,
    alternates: { canonical: `/equipment/${equipmentSlug(eq)}/` },
  };
}

export default async function EquipmentPage({ params }: Props) {
  const eq = equipmentBySlug((await params).slug);
  if (!eq) notFound();
  const list = exercisesWith(eq);
  if (!list.length) notFound();
  const name = EQUIPMENT_NAME[eq].toLowerCase();
  const pairs = pairsWith(eq);
  const jsonLd = { "@context": "https://schema.org", "@type": "ItemList", name: `${EQUIPMENT_NAME[eq]} exercises`, numberOfItems: list.length, itemListElement: list.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/exercises/${e.id}/`, name: e.name })) };
  return (
    <SitePage kind="equipment" sticky={`Workouts for your ${name}`}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/equipment/", label: "Equipment" }, { label: EQUIPMENT_NAME[eq] }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{EQUIPMENT_NAME[eq]} exercises</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{list.length} exercise{list.length === 1 ? "" : "s"} that use {name}, with what else each one needs.</p>
      {pairs.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="self-center text-muted">By muscle:</span>
          {pairs.map((p) => <Link key={p.muscle} href={`/muscles/${muscleSlug(p.muscle)}/${equipmentSlug(eq)}/`} className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 hover:border-accent/60">{MUSCLE_NAME[p.muscle]} ({p.count})</Link>)}
        </p>
      )}
      <LinkGrid items={list.map((e) => ({ href: `/exercises/${e.id}/`, title: e.name, meta: `${e.primary.map((m) => MUSCLE_NAME[m]).join(", ")} · ${needsText(e)}` }))} />
      <CtaInline cta="equipment-mid" title={`Workouts built around your ${name}`} body={`${BRAND.name} picks from these when the muscles they train have recovered, and works out the weight for every set.`} button="Plan with my equipment" />
      <CtaBanner cta="equipment-end" title="Never wonder what to do next" body={`Tell ${BRAND.name} what your gym has once. Every workout after that is planned for you, set by set.`} />
    </SitePage>
  );
}
