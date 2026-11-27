// A program page (/programs/<id>/ and /<lang>/programs/<id>/) and the programs index, in every site language
// (docs/decisions/public-pages-and-seo.md "Program pages"). The workouts are the program engine's own (programDays in
// src/lib/programs.ts) for a new lifter in a full gym, the text is the app's own program text, and the words around it
// come from src/locales/site/program.ts. Server only.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { BRAND } from "@/lib/brand";
import { defaultProfile, makeGym } from "@/lib/defaults";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { PlanItem } from "@/lib/generator";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { programDays, PROGRAMS, SPLITS, weeklyPreview, type Ctx, type ProgramInfo } from "@/lib/programs";
import { TIMED } from "@/lib/progression";
import { EQUIPMENT_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import type { Muscle } from "@/lib/types";
import { equipmentLabels, exerciseWords, muscleLabels, programDayN, programLine, programWords } from "@/locales/site/fromApp";
import { printLine } from "@/locales/site/print";
import { PROGRAM_TEXT, type ProgramText } from "@/locales/site/program";

/** The lifter the workouts are drawn for: a new lifter in a full commercial gym, on a fixed day. */
const NOW = Date.UTC(2026, 0, 5);
export const PROGRAM_CTX: Ctx = { profile: defaultProfile(NOW), gym: makeGym("commercial", "kg", "site"), events: [], now: NOW };

export const programPath = (id: string) => `/programs/${id}/`;
export const programParams = () => PROGRAMS.map((p) => ({ program: p.id }));
export const programById = (id: string) => PROGRAMS.find((p) => p.id === id) ?? null;

/** A program's words in a language, from the app's catalogue. */
export const programText = (lang: SiteLang, p: ProgramInfo) => programWords(lang, p.id, p.how.length);

/** Sets and reps the way a program card says them: "5 × 5", "3 × 15+", "5, 5, 5+, 5 × 10" or "3 × 20 s". */
export function scheme(lang: SiteLang, it: PlanItem): string {
  if (lang === "en" && it.scheme) return it.scheme;
  const t = PROGRAM_TEXT[lang];
  const timed = TIMED.has(it.exerciseId);
  const rep = (n: number, amrap?: boolean) => (timed ? fill(t.hold, { n }) : `${n}${amrap ? "+" : ""}`);
  const sets = it.setTargets ?? Array.from({ length: it.sets }, () => ({ reps: it.target.reps, amrap: false }));
  const runs: { n: number; label: string }[] = [];
  for (const s of sets) {
    const label = rep(s.reps, s.amrap);
    const last = runs[runs.length - 1];
    if (last && last.label === label) last.n++;
    else runs.push({ n: 1, label });
  }
  if (runs.length === 1) return `${runs[0]!.n} × ${runs[0]!.label}`;
  // Every set the same with the last one for as many reps as you can: "5 × 3+".
  if (runs.length === 2 && runs[1]!.n === 1 && runs[1]!.label === `${runs[0]!.label}+`) return `${runs[0]!.n + 1} × ${runs[1]!.label}`;
  return runs.flatMap((r) => (r.n >= 3 ? [`${r.n} × ${r.label}`] : Array.from({ length: r.n }, () => r.label))).join(", ");
}

export const restText = (t: ProgramText, sec: number) =>
  sec >= 120 && sec % 60 === 0 ? fill(t.restMin, { n: sec / 60 }) : fill(t.restSec, { n: sec });

/** A lift's own page from this language: its translated guide if it has one, else English. */
const liftHref = (lang: SiteLang, id: string) =>
  lang !== "en" && LOCAL_GUIDES[lang][id] ? localPath(lang, `/exercises/${id}/`) : `/exercises/${id}/`;

/** The muscles a program trains most in a typical week, most first. */
export function trainsMost(p: ProgramInfo, n = 6): { m: Muscle; sets: number }[] {
  return (Object.entries(weeklyPreview(p.id, PROGRAM_CTX)) as [Muscle, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([m, sets]) => ({ m, sets }));
}

/** An exercise's name in this language. */
export function programExName(lang: SiteLang, exId: string): string {
  const e = EXERCISE_BY_ID.get(exId);
  return e ? (lang === "en" ? e.name : exerciseWords(lang, e).name) : exId;
}

/** A program day's name ("Workout A") in this language, or "Day 2" when it has no translation. */
export const programDayName = (lang: SiteLang, english: string, i: number) =>
  lang === "en" ? english : (programLine(lang, english) ?? programDayN(lang, i + 1));

/** A lift's tier or role ("T1", "Main lift") in this language. */
export const programItemLabel = (lang: SiteLang, english?: string) =>
  english ? (lang === "en" || /^T\d$/.test(english) ? english : programLine(lang, english)) : null;

/** What a program needs, or "Whatever your gym has". */
export function programEquipment(lang: SiteLang, p: ProgramInfo): string {
  const gear = lang === "en" ? EQUIPMENT_NAME : equipmentLabels(lang);
  return p.needs.length ? p.needs.map((q) => gear[q]).join(lang === "ja" ? "、" : ", ") : PROGRAM_TEXT[lang].anyGym;
}

export function programMeta(lang: SiteLang, id: string): Metadata {
  const p = programById(id);
  if (!p) return {};
  const t = PROGRAM_TEXT[lang];
  const w = programText(lang, p);
  return pageMeta({
    title: fill(t.title, { name: w.name, days: p.daysPerWeek }),
    description: fill(t.description, { summary: w.summary }),
    path: programPath(p.id),
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function ProgramView({ lang, id }: { lang: SiteLang; id: string }) {
  const p = programById(id);
  if (!p) notFound();
  const t = PROGRAM_TEXT[lang];
  const w = programText(lang, p);
  const muscles = muscleLabels(lang);
  const num = (n: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(n);
  const vars = { name: w.name, days: p.daysPerWeek, app: BRAND.name };
  const path = localPath(lang, programPath(p.id));
  const days = programDays(p.id, PROGRAM_CTX);
  const split = p.kind === "split" ? SPLITS[p.id as keyof typeof SPLITS] : null;
  const trains = trainsMost(p);
  const exName = (exId: string) => programExName(lang, exId);
  const dayName = (english: string, i: number) => programDayName(lang, english, i);
  const label = (english?: string) => programItemLabel(lang, english);
  const equipment = programEquipment(lang, p);
  const facts: [string, string][] = [
    [t.days, String(p.daysPerWeek)],
    [t.level, t.levels[p.level]],
    [t.equipment, equipment],
    [fill(t.price, vars), p.tier === "pro" ? t.pro : t.free],
  ];
  const faq: [string, string][] = [
    [fill(t.qWho, vars), t.aWho[p.level]],
    [fill(t.qDays, vars), [fill(t.aDays, vars), ...(p.daysPerWeek <= 4 ? [t.aDaysRest] : [])].join(lang === "ja" ? "" : " ")],
    [fill(t.qGear, vars), p.needs.length ? fill(t.aGear, { ...vars, equipment }) : t.aGearNone],
    [fill(t.qFree, vars), fill(p.tier === "pro" ? t.aPro : t.aFree, vars)],
  ];
  const others = PROGRAMS.filter((x) => x.id !== p.id);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ExercisePlan",
      inLanguage: lang,
      name: w.name,
      description: w.summary,
      url: `${SITE_URL}${path}`,
      image: `${SITE_URL}${ogImage(path)}`,
      exerciseType: "Strength training",
      activityFrequency: fill(PROGRAM_TEXT[lang].index.perWeek, { n: p.daysPerWeek }),
      isAccessibleForFree: p.tier === "free",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <SitePage kind="program" sticky={fill(t.sticky, vars)} lang={lang} path={programPath(p.id)}>
      <JsonLd data={jsonLd} />
      <Crumbs lang={lang} items={[{ href: localPath(lang, "/programs/"), label: t.programs }, { label: w.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
        {w.name}{" "}
        <span className="ml-1 inline-block rounded-full border border-line px-3 py-0.5 align-middle text-sm font-semibold text-muted">
          {p.tier === "pro" ? t.pro : t.free}
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{w.summary}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {facts.map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="mt-1 font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.howTitle}</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5">
          {w.how.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{fill(t.credit, { text: w.basedOn })}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.weekTitle}</h2>
        <p className="mt-1 max-w-3xl text-muted">{days ? t.weekIntro : t.splitIntro}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {days?.map((d, i) => (
            <section key={i} className="card p-4" aria-label={dayName(d.name, i)}>
              <h3 className="font-bold">{dayName(d.name, i)}</h3>
              <ol className="mt-2 divide-y divide-line text-sm">
                {d.items.map((it) => (
                  <li key={it.exerciseId} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                    <span>
                      {label(it.label) && <span className="mr-2 text-xs text-muted">{label(it.label)}</span>}
                      <Link href={liftHref(lang, it.exerciseId)} className="text-accent underline underline-offset-2">
                        {exName(it.exerciseId)}
                      </Link>
                    </span>
                    <span className="tabular-nums">
                      {scheme(lang, it)} <span className="text-muted">· {restText(t, it.restSec)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          {split?.map((d, i) => (
            <section key={d.name} className="card p-4" aria-label={dayName(d.name, i)}>
              <h3 className="font-bold">{dayName(d.name, i)}</h3>
              <p className="mt-2 text-sm text-muted">{fill(t.splitMuscles, { muscles: d.muscles.map((m) => muscles[m]).join(", ") })}</p>
            </section>
          ))}
        </div>
        <p className="mt-4">
          <Link
            href={localPath(lang, `/programs/${p.id}/print/`)}
            className="btn press inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 font-semibold hover:border-accent/60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
            </svg>
            {printLine(lang, "prt.page.link")}
          </Link>
        </p>
      </section>
      <CtaInline cta="program-mid" title={fill(t.mid.title, vars)} body={fill(t.mid.body, vars)} button={t.mid.button} />
      {trains.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{t.trainsTitle}</h2>
          <p className="mt-1 max-w-3xl text-muted">{t.trainsIntro}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {trains.map(({ m, sets }) => (
              <li key={m} className="card flex justify-between p-3">
                <span>{muscles[m]}</span>
                <span className="tabular-nums text-muted">{fill(t.perWeek, { n: num(sets) })}</span>
              </li>
            ))}
          </ul>
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
            href: localPath(lang, programPath(x.id)),
            title: programText(lang, x).name,
            meta: `${fill(t.index.perWeek, { n: x.daysPerWeek })} · ${x.tier === "pro" ? t.pro : t.free}`,
          }))}
        />
      </section>
      {t.englishLinks && <p className="mt-6 text-xs text-muted">{t.englishLinks}</p>}
      <CtaBanner cta="program-end" lang={lang} title={fill(t.end.title, vars)} body={fill(t.end.body, vars)} />
    </SitePage>
  );
}

export function programsIndexMeta(lang: SiteLang): Metadata {
  const t = PROGRAM_TEXT[lang].index;
  return pageMeta({
    title: t.title,
    description: t.description,
    path: "/programs/",
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function ProgramsIndexView({ lang }: { lang: SiteLang }) {
  const t = PROGRAM_TEXT[lang];
  const card = (x: ProgramInfo) => {
    const w = programText(lang, x);
    return {
      href: localPath(lang, programPath(x.id)),
      title: w.name,
      meta: `${fill(t.index.perWeek, { n: x.daysPerWeek })} · ${t.levels[x.level]} · ${x.tier === "pro" ? t.pro : t.free}`,
      body: w.summary,
    };
  };
  return (
    <SitePage kind="program-index" lang={lang} path="/programs/">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          inLanguage: lang,
          name: t.index.h1,
          url: `${SITE_URL}${localPath(lang, "/programs/")}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: PROGRAMS.length,
            itemListElement: PROGRAMS.map((x, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${localPath(lang, programPath(x.id))}`,
              name: programText(lang, x).name,
            })),
          },
        }}
      />
      <Crumbs lang={lang} items={[{ label: t.programs }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{t.index.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.index.intro}</p>
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">{t.index.fixed}</h2>
        <LinkGrid items={PROGRAMS.filter((x) => x.kind === "fixed").map(card)} />
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">{t.index.splits}</h2>
        <LinkGrid items={PROGRAMS.filter((x) => x.kind === "split").map(card)} />
      </section>
      <CtaBanner cta="program-index-end" lang={lang} title={t.indexEnd.title} body={fill(t.indexEnd.body, { app: BRAND.name })} />
    </SitePage>
  );
}
