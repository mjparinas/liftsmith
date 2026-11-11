import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExerciseDemo } from "@/components/site/ExerciseDemo";
import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { alternativesTo, EQUIPMENT_NAME, equipmentSlug, exerciseBySlug, exercisesFor, MUSCLE_NAME, muscleSlug, needsText } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Exercise } from "@/lib/types";

export const dynamicParams = false;
export const generateStaticParams = () => EXERCISES.map((e) => ({ slug: e.id }));

type Props = { params: Promise<{ slug: string }> };

const muscles = (e: Exercise) => e.primary.map((m) => MUSCLE_NAME[m].toLowerCase()).join(" and ");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = exerciseBySlug((await params).slug);
  if (!e) return {};
  return pageMeta({
    title: `${e.name}: form, muscles worked and alternatives`,
    description: `How to do the ${e.name.toLowerCase()} with good form: setup, cues, a 3D demo, the muscles it works (${muscles(e)}), equipment and the best alternatives.`,
    path: `/exercises/${e.id}/`,
  });
}

export default async function ExercisePage({ params }: Props) {
  const e = exerciseBySlug((await params).slug);
  if (!e) notFound();
  const alts = alternativesTo(e.id, 6);
  const more = exercisesFor(e.primary[0])
    .filter((x) => x.id !== e.id && !alts.includes(x))
    .slice(0, 6);
  const steps = [e.setup, ...e.cues];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to do the ${e.name.toLowerCase()}`,
    description: `${e.name}: a ${e.compound ? "compound" : "isolation"} exercise for the ${muscles(e)}.`,
    url: `${SITE_URL}/exercises/${e.id}/`,
    image: [`${SITE_URL}/stills/${e.id}.webp`, `${SITE_URL}${ogImage(`/exercises/${e.id}/`)}`],
    tool: e.needs.map((n) => ({ "@type": "HowToTool", name: EQUIPMENT_NAME[n] })),
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
  };
  return (
    <SitePage kind="exercise" sticky={`Get ${e.name.toLowerCase()} in your plan`}>
      <JsonLd data={jsonLd} />
      <Crumbs
        items={[
          { href: "/exercises/", label: "Exercises" },
          { href: `/muscles/${muscleSlug(e.primary[0])}/`, label: MUSCLE_NAME[e.primary[0]] },
          { label: e.name },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{e.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        A {e.compound ? "compound" : "isolation"} exercise for the {muscles(e)}
        {e.secondary.length ? <>, with help from the {e.secondary.map((m) => MUSCLE_NAME[m].toLowerCase()).join(", ")}</> : null}.
        Equipment: {needsText(e).toLowerCase()}.
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ExerciseDemo id={e.id} labels={MUSCLE_NAME} />
          <p className="mt-2 text-xs text-muted">Drag to turn the figure. The highlighted muscles are the ones doing the work.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">How to do it</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent"
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed text-muted">
                  {i === 0 ? (
                    <>
                      <span className="font-semibold text-ink">Setup: </span>
                      {s}
                    </>
                  ) : (
                    s
                  )}
                </span>
              </li>
            ))}
          </ol>
          <h2 className="mt-8 text-xl font-bold">Muscles worked</h2>
          {/* A still of the 3D figure (scripts/og-images.mjs), so the page has a picture search engines can see. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/stills/${e.id}.webp`}
            alt={`${e.name}: 3D figure mid-rep with the ${muscles(e)} highlighted`}
            width={240}
            height={240}
            loading="lazy"
            className="mt-3 size-40 object-contain"
          />
          <ul className="mt-3 flex flex-wrap gap-2">
            {e.primary.map((m) => (
              <li key={m}>
                <Link
                  href={`/muscles/${muscleSlug(m)}/`}
                  className="press inline-flex min-h-11 items-center rounded-full border border-accent/50 bg-accent/10 px-4 text-sm font-medium"
                >
                  {MUSCLE_NAME[m]} · main
                </Link>
              </li>
            ))}
            {e.secondary.map((m) => (
              <li key={m}>
                <Link
                  href={`/muscles/${muscleSlug(m)}/`}
                  className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm"
                >
                  {MUSCLE_NAME[m]}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-xl font-bold">Equipment</h2>
          {e.needs.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {e.needs.map((n) => (
                <li key={n}>
                  <Link
                    href={`/equipment/${equipmentSlug(n)}/`}
                    className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm"
                  >
                    {EQUIPMENT_NAME[n]}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">
              None. You can do it anywhere. See more{" "}
              <Link href="/equipment/" className="text-accent underline underline-offset-2">
                exercises by equipment
              </Link>
              .
            </p>
          )}
        </div>
      </div>
      <CtaInline
        cta="exercise-mid"
        title={`What weight should you use for the ${e.name.toLowerCase()}?`}
        body={`${BRAND.name} works it out from your body weight and experience, then adds a rep or a plate when you've earned it, ${e.load === "barbell" ? "with the plates for each side drawn for you" : "every session"}.`}
        button="Get my weights"
      />
      {alts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">Alternatives</h2>
          <p className="mt-2 text-muted">
            Exercises that train the same main muscles.{" "}
            <Link href={`/exercises/${e.id}/alternatives/`} className="text-accent underline underline-offset-2">
              See all {e.name.toLowerCase()} alternatives
            </Link>
            .
          </p>
          <LinkGrid items={alts.map((a) => ({ href: `/exercises/${a.id}/`, title: a.name, meta: needsText(a) }))} />
        </section>
      )}
      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">More {MUSCLE_NAME[e.primary[0]].toLowerCase()} exercises</h2>
          <LinkGrid items={more.map((a) => ({ href: `/exercises/${a.id}/`, title: a.name, meta: needsText(a) }))} />
        </section>
      )}
      <CtaBanner
        cta="exercise-end"
        title={`Put the ${e.name.toLowerCase()} in a plan that adapts`}
        body={`${BRAND.name} decides when to do it, how many sets and reps, and the weight, from your recovery and last session. Log each set in one tap; the rest timer starts on its own.`}
      />
    </SitePage>
  );
}
