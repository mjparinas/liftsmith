// A 30-day challenge page (/challenges/<slug>/ and /<lang>/challenges/<slug>/) and the challenges index, in every site
// language (Melvin, 2026-11-27, traffic idea 2; docs/decisions/thirty-day-challenges.md). The 30 days are the app's own
// plan (thirtyPlan in src/lib/thirtyDay.ts), the challenge's name and why are the app's own words (c30.*), how to do the
// move is the exercise's own setup and cues, and the words around them come from src/locales/site/challenge.ts. The
// calendar prints on one page with the address and a code that opens this page, and Join in the app opens the app's
// challenge screen at the level picked. Server only.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QrCode } from "@/components/QrCode";
import { ChallengeCalendar, type CalendarLevel } from "@/components/site/ChallengeCalendar";
import { Crumbs, CtaBanner, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { BRAND } from "@/lib/brand";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import {
  THIRTY_BY_SLUG,
  THIRTY_CHALLENGES,
  THIRTY_LEVELS,
  thirtyPath,
  thirtyPlan,
  thirtyTotal,
  type ThirtyChallenge,
  type ThirtyLevel,
} from "@/lib/thirtyDay";
import { CHALLENGE_TEXT, type ChallengeText } from "@/locales/site/challenge";
import { exerciseWords, muscleLabels, thirtyLevelName, thirtyWords } from "@/locales/site/fromApp";

export const challengeParams = () => THIRTY_CHALLENGES.map((c) => ({ challenge: c.slug }));
const INDEX = "/challenges/";

/** A name in the middle of a sentence: lower case first letter, except in German (nouns) and scripts without case. */
const mid = (lang: SiteLang, s: string) =>
  lang === "de" || lang === "ja" || lang === "ko" ? s : s.charAt(0).toLocaleLowerCase(lang) + s.slice(1);

const num = (lang: SiteLang, n: number) => new Intl.NumberFormat(lang).format(n);

/** "40 reps", "90 seconds", "12 reps each leg" (Japanese and Korean with no space: "40回"). */
function amount(lang: SiteLang, t: ChallengeText, c: ThirtyChallenge, n: number): string {
  const tight = lang === "ja" || lang === "ko";
  const unit = c.unit === "seconds" ? t.secs : t.reps;
  const base = tight ? `${num(lang, n)}${unit}` : `${num(lang, n)} ${unit}`;
  if (!c.perSide) return base;
  return tight ? `${t.perLeg}${base}` : `${base} ${t.perLeg}`;
}

const liftName = (lang: SiteLang, id: string) => {
  const e = EXERCISE_BY_ID.get(id);
  return e ? (lang === "en" ? e.name : exerciseWords(lang, e).name) : id;
};

/** A lift's own page from this language: its translated guide if it has one, else English. */
const liftHref = (lang: SiteLang, id: string) =>
  lang !== "en" && LOCAL_GUIDES[lang][id] ? localPath(lang, `/exercises/${id}/`) : `/exercises/${id}/`;

/** The app's challenge screen at a level: the website's Join in the app. */
export const joinHref = (c: ThirtyChallenge, level: ThirtyLevel) => `${APP_PATH}#/challenge/${c.id}~${level}`;

export function challengeMeta(lang: SiteLang, slug: string): Metadata {
  const c = THIRTY_BY_SLUG.get(slug);
  if (!c) return {};
  const t = CHALLENGE_TEXT[lang];
  const w = thirtyWords(lang, c.id);
  return pageMeta({
    title: fill(t.title, { name: w.name }),
    description: fill(t.description, { why: w.why }),
    path: thirtyPath(c),
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function ChallengeView({ lang, slug }: { lang: SiteLang; slug: string }) {
  const c = THIRTY_BY_SLUG.get(slug);
  if (!c) notFound();
  const t = CHALLENGE_TEXT[lang];
  const w = thirtyWords(lang, c.id);
  const vars = { name: w.name, app: BRAND.name };
  const path = localPath(lang, thirtyPath(c));
  const url = `${SITE_URL}${path}`;
  const printed = url.replace(/^https?:\/\//, "");
  const levels: CalendarLevel[] = THIRTY_LEVELS.map((level) => {
    const plan = thirtyPlan(c, level);
    const { exercise, start, end } = c.levels[level];
    return {
      level,
      label: thirtyLevelName(lang, level),
      intro: fill(t.calIntro, {
        start: amount(lang, t, c, start),
        end: amount(lang, t, c, end),
        total: amount(lang, t, c, thirtyTotal(c, level)),
      }),
      lift: liftName(lang, exercise),
      days: plan.map((d) => ({ day: d.day, rest: d.rest, amount: num(lang, d.amount) })),
      join: joinHref(c, level),
    };
  });
  // How to do the move: the intermediate level's exercise (beginners may do an easier version, named above).
  const mainId = c.levels.intermediate.exercise;
  const main = EXERCISE_BY_ID.get(mainId);
  const how = main ? (lang === "en" ? { name: main.name, setup: main.setup, cues: main.cues } : exerciseWords(lang, main)) : null;
  const muscles = muscleLabels(lang);
  const unit = `${c.unit === "seconds" ? t.secs : t.reps}${c.perSide ? ` ${t.perLeg}` : ""}`;
  const rules = c.unit === "seconds" ? [t.rulesHold, ...t.rules.slice(1)] : t.rules;
  const faq: [string, string][] = [
    [fill(t.qWorks, { name: mid(lang, w.name) }), fill(t.aWorks, vars)],
    [t.qMiss, t.aMiss],
    [t.qDaily, t.aDaily],
    [t.qAfter, fill(t.aAfter, vars)],
  ];
  const others = THIRTY_CHALLENGES.filter((x) => x.id !== c.id);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ExercisePlan",
      inLanguage: lang,
      name: w.name,
      description: w.why,
      url,
      image: [`${SITE_URL}/stills/${mainId}.webp`, `${SITE_URL}${ogImage(path)}`],
      exerciseType: "Bodyweight",
      activityDuration: "P30D",
      activityFrequency: "P1D",
      isAccessibleForFree: true,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <SitePage kind="challenge" sticky={fill(t.sticky, vars)} lang={lang} path={thirtyPath(c)}>
      <JsonLd data={jsonLd} />
      <Crumbs lang={lang} items={[{ href: localPath(lang, INDEX), label: t.challenges }, { label: w.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{w.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{fill(t.intro, { why: w.why, app: BRAND.name })}</p>

      <section className="mt-8" aria-labelledby="calendar">
        <h2 id="calendar" className="mb-3 text-2xl font-bold tracking-tight">
          {t.calTitle}
        </h2>
        <ChallengeCalendar
          name={w.name}
          levels={levels}
          site={printed}
          cta="challenge"
          qr={<QrCode text={`${url}?from=print`} label={t.qr} className="size-full" />}
          words={{
            level: t.level,
            day: t.day,
            rest: t.rest,
            print: t.print,
            printNote: t.printNote,
            join: t.join,
            joinBody: fill(t.joinBody, vars),
            sheetName: t.sheetName,
            sheetStart: t.sheetStart,
            sheetFoot: t.sheetFoot,
            qr: t.qr,
            unit,
          }}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.levelsTitle}</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
          {THIRTY_LEVELS.map((level) => (
            <li key={level}>
              {fill(t.levelLine, {
                level: thirtyLevelName(lang, level),
                lift: liftName(lang, c.levels[level].exercise),
                start: amount(lang, t, c, c.levels[level].start),
                end: amount(lang, t, c, c.levels[level].end),
              })}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.rulesTitle}</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      {main && how && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {t.howTitle}:{" "}
            <Link href={liftHref(lang, main.id)} className="text-accent underline underline-offset-2">
              {how.name}
            </Link>
          </h2>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/stills/${main.id}.webp`}
              alt={how.name}
              width={240}
              height={240}
              loading="lazy"
              className="size-40 shrink-0 object-contain"
            />
            <div>
              <p className="max-w-3xl">{how.setup}</p>
              <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5">
                {how.cues.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <ul className="mt-3 flex flex-wrap gap-2">
                {main.primary.map((m) => (
                  <li key={m} className="inline-flex min-h-9 items-center rounded-full border border-accent/50 bg-accent/10 px-3 text-sm">
                    {muscles[m]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.faqTitle}</h2>
        <dl className="mt-4 space-y-5">
          {faq.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.more}</h2>
        <LinkGrid
          items={others.map((x) => ({
            href: localPath(lang, thirtyPath(x)),
            title: thirtyWords(lang, x.id).name,
            meta: fill(t.index.range, {
              start: amount(lang, t, x, x.levels.beginner.start),
              end: amount(lang, t, x, x.levels.advanced.end),
            }),
          }))}
        />
      </section>
      <CtaBanner
        cta="challenge-end"
        lang={lang}
        title={t.end.title}
        body={fill(t.end.body, vars)}
        button={t.join}
        href={joinHref(c, "beginner")}
      />
    </SitePage>
  );
}

export function challengesIndexMeta(lang: SiteLang): Metadata {
  const t = CHALLENGE_TEXT[lang].index;
  return pageMeta({ title: t.title, description: t.description, path: INDEX, ...(lang === "en" ? { translated: true } : { lang }) });
}

export function ChallengesIndexView({ lang }: { lang: SiteLang }) {
  const t = CHALLENGE_TEXT[lang];
  return (
    <SitePage kind="challenge-index" lang={lang} path={INDEX}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          inLanguage: lang,
          name: t.index.h1,
          url: `${SITE_URL}${localPath(lang, INDEX)}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: THIRTY_CHALLENGES.length,
            itemListElement: THIRTY_CHALLENGES.map((x, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${localPath(lang, thirtyPath(x))}`,
              name: thirtyWords(lang, x.id).name,
            })),
          },
        }}
      />
      <Crumbs lang={lang} items={[{ label: t.challenges }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{t.index.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.index.intro}</p>
      <LinkGrid
        items={THIRTY_CHALLENGES.map((x) => {
          const w = thirtyWords(lang, x.id);
          return {
            href: localPath(lang, thirtyPath(x)),
            title: w.name,
            meta: fill(t.index.range, {
              start: amount(lang, t, x, x.levels.beginner.start),
              end: amount(lang, t, x, x.levels.advanced.end),
            }),
            body: w.why,
          };
        })}
      />
      <CtaBanner
        cta="challenge-index-end"
        lang={lang}
        title={t.end.title}
        body={fill(t.end.body, { app: BRAND.name })}
        button={t.join}
        href={`${APP_PATH}#/challenge`}
      />
    </SitePage>
  );
}
