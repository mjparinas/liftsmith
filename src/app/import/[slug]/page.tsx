import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "@/components/site/SiteChrome";
import { TRADEMARKS } from "@/content/compare";
import { IMPORT_BY_SLUG, IMPORT_SOURCES } from "@/content/imports";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { absolute } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => IMPORT_SOURCES.map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = IMPORT_BY_SLUG.get((await params).slug);
  if (!s) return {};
  return pageMeta({
    title: `Switch from ${s.name} to ${BRAND.name}: import your workouts`,
    description: `Bring your ${s.name} history to ${BRAND.name} in a few minutes: export a CSV from ${s.name}, import it, and keep every workout, set and personal best.`,
    path: `/import/${s.slug}/`,
  });
}

export default async function ImportPage({ params }: Props) {
  const s = IMPORT_BY_SLUG.get((await params).slug);
  if (!s) notFound();
  const steps = [
    ...s.exportSteps,
    `Open ${BRAND.name} (the app, or the web app in any browser) and go to Settings, then Data.`,
    "Tap Import from another app (CSV) and pick the file.",
    `Check the exercise list. ${BRAND.name} matches each of your exercises to one in its library; change any it got wrong, or keep it as your own exercise.`,
    "Tap Import. Your workouts appear in your history, and your next plan starts from them.",
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to move your workouts from ${s.name} to ${BRAND.name}`,
    url: absolute(`/import/${s.slug}/`),
    step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
  };
  return (
    <SitePage kind="import" sticky={`Bring your ${s.name} history`}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/compare/", label: "Compare" }, { label: `Switch from ${s.name}` }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Switch from {s.name} without losing your history</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Years of logged sets shouldn&apos;t keep you in an app. Export a CSV from {s.name}, import it into {BRAND.name}, and every workout,
        set and personal best comes with you. It takes a few minutes, and the file is read on your device, never uploaded.
      </p>
      <CtaInline
        cta="import-top"
        title="Start with a free plan"
        body={`${BRAND.name} is free to start with no account. Import your history first, and your first plan already knows your weights.`}
        button="Open the app"
      />
      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">How to move your workouts</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((x, i) => (
            <li key={x} className="flex gap-3">
              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <span className="leading-relaxed text-muted">{x}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-bold">What comes across</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {s.carries.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-bold">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {s.notes.map((x) => (
              <li key={x}>{x}</li>
            ))}
            <li>Importing the same file twice adds nothing, so you can import again later to bring newer workouts across.</li>
          </ul>
        </div>
      </section>
      <section className="mt-10 max-w-3xl space-y-4 leading-relaxed">
        <h2 className="text-2xl font-bold tracking-tight">What changes after you switch</h2>
        <p className="text-muted">
          Your history isn&apos;t just kept, it&apos;s used. {BRAND.name} reads your imported sets to estimate your max on every lift, sets
          the weight for your next workout from them, and shows how many sets each muscle got recently on the recovery map. Instead of
          picking what to do each day, you open the app and the workout is already planned around your equipment, recovery and time.
        </p>
        <p className="text-muted">
          See how the two apps compare in{" "}
          <Link href={`/compare/${s.slug}/`} className="text-accent underline underline-offset-2">
            {BRAND.name} vs {s.name}
          </Link>
          , or read{" "}
          <Link href="/blog/how-to-track-your-workouts/" className="text-accent underline underline-offset-2">
            how to track your workouts so they actually improve
          </Link>
          .
        </p>
      </section>
      <CtaBanner
        cta="import-end"
        title={`Keep your ${s.name} history, get a plan`}
        body={`Import your workouts, and ${BRAND.name} plans the next one from them: every set, weight and rest worked out for you.`}
      />
      <p className="mt-6 text-xs text-muted">{TRADEMARKS}</p>
    </SitePage>
  );
}
