import type { Metadata } from "next";

import { Crumbs, CtaBanner, CtaInline, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { EQUIPMENT_NAME, equipmentSlug, equipmentWithPages, exercisesWith, noEquipment } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Exercises by equipment",
  description:
    "Every exercise you can do with a barbell, dumbbells, kettlebells, cables, machines, bands or no equipment at all, with form cues and 3D demos.",
  path: "/equipment/",
});

export default function EquipmentIndex() {
  const bw = noEquipment();
  return (
    <SitePage kind="equipment-index">
      <Crumbs items={[{ label: "Equipment" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Exercises by equipment</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Pick what you have to see every exercise you can do with it.</p>
      <LinkGrid
        items={equipmentWithPages().map((eq) => ({
          href: `/equipment/${equipmentSlug(eq)}/`,
          title: EQUIPMENT_NAME[eq],
          meta: `${exercisesWith(eq).length} exercises`,
        }))}
      />
      <CtaInline
        cta="equipment-index-mid"
        title="Plan around exactly what you have"
        body={`Tell ${BRAND.name} your equipment, even the plates and dumbbells you own, and every workout fits it.`}
        button="Set up my gym"
      />
      <h2 className="mt-10 text-2xl font-bold tracking-tight">No equipment ({bw.length})</h2>
      <LinkGrid items={bw.map((e) => ({ href: `/exercises/${e.id}/`, title: e.name }))} />
      <CtaBanner
        cta="equipment-index-end"
        title="A full gym, a home gym or nothing at all"
        body={`${BRAND.name} builds complete workouts for whatever you have, and switches gyms when you do.`}
      />
    </SitePage>
  );
}
