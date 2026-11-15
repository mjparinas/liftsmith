// A muscle page ("the best <muscle> exercises", /muscles/<muscle>/ and /<lang>/muscles/<muscle>/) and the muscles
// index, in every site language (docs/decisions/public-pages-and-seo.md "Best exercises for each muscle"). The ranking
// and its reasons come from src/lib/bestFor.ts, names from the app's catalogues and the words around them from
// src/locales/site/muscle.ts. Server only.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";
import { LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { bestBySetup, bestFor, type BestPick } from "@/lib/bestFor";
import { BRAND } from "@/lib/brand";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { EQUIPMENT_NAME, equipmentSlug, exercisesFor, muscleBySlug, muscleSlug, pairsFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import { MUSCLES, type Equipment, type Exercise, type Muscle } from "@/lib/types";
import { equipmentLabels, exerciseWords, muscleLabels } from "@/locales/site/fromApp";
import { MUSCLE_TEXT, MUSCLE_THE, type MuscleText } from "@/locales/site/muscle";

/** How many lifts the top picks list shows. */
export const TOP_PICKS = 8;

/** The muscles that have a page: those some lift works as a main mover. */
export const pageMuscles = (): Muscle[] => MUSCLES.filter((m) => bestFor(m).length > 0);
export const muscleParams = () => pageMuscles().map((m) => ({ muscle: muscleSlug(m) }));
export const musclePath = (m: Muscle) => `/muscles/${muscleSlug(m)}/`;

/** The words a page in one language needs. */
function wordsFor(lang: SiteLang) {
  const muscles = muscleLabels(lang);
  const gear = lang === "en" ? EQUIPMENT_NAME : equipmentLabels(lang);
  const list = (items: string[]) => new Intl.ListFormat(lang, { type: "conjunction" }).format(items);
  // Inside a sentence a muscle or lift starts in lower case, except in German (nouns) and Japanese; names that start
  // with capitals ("EZ curl bar") keep them.
  const low = (s: string) =>
    lang === "de" || lang === "ja" ? s : /^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLocaleLowerCase(lang) + s.slice(1) : s;
  const up = (s: string) => s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
  const the = MUSCLE_THE[lang];
  const inSentence = (m: Muscle) => the?.[m] ?? low(muscles[m]);
  return {
    muscle: (m: Muscle) => muscles[m],
    inSentence,
    muscleList: (ms: readonly Muscle[]) => list(ms.map(inSentence)),
    name: (e: Exercise) => (lang === "en" ? e.name : exerciseWords(lang, e).name),
    cue: (e: Exercise) => (lang === "en" ? e.cues[0] : exerciseWords(lang, e).cues[0]) ?? "",
    needs: (e: Exercise, t: MuscleText) => (e.needs.length ? e.needs.map((q) => gear[q]).join(", ") : t.noEquipment),
    gear: (q: Equipment) => gear[q],
    up,
  };
}

/** A lift's own page from this language: its translated guide if it has one, else English. */
const liftHref = (lang: SiteLang, id: string) =>
  lang !== "en" && LOCAL_GUIDES[lang][id] ? localPath(lang, `/exercises/${id}/`) : `/exercises/${id}/`;

/** Why a lift ranks where it does, as short lines built from the same numbers that ranked it. */
export function reasons(lang: SiteLang, m: Muscle, p: BestPick): string[] {
  const t = MUSCLE_TEXT[lang];
  const w = wordsFor(lang);
  const vars = { muscle: w.inSentence(m) };
  const others = p.e.primary.filter((x) => x !== m);
  return [
    t.why[p.popularity],
    p.focus === "main" || !others.length ? fill(t.why.main, vars) : fill(t.why.shared, { ...vars, others: w.muscleList(others) }),
    p.e.compound ? t.why.compound : t.why.isolation,
    ...(p.e.id in EXERCISE_GUIDES ? [t.why.guided] : []),
  ].map(w.up);
}

export function muscleMeta(lang: SiteLang, slug: string): Metadata {
  const m = muscleBySlug(slug);
  if (!m || !bestFor(m).length) return {};
  const t = MUSCLE_TEXT[lang];
  const w = wordsFor(lang);
  const vars = { muscle: w.inSentence(m), Muscle: w.up(w.inSentence(m)), n: bestFor(m).length };
  return pageMeta({
    title: fill(t.title, vars),
    description: fill(t.description, vars),
    path: musclePath(m),
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function MuscleView({ lang, slug }: { lang: SiteLang; slug: string }) {
  const m = muscleBySlug(slug);
  if (!m) notFound();
  const ranked = bestFor(m);
  if (!ranked.length) notFound();
  const t = MUSCLE_TEXT[lang];
  const w = wordsFor(lang);
  const vars = { muscle: w.inSentence(m), Muscle: w.up(w.inSentence(m)), app: BRAND.name, n: ranked.length };
  const path = localPath(lang, musclePath(m));
  const top = ranked.slice(0, TOP_PICKS);
  const bySetup = bestBySetup(m);
  const all = exercisesFor(m).filter((e) => !e.custom);
  const compound = all.filter((e) => e.compound);
  const iso = all.filter((e) => !e.compound);
  const pairs = pairsFor(m);
  const lead = top[0]!.e;
  const h1 = fill(t.h1, vars);
  const card = (e: Exercise) => ({ href: liftHref(lang, e.id), title: w.name(e), meta: w.needs(e, t), body: w.cue(e) });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    inLanguage: lang,
    name: h1,
    url: `${SITE_URL}${path}`,
    image: [`${SITE_URL}/stills/${lead.id}.webp`, `${SITE_URL}${ogImage(path)}`],
    mainEntity: {
      "@type": "ItemList",
      name: t.topTitle,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: ranked.length,
      itemListElement: ranked.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${liftHref(lang, p.e.id)}`,
        name: w.name(p.e),
      })),
    },
  };
  return (
    <SitePage kind="muscle" sticky={fill(t.sticky, vars)} lang={lang} path={musclePath(m)}>
      <JsonLd data={jsonLd} />
      <Crumbs lang={lang} items={[{ href: localPath(lang, "/muscles/"), label: t.muscles }, { label: w.muscle(m) }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.about[m]}</p>
      {pairs.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="self-center text-muted">{t.byEquipment}</span>
          {pairs.map((p) => (
            <Link
              key={p.equipment}
              href={`/muscles/${muscleSlug(m)}/${equipmentSlug(p.equipment)}/`}
              className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 hover:border-accent/60"
            >
              {w.gear(p.equipment)} ({p.count})
            </Link>
          ))}
        </p>
      )}
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.topTitle}</h2>
        <p className="mt-1 max-w-3xl text-muted">{fill(t.topIntro, vars)}</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {top.map((p, i) => (
            <li key={p.e.id} className="card flex gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/stills/${p.e.id}.webp`}
                alt={fill(t.stillAlt, { name: w.name(p.e) })}
                width={96}
                height={96}
                loading={i < 2 ? "eager" : "lazy"}
                className="size-24 shrink-0 rounded-lg object-contain"
              />
              <div className="min-w-0">
                <p className="font-semibold">
                  <span className="display mr-2 text-accent">{i + 1}</span>
                  <Link href={liftHref(lang, p.e.id)} className="text-accent underline underline-offset-2">
                    {w.name(p.e)}
                  </Link>
                </p>
                <p className="mt-0.5 text-xs text-muted">{w.needs(p.e, t)}</p>
                <ul className="mt-2 space-y-0.5 text-sm text-muted">
                  {reasons(lang, m, p).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {bySetup.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{t.setupTitle}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {bySetup.map(({ setup, pick }) => (
              <div key={setup} className="card p-4">
                <dt className="text-sm text-muted">{t.setups[setup]}</dt>
                <dd className="mt-1 font-semibold">
                  <Link href={liftHref(lang, pick.e.id)} className="text-accent underline underline-offset-2">
                    {w.name(pick.e)}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <CtaInline cta="muscle-mid" title={fill(t.mid.title, vars)} body={fill(t.mid.body, vars)} button={t.mid.button} />
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{fill(t.allTitle, { ...vars, n: all.length })}</h2>
        {compound.length > 0 && (
          <>
            <h3 className="mt-6 text-xl font-bold tracking-tight">{t.compoundTitle}</h3>
            <p className="mt-1 text-muted">{t.compoundBody}</p>
            <LinkGrid items={compound.map(card)} />
          </>
        )}
        {iso.length > 0 && (
          <>
            <h3 className="mt-8 text-xl font-bold tracking-tight">{t.isoTitle}</h3>
            <p className="mt-1 text-muted">{t.isoBody}</p>
            <LinkGrid items={iso.map(card)} />
          </>
        )}
      </section>
      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">{fill(t.setsTitle, vars)}</h2>
        <p className="mt-2 text-muted">
          {t.setsBody} {t.reading}{" "}
          <Link href="/blog/how-many-sets-per-week-to-build-muscle/" className="text-accent underline underline-offset-2">
            {t.readSets}
          </Link>
          ,{" "}
          <Link href="/guides/reps-in-reserve/" className="text-accent underline underline-offset-2">
            {t.readRir}
          </Link>
          .
        </p>
      </section>
      {t.englishLinks && <p className="mt-6 text-xs text-muted">{t.englishLinks}</p>}
      <CtaBanner cta="muscle-end" lang={lang} title={fill(t.end.title, vars)} body={fill(t.end.body, vars)} />
    </SitePage>
  );
}

export function musclesIndexMeta(lang: SiteLang): Metadata {
  const t = MUSCLE_TEXT[lang].index;
  return pageMeta({
    title: t.title,
    description: t.description,
    path: "/muscles/",
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function MusclesIndexView({ lang }: { lang: SiteLang }) {
  const t = MUSCLE_TEXT[lang];
  const w = wordsFor(lang);
  const list = pageMuscles();
  return (
    <SitePage kind="muscle-index" lang={lang} path="/muscles/">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          inLanguage: lang,
          name: t.index.h1,
          url: `${SITE_URL}${localPath(lang, "/muscles/")}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: list.length,
            itemListElement: list.map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${localPath(lang, musclePath(m))}`,
              name: w.muscle(m),
            })),
          },
        }}
      />
      <Crumbs lang={lang} items={[{ label: t.muscles }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{t.index.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.index.intro}</p>
      <LinkGrid
        items={list.map((m) => ({
          href: localPath(lang, musclePath(m)),
          title: w.muscle(m),
          meta: fill(t.index.count, { n: bestFor(m).length }),
          body: t.about[m],
        }))}
      />
      <CtaInline
        cta="muscle-index-mid"
        title={t.indexMid.title}
        body={fill(t.indexMid.body, { app: BRAND.name })}
        button={t.indexMid.button}
      />
      <CtaBanner cta="muscle-index-end" lang={lang} title={t.indexEnd.title} body={fill(t.indexEnd.body, { app: BRAND.name })} />
    </SitePage>
  );
}
