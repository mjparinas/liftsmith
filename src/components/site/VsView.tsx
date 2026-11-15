// An exercise comparison page (/exercises/vs/<a>-vs-<b>/ and /<lang>/exercises/vs/<a>-vs-<b>/) and its index, in every
// site language (docs/decisions/public-pages-and-seo.md "Exercise comparisons"). Facts come from the exercise library
// (src/lib/versus.ts), the "when to pick" lines from each language's exercise guides, and the words around them from
// src/locales/site/vs.ts. Server only.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs, CtaBanner, CtaInline, JsonLd, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";
import { LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { BRAND } from "@/lib/brand";
import { ogImage } from "@/lib/ogImages";
import { pageMeta } from "@/lib/pageMeta";
import { EQUIPMENT_NAME, MUSCLE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import { EXAMPLE, hasStartTable, startTable, type StartCell } from "@/lib/startTable";
import type { Equipment, Exercise, Muscle } from "@/lib/types";
import { vsBySlug, vsFacts, vsFor, vsPairs, vsPath, type VsPair } from "@/lib/versus";
import { equipmentLabels, exerciseWords, muscleLabels } from "@/locales/site/fromApp";
import { VS_TEXT, type VsText } from "@/locales/site/vs";

export const vsParams = () => vsPairs().map((p) => ({ pair: p.slug }));

/** The words a page in one language needs: names, muscles and equipment as the app says them there. */
function wordsFor(lang: SiteLang) {
  const muscles = muscleLabels(lang);
  const gear = lang === "en" ? EQUIPMENT_NAME : equipmentLabels(lang);
  const list = (items: string[]) => new Intl.ListFormat(lang, { type: "conjunction" }).format(items);
  // A muscle, a lift or a piece of kit inside a sentence starts in lower case ("the front squat", "sentadilla frontal"),
  // except in German (nouns) and Japanese; names that start with capitals ("EZ curl bar") keep them.
  const low = (s: string) =>
    lang === "de" || lang === "ja" ? s : /^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLocaleLowerCase(lang) + s.slice(1) : s;
  return {
    name: (e: Exercise) => (lang === "en" ? e.name : exerciseWords(lang, e).name),
    muscleList: (ms: readonly Muscle[]) => list(ms.map((m) => low(muscles[m]))),
    muscleCell: (ms: readonly Muscle[]) => ms.map((m) => muscles[m]).join(", "),
    gearList: (eq: readonly Equipment[]) => list(eq.map((q) => low(gear[q]))),
    gearCell: (eq: readonly Equipment[]) => eq.map((q) => gear[q]).join(", "),
    low,
  };
}

/** The page's address in a language. */
const pathIn = (lang: SiteLang, p: VsPair) => localPath(lang, vsPath(p));
/** A lift's own page from this language: its translated guide if it has one, else English. */
const liftHref = (lang: SiteLang, id: string) =>
  lang !== "en" && LOCAL_GUIDES[lang][id] ? localPath(lang, `/exercises/${id}/`) : `/exercises/${id}/`;

/** When to pick a lift: the line from the other lift's guide in this language, else one built from the facts. */
function pickLine(lang: SiteLang, t: VsText, p: VsPair, x: Exercise, other: Exercise, w: ReturnType<typeof wordsFor>): string {
  const guide = lang === "en" ? EXERCISE_GUIDES[other.id] : LOCAL_GUIDES[lang][other.id];
  const note = guide?.variations.find(([id]) => id === x.id)?.[1];
  if (note && p.pick[x.id]) return note;
  const onlyX = x.primary.filter((m) => !other.primary.includes(m));
  if (!x.needs.length && other.needs.length) return t.fb.noGear;
  if (x.needs.length && x.needs.length < other.needs.length && x.needs.every((n) => other.needs.includes(n)))
    return fill(t.fb.lessGear, { equipment: w.gearList(x.needs) });
  if (onlyX.length) return fill(t.fb.muscles, { muscles: w.muscleList(onlyX) });
  if (x.compound && !other.compound) return t.fb.compound;
  if (x.load === other.load && x.start > 0 && x.start > other.start * 1.25) return t.fb.heavier;
  return fill(t.fb.gear, { equipment: x.needs.length ? w.gearList(x.needs) : w.low(t.noEquipment) });
}

export function vsMeta(lang: SiteLang, slug: string): Metadata {
  const p = vsBySlug(slug);
  if (!p) return {};
  const t = VS_TEXT[lang];
  const { a, b } = vsFacts(p);
  const w = wordsFor(lang);
  const names = { a: w.name(a), b: w.low(w.name(b)) };
  return pageMeta({
    title: fill(t.title, names),
    description: fill(t.description, names),
    path: vsPath(p),
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

export function VsView({ lang, slug }: { lang: SiteLang; slug: string }) {
  const p = vsBySlug(slug);
  if (!p) notFound();
  const t = VS_TEXT[lang];
  const f = vsFacts(p);
  const { a, b } = f;
  const w = wordsFor(lang);
  const nameA = w.name(a);
  const nameB = w.name(b);
  const inA = w.low(nameA);
  const inB = w.low(nameB);
  const vars = { app: BRAND.name };
  const path = pathIn(lang, p);
  const start = (e: Exercise, c: StartCell) => {
    if (c === "bar") return t.emptyBar;
    const unit = e.load === "dumbbell" ? ` ${t.perDumbbell}` : e.load === "kettlebell" ? ` ${t.kettlebell}` : "";
    return `${c.kg} kg (${c.lb} lb)${unit}`;
  };
  const tables = hasStartTable(a) && hasStartTable(b) ? [startTable(a)[1]!, startTable(b)[1]!] : null;
  const rows: [string, string, string][] = [
    [t.mainMuscles, w.muscleCell(a.primary), w.muscleCell(b.primary)],
    [t.alsoWorks, a.secondary.length ? w.muscleCell(a.secondary) : t.dash, b.secondary.length ? w.muscleCell(b.secondary) : t.dash],
    [t.equipment, a.needs.length ? w.gearCell(a.needs) : t.noEquipment, b.needs.length ? w.gearCell(b.needs) : t.noEquipment],
    [t.movement, t.patterns[a.pattern], t.patterns[b.pattern]],
    [t.kind, a.compound ? t.compound : t.isolation, b.compound ? t.compound : t.isolation],
  ];
  if (tables) {
    rows.push([fill(t.startMan, { kg: EXAMPLE.men }), start(a, tables[0]!.men), start(b, tables[1]!.men)]);
    rows.push([fill(t.startWoman, { kg: EXAMPLE.women }), start(a, tables[0]!.women), start(b, tables[1]!.women)]);
  }
  const muscleText = [
    f.shared.length ? fill(t.shared, { muscles: w.muscleList(f.shared) }) : t.none,
    ...(f.onlyA.length ? [fill(t.only, { name: inA, muscles: w.muscleList(f.onlyA) })] : []),
    ...(f.onlyB.length ? [fill(t.only, { name: inB, muscles: w.muscleList(f.onlyB) })] : []),
  ].join(" ");
  const picks: [string, string][] = [
    [nameA, pickLine(lang, t, p, a, b, w)],
    [nameB, pickLine(lang, t, p, b, a, w)],
  ];
  const swapLines = [
    f.bForA ? fill(t.swap, { ...vars, a: inA, b: inB, rank: f.bForA.rank, n: f.bForA.of }) : fill(t.swapNone, { ...vars, a: inA, b: inB }),
    f.aForB ? fill(t.swap, { ...vars, a: inB, b: inA, rank: f.aForB.rank, n: f.aForB.of }) : null,
  ].filter((s): s is string => !!s);
  const gearA = a.needs.length ? w.gearList(a.needs) : w.low(t.noEquipment);
  const gearB = b.needs.length ? w.gearList(b.needs) : w.low(t.noEquipment);
  const faq: [string, string][] = [
    [fill(t.q1, { a: inA, b: inB }), [t.a1, ...picks.map(([n, line]) => `${n}: ${line}`)].join(" ")],
    [fill(t.q2, { a: inA, b: inB }), muscleText],
    [
      fill(t.q3, { a: inA, b: inB }),
      f.sameEquipment ? fill(t.a3same, { equipment: gearA }) : fill(t.a3diff, { a: inA, b: inB, equipment: gearA, other: gearB }),
    ],
  ];
  const related = [...vsFor(a.id), ...vsFor(b.id)].filter((x, i, all) => x.slug !== p.slug && all.indexOf(x) === i).slice(0, 6);
  const otherName = (x: VsPair) => {
    const ea = vsFacts(x);
    return fill(t.h1, { a: w.name(ea.a), b: w.low(w.name(ea.b)) });
  };
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      inLanguage: lang,
      name: fill(t.h1, { a: nameA, b: inB }),
      url: `${SITE_URL}${path}`,
      image: [`${SITE_URL}/stills/${a.id}.webp`, `${SITE_URL}/stills/${b.id}.webp`, `${SITE_URL}${ogImage(path)}`],
      about: [a, b].map((e) => ({ "@type": "ExerciseAction", name: w.name(e), url: `${SITE_URL}${liftHref(lang, e.id)}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans } })),
    },
  ];
  return (
    <SitePage kind="vs" sticky={t.sticky} lang={lang} path={vsPath(p)}>
      <JsonLd data={jsonLd} />
      <Crumbs
        lang={lang}
        items={[
          { href: "/exercises/", label: t.library },
          { href: localPath(lang, "/exercises/vs/"), label: t.compare },
          { label: fill(t.h1, { a: nameA, b: inB }) },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{fill(t.h1, { a: nameA, b: inB })}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{muscleText}</p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[a, b].map((e) => (
          <figure key={e.id} className="card p-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/stills/${e.id}.webp`}
              alt={fill(t.stillAlt, { name: w.name(e) })}
              width={320}
              height={320}
              loading="lazy"
              className="mx-auto aspect-square w-full max-w-64 object-contain"
            />
            <figcaption className="mt-2 font-semibold">
              <Link href={liftHref(lang, e.id)} className="text-accent underline underline-offset-2">
                {w.name(e)}
              </Link>
            </figcaption>
          </figure>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.side}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="card w-full min-w-0 table-fixed text-sm">
            <thead>
              <tr className="border-b border-line">
                <td className="w-1/3 px-3 py-2" />
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {nameA}
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  {nameB}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([label, x, y]) => (
                <tr key={label}>
                  <th scope="row" className="px-3 py-2 text-left align-top font-medium text-muted">
                    {label}
                  </th>
                  <td className="px-3 py-2 align-top break-words">{x}</td>
                  <td className="px-3 py-2 align-top break-words">{y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tables && <p className="mt-2 text-xs text-muted">{t.startNote}</p>}
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.when}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {picks.map(([n, line]) => (
            <div key={n} className="card p-4">
              <dt className="font-semibold">{n}</dt>
              <dd className="mt-1 text-muted">{line}</dd>
            </div>
          ))}
        </dl>
      </section>
      <CtaInline cta="vs-mid" title={t.mid.title} body={fill(t.mid.body, vars)} button={t.mid.button} />
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.swapTitle}</h2>
        {swapLines.map((s) => (
          <p key={s} className="mt-2 max-w-3xl text-muted">
            {s}
          </p>
        ))}
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {[a, b].map((e) => (
            <li key={e.id} className="contents">
              <Link href={liftHref(lang, e.id)} className="text-accent underline underline-offset-2">
                {fill(t.howTo, { name: lang === "en" ? w.low(w.name(e)) : w.name(e) })}
              </Link>
              <Link href={`/exercises/${e.id}/alternatives/`} className="text-accent underline underline-offset-2">
                {fill(t.alternatives, { name: lang === "en" ? w.low(w.name(e)) : w.name(e) })}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{t.faqTitle}</h2>
        <dl className="mt-4 space-y-5">
          {faq.map(([q, ans]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{ans}</dd>
            </div>
          ))}
        </dl>
      </section>
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">{t.more}</h2>
          <LinkGrid items={related.map((x) => ({ href: pathIn(lang, x), title: otherName(x) }))} />
        </section>
      )}
      {t.englishLinks && <p className="mt-6 text-xs text-muted">{t.englishLinks}</p>}
      <CtaBanner cta="vs-end" lang={lang} title={t.end.title} body={fill(t.end.body, vars)} />
    </SitePage>
  );
}

export function vsIndexMeta(lang: SiteLang): Metadata {
  const t = VS_TEXT[lang].index;
  return pageMeta({
    title: t.title,
    description: t.description,
    path: "/exercises/vs/",
    ...(lang === "en" ? { translated: true } : { lang }),
  });
}

/** Every comparison, grouped by the first lift's main muscle. */
export function VsIndexView({ lang }: { lang: SiteLang }) {
  const t = VS_TEXT[lang];
  const w = wordsFor(lang);
  const muscles = muscleLabels(lang);
  const groups = new Map<Muscle, VsPair[]>();
  for (const p of vsPairs()) {
    const m = vsFacts(p).a.primary[0]!;
    groups.set(m, [...(groups.get(m) ?? []), p]);
  }
  const list = [...groups.entries()].sort((x, y) => y[1].length - x[1].length);
  return (
    <SitePage kind="vs" sticky={t.sticky} lang={lang} path="/exercises/vs/">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          inLanguage: lang,
          name: t.index.h1,
          url: `${SITE_URL}${localPath(lang, "/exercises/vs/")}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: vsPairs().length,
            itemListElement: vsPairs().map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${pathIn(lang, p)}` })),
          },
        }}
      />
      <Crumbs lang={lang} items={[{ href: "/exercises/", label: t.library }, { label: t.compare }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{t.index.h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t.index.intro}</p>
      <p className="mt-1 text-sm text-muted">{fill(t.index.count, { n: vsPairs().length })}</p>
      {list.map(([m, pairs]) => (
        <section key={m} className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">{lang === "en" ? MUSCLE_NAME[m] : muscles[m]}</h2>
          <LinkGrid
            items={pairs.map((p) => {
              const x = vsFacts(p);
              return { href: pathIn(lang, p), title: fill(t.h1, { a: w.name(x.a), b: w.low(w.name(x.b)) }) };
            })}
          />
        </section>
      ))}
    </SitePage>
  );
}

/** The comparisons a lift is in, as a section for its own page (English or translated). */
export function VsLinks({ lang, id }: { lang: SiteLang; id: string }) {
  const pairs = vsFor(id);
  if (!pairs.length) return null;
  const t = VS_TEXT[lang];
  const w = wordsFor(lang);
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold tracking-tight">{t.compare}</h2>
      <LinkGrid
        items={pairs.map((p) => {
          const x = vsFacts(p);
          return { href: pathIn(lang, p), title: fill(t.h1, { a: w.name(x.a), b: w.low(w.name(x.b)) }) };
        })}
      />
    </section>
  );
}
