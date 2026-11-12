// A translated exercise guide page (/<lang>/exercises/<id>/; docs/decisions/public-pages-and-seo.md "Translated exercise
// guides"). Only the lifts with a full guide have one. The lift's own words (name, setup, cues, muscles, equipment)
// come from the app's catalogues, the guide from src/content/exerciseGuides/<lang>.ts and the frame from
// src/locales/site/exercise.ts. Links to other guided lifts stay in the language; everything else links to English.
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { rich } from "@/components/site/ArticleView";
import { ExerciseDemo } from "@/components/site/ExerciseDemo";
import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { LOCAL_GUIDES, localExercisePath } from "@/content/exerciseGuides/i18n";
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { alternativesTo, exerciseBySlug, exercisesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { fill } from "@/lib/siteLang";
import { EXAMPLE, hasStartTable, startTable, type StartCell } from "@/lib/startTable";
import type { Exercise } from "@/lib/types";
import { EXERCISE_TEXT, type GuideLang } from "@/locales/site/exercise";
import { equipmentLabels, exerciseWords, muscleLabels } from "@/locales/site/fromApp";

/** A lift's name inside a sentence: lower-case first letter, except in German (nouns) and Japanese. */
export function inName(lang: GuideLang, name: string): string {
  if (lang === "de" || lang === "ja") return name;
  return name.charAt(0).toLocaleLowerCase(lang) + name.slice(1);
}

export const localParams = (lang: GuideLang) => () => EXERCISES.filter((e) => LOCAL_GUIDES[lang][e.id]).map((e) => ({ slug: e.id }));

export function localMeta(lang: GuideLang, slug: string): Metadata {
  const e = exerciseBySlug(slug);
  if (!e || !LOCAL_GUIDES[lang][e.id]) return {};
  const t = EXERCISE_TEXT[lang];
  const { name } = exerciseWords(lang, e);
  return pageMeta({
    title: fill(t.title, { name }),
    description: fill(t.description, { name: inName(lang, name) }),
    path: `/exercises/${e.id}/`,
    lang,
  });
}

/** Where a lift's link goes from a page in this language: its translated guide if it has one, else the English page. */
const hrefFor = (lang: GuideLang, id: string) => (LOCAL_GUIDES[lang][id] ? localExercisePath(lang, id) : `/exercises/${id}/`);

export function LocalExerciseView({ lang, slug }: { lang: GuideLang; slug: string }) {
  const e = exerciseBySlug(slug);
  const guide = e && LOCAL_GUIDES[lang][e.id];
  if (!e || !guide) notFound();
  const t = EXERCISE_TEXT[lang];
  const words = exerciseWords(lang, e);
  const muscle = muscleLabels(lang);
  const gear = equipmentLabels(lang);
  const needs = (x: Exercise) => (x.needs.length ? x.needs.map((n) => gear[n]).join(", ") : t.noEquipment);
  const card = (x: Exercise, body?: string) => ({ href: hrefFor(lang, x.id), title: exerciseWords(lang, x).name, meta: needs(x), body });
  const alts = alternativesTo(e.id, 6);
  const more = exercisesFor(e.primary[0])
    .filter((x) => x.id !== e.id && !alts.includes(x))
    .slice(0, 6);
  const steps = [words.setup, ...words.cues];
  const table = hasStartTable(e) ? startTable(e) : null;
  const unit = e.load === "dumbbell" ? t.perDumbbell : e.load === "kettlebell" ? t.kettlebell : "";
  const name = inName(lang, words.name);
  const path = localExercisePath(lang, e.id);
  const start = (c: StartCell) =>
    c === "bar" ? (
      t.emptyBar
    ) : (
      <>
        {c.kg} kg <span className="text-muted">({c.lb} lb)</span>
        {unit ? <span className="text-muted"> {unit}</span> : null}
      </>
    );
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      inLanguage: lang,
      name: fill(t.title, { name: words.name }),
      url: `${SITE_URL}${path}`,
      image: [`${SITE_URL}/stills/${e.id}.webp`, `${SITE_URL}${ogImage(path)}`],
      tool: e.needs.map((n) => ({ "@type": "HowToTool", name: gear[n] })),
      step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: guide.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <SitePage kind="exercise" sticky={t.sticky} lang={lang} path={`/exercises/${e.id}/`}>
      <JsonLd data={jsonLd} />
      <Crumbs lang={lang} items={[{ href: "/exercises/", label: t.library }, { label: words.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{words.name}</h1>
      <dl className="mt-3 max-w-2xl space-y-1 text-lg text-muted">
        <div>
          <dt className="inline font-semibold text-ink">{t.mainMuscles}: </dt>
          <dd className="inline">{e.primary.map((m) => muscle[m]).join(", ")}</dd>
        </div>
        {e.secondary.length > 0 && (
          <div>
            <dt className="inline font-semibold text-ink">{t.alsoWorks}: </dt>
            <dd className="inline">{e.secondary.map((m) => muscle[m]).join(", ")}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold text-ink">{t.equipment}: </dt>
          <dd className="inline">{needs(e)}</dd>
        </div>
      </dl>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted">{rich(guide.intro)}</p>
      <p className="mt-2 text-xs text-muted">{t.englishLinks}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <ExerciseDemo id={e.id} labels={muscle} />
          <p className="mt-2 text-xs text-muted">{t.dragHint}</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.howTo}</h2>
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
                  {i === 0 ? <span className="font-semibold text-ink">{t.setup}: </span> : null}
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <h2 className="mt-8 text-xl font-bold">{t.musclesWorked}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/stills/${e.id}.webp`}
            alt={fill(t.imageAlt, { name: words.name })}
            width={240}
            height={240}
            loading="lazy"
            className="mt-3 size-40 object-contain"
          />
          <ul className="mt-3 flex flex-wrap gap-2">
            {e.primary.map((m) => (
              <li
                key={m}
                className="inline-flex min-h-11 items-center rounded-full border border-accent/50 bg-accent/10 px-4 text-sm font-medium"
              >
                {muscle[m]} · {t.mainTag}
              </li>
            ))}
            {e.secondary.map((m) => (
              <li key={m} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm">
                {muscle[m]}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">{t.mistakes}</h2>
          <dl className="mt-4 space-y-4">
            {guide.mistakes.map(([m, fix]) => (
              <div key={m}>
                <dt className="font-semibold">{m}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{rich(fix)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h2 className="text-2xl font-bold tracking-tight">{t.setsReps}</h2>
          <ul className="mt-4 space-y-2">
            {guide.sets.map((s) => (
              <li key={s} className="leading-relaxed text-muted">
                {rich(s)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">{t.setsNote}</p>
          {table && (
            <>
              <h2 className="mt-8 text-xl font-bold">{t.startTitle}</h2>
              <p className="mt-2 text-sm text-muted">{fill(t.startBody, { women: EXAMPLE.women, men: EXAMPLE.men })}</p>
              <div className="mt-3 overflow-x-auto" role="region" aria-label={t.startTitle} tabIndex={0}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        <span className="sr-only">{t.experience}</span>
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        {fill(t.woman, { kg: EXAMPLE.women })}
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        {fill(t.man, { kg: EXAMPLE.men })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((r) => (
                      <tr key={r.level} className="border-b border-line/60">
                        <th scope="row" className="py-2 pr-3 font-medium">
                          {r.level === "new" ? t.levelNew : t.levelSome}
                        </th>
                        <td className="py-2 pr-3 tabular-nums">{start(r.women)}</td>
                        <td className="py-2 tabular-nums">{start(r.men)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted">{fill(t.startNote, { app: BRAND.name })}</p>
            </>
          )}
        </section>
      </div>
      <CtaInline cta="exercise-mid" title={fill(t.midTitle, { name })} body={fill(t.midBody, { app: BRAND.name })} button={t.midButton} />
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.variations}</h2>
        <LinkGrid
          items={guide.variations.flatMap(([id, when]) => {
            const v = exerciseBySlug(id);
            return v ? [card(v, when)] : [];
          })}
        />
      </section>
      {alts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{t.alternatives}</h2>
          <p className="mt-2 text-muted">{t.alternativesBody}</p>
          <LinkGrid items={alts.map((a) => card(a))} />
        </section>
      )}
      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{fill(t.moreOf, { muscle: muscle[e.primary[0]] })}</h2>
          <LinkGrid items={more.map((a) => card(a))} />
        </section>
      )}
      <section className="mt-10 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">{t.questions}</h2>
        <dl className="mt-4 space-y-5">
          {guide.faq.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 leading-relaxed text-muted">{rich(a)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaBanner cta="exercise-end" lang={lang} title={fill(t.endTitle, { name })} body={fill(t.endBody, { app: BRAND.name })} />
    </SitePage>
  );
}
