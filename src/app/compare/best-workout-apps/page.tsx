import type { Metadata } from "next";
import Link from "next/link";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { checkedYear, COMPETITOR_BY_SLUG, COMPETITORS, lastChecked, TRADEMARKS } from "@/content/compare";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { absolute } from "@/lib/seo";

const YEAR = COMPETITORS.map(checkedYear).sort().at(-1)!;
const COUNT = COMPETITORS.length + 1;

export const metadata: Metadata = pageMeta({
  title: `Workout tracker apps (${YEAR}): ${COUNT} compared by what they're for`,
  description: `${COUNT} workout tracker apps grouped by what they do well: planning for you, logging your own program, or following a set program. Prices and facts sourced.`,
  path: "/compare/best-workout-apps/",
});

/** The apps by what a lifter wants from them. Liftsmith plans for you, so it heads the first group. */
const GROUPS: { h2: string; intro: string; slugs: string[] }[] = [
  {
    h2: "If you want the app to plan your workouts",
    intro: "These choose the exercises, sets and weights for you and move them forward as you get stronger.",
    slugs: ["fitbod", "alpha-progression", "jefit", "gymverse"],
  },
  {
    h2: "If you run your own program",
    intro: "These are logbooks first: you build the routine, they keep the record and the timer.",
    slugs: ["hevy", "strong"],
  },
  {
    h2: "If you want to follow a set program",
    intro: "These are built around ready-made programs, from one classic beginner plan to thousands of coaches' plans.",
    slugs: ["stronglifts", "boostcamp"],
  },
];

const fact = (slug: string, topic: "price" | "plans" | "free") => COMPETITOR_BY_SLUG.get(slug)?.rows[topic]?.[0]?.text ?? "";

export default function BestWorkoutApps() {
  const checked = COMPETITORS.map(lastChecked).sort()[0]!;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Workout tracker apps compared (${YEAR})`,
    url: absolute("/compare/best-workout-apps/"),
    numberOfItems: COUNT,
    itemListElement: [
      { name: BRAND.name, url: absolute("/") },
      ...COMPETITORS.map((c) => ({ name: c.name, url: absolute(`/compare/${c.slug}/`) })),
    ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
  };
  let n = 1;
  return (
    <SitePage kind="compare-roundup" sticky={`Try ${BRAND.name} free`}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/compare/", label: "Compare" }, { label: "Workout tracker apps" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Workout tracker apps compared ({YEAR})</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        The right app depends on what you want it to do. Here are {COUNT}, grouped by that, each with who it suits. We make {BRAND.name}, so
        read our entry with that in mind; every fact about the others comes from their own store listings and sites, checked in{" "}
        {new Date(`${checked}T00:00:00Z`).toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" })}, and links to
        its source on the comparison pages.
      </p>
      {GROUPS.map((g, gi) => (
        <section key={g.h2} className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{g.h2}</h2>
          <p className="mt-2 max-w-3xl text-muted">{g.intro}</p>
          <ol className="mt-4 space-y-4">
            {gi === 0 ? (
              <li className="card-tint p-5" style={{ ["--tint" as string]: "var(--color-accent)" }}>
                <h3 className="text-xl font-bold">
                  {n++}. {BRAND.name}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Plans each workout from your gym&apos;s equipment and what has recovered, with the weight and reps for every set and a
                  short reason for each, in training blocks that end in a deload. Plates are drawn for every barbell set and the rest timer
                  runs on the lock screen. The logger and every fixed program (a classic 5×5 among them) are free; Pro is $6.99 a month or
                  $39.99 a year. Android, iPhone, Wear OS, Apple Watch and the web.
                </p>
                <p className="mt-2 text-sm text-muted">
                  A good fit if you want the plan made for you, with a reason you can see, and a free plan that isn&apos;t a trial.
                </p>
              </li>
            ) : null}
            {g.slugs.map((slug) => {
              const c = COMPETITOR_BY_SLUG.get(slug)!;
              return (
                <li key={slug} className="card p-5">
                  <h3 className="text-xl font-bold">
                    {n++}. {c.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {c.summary} {fact(slug, "plans")} {fact(slug, "price")}
                  </p>
                  <p className="mt-2 text-sm text-muted">A good fit if {c.theirPick}</p>
                  <p className="mt-3">
                    <Link href={`/compare/${slug}/`} className="text-sm text-accent underline underline-offset-2">
                      {BRAND.name} vs {c.name}, with sources
                    </Link>
                  </p>
                </li>
              );
            })}
          </ol>
          {gi === 0 ? (
            <CtaInline
              cta="compare-roundup-mid"
              title="See what it plans for you"
              body={`${BRAND.name} is free to start with no account. Pick your equipment and your first workout is ready.`}
              button="Try it free"
            />
          ) : null}
        </section>
      ))}
      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">How to choose</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted">
          <li>Try the free plan first. Every app here can be downloaded free; check what still works after a trial ends.</li>
          <li>Check your watch. Apple Watch and Wear OS support varies, and some apps have none.</li>
          <li>Make sure you can leave. A CSV export means your history goes with you if you switch.</li>
          <li>Count the taps. You will log hundreds of sets; the fewer taps per set, the more you will actually log.</li>
        </ul>
      </section>
      <CtaBanner
        cta="compare-roundup-end"
        title="Try it and decide for yourself"
        body={`${BRAND.name} is free to start with no account. Bring your history: import a CSV export from your current app.`}
      />
      <p className="mt-8 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
