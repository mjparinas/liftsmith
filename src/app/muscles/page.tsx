import type { Metadata } from "next";

import { Crumbs, CtaBanner, CtaInline, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { exercisesFor, MUSCLE_ABOUT, MUSCLE_NAME, muscleSlug } from "@/lib/seo";
import { MUSCLES } from "@/lib/types";

export const metadata: Metadata = pageMeta({
  title: "Exercises by muscle",
  description:
    "Find the best exercises for every muscle: chest, back, shoulders, arms, legs, glutes and core, with form cues and 3D demos.",
  path: "/muscles/",
});

export default function MusclesIndex() {
  return (
    <SitePage kind="muscle-index">
      <Crumbs items={[{ label: "Muscles" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Exercises by muscle</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">Pick a muscle to see what it does and every exercise that trains it.</p>
      <LinkGrid
        items={MUSCLES.filter((m) => exercisesFor(m).length).map((m) => ({
          href: `/muscles/${muscleSlug(m)}/`,
          title: MUSCLE_NAME[m],
          meta: `${exercisesFor(m).length} exercises`,
          body: MUSCLE_ABOUT[m],
        }))}
      />
      <CtaInline
        cta="muscle-index-mid"
        title="See which muscles are ready today"
        body={`${BRAND.name}'s 3D recovery map shows how recovered each muscle is, and plans today's workout around the ones that are.`}
        button="See my recovery map"
      />
      <CtaBanner
        cta="muscle-index-end"
        title="Train every muscle, in the right amount"
        body={`${BRAND.name} counts your weekly sets for each muscle and aims them at the right target for your experience, so nothing gets skipped or overdone.`}
      />
    </SitePage>
  );
}
