import type { Metadata } from "next";
import Link from "next/link";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import { pageMeta } from "@/lib/pageMeta";
import { exercisesFor, MUSCLE_NAME, muscleSlug } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { MUSCLES } from "@/lib/types";

export const metadata: Metadata = pageMeta({
  title: `Exercise library: ${EXERCISES.length} exercises with 3D demos`,
  description: `How to do ${EXERCISES.length} strength exercises, from barbell lifts to bodyweight moves: setup, form cues, muscles worked, equipment, alternatives and a 3D demo for each.`,
  path: "/exercises/",
});

export default function ExercisesIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Exercise library",
    numberOfItems: EXERCISES.length,
    itemListElement: EXERCISES.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/exercises/${e.id}/`,
      name: e.name,
    })),
  };
  return (
    <SitePage kind="exercise-index" sticky="Get these in a plan for you">
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ label: "Exercises" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Exercise library</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {EXERCISES.length} exercises with setup, form cues, the muscles they work, alternatives and a 3D demo. Also browse by{" "}
        <Link href="/muscles/" className="text-accent underline underline-offset-2">
          muscle
        </Link>{" "}
        or by{" "}
        <Link href="/equipment/" className="text-accent underline underline-offset-2">
          equipment
        </Link>
        .
      </p>
      <CtaInline
        cta="exercise-index-top"
        title="Don't know which to pick?"
        body={`${BRAND.name} picks the exercises, sets, reps and weights for you from what your gym has and what's recovered.`}
        button="Get today's workout"
      />
      {MUSCLES.filter((m) => exercisesFor(m).length).map((m) => (
        <section key={m} className="mt-8">
          <h2 className="text-xl font-bold">
            <Link href={`/muscles/${muscleSlug(m)}/`} className="hover:text-accent">
              {MUSCLE_NAME[m]}
            </Link>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {exercisesFor(m).map((e) => (
              <li key={e.id}>
                <Link
                  href={`/exercises/${e.id}/`}
                  className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm hover:border-accent/60"
                >
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <CtaBanner
        cta="exercise-index-end"
        title="Stop guessing in the gym"
        body={`${BRAND.name} builds each workout from these exercises around your equipment, recovery and goals, with the weight for every set already filled in.`}
      />
    </SitePage>
  );
}
