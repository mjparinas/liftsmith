// The public features page (/features/ and /es/features/ …): the newest features, every feature by group, and the table
// of what Liftsmith works with. The structure comes from src/content/features.ts, the words from
// src/locales/site/features/ (English is features.ts itself).
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ALL_FEATURES, newestFeatures, type SiteFeature, type Support, type Tier } from "@/content/features";
import { landingPath, LANDINGS } from "@/content/landings";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { fill, localPath, type SiteLang } from "@/lib/siteLang";
import { connectionGroupsIn, featureGroupsIn, featuresText, type FeaturesText } from "@/locales/site/features";

import { Crumbs, CtaBanner, CtaInline, SitePage } from "./SiteChrome";

const PATH = "/features/";

export function featuresMetadata(lang: SiteLang): Metadata {
  const c = featuresText(lang).chrome;
  return pageMeta({ title: fill(c.title, { name: BRAND.name }), description: fill(c.description, { name: BRAND.name }), path: PATH, lang });
}

/** A line with one {key} link in it: the words either side, the link in the middle. */
function withLink(line: string, key: string, link: ReactNode) {
  const [before, after = ""] = line.split(`{${key}}`);
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

// Each plan's chip is a tint from the palette; the label says the plan in words.
const TINT: Record<Tier, string> = {
  free: "var(--color-mint)",
  both: "var(--color-cyan)",
  pro: "var(--color-violet)",
  lab: "var(--color-ember)",
};

function TierChip({ tier, t }: { tier: Tier; t: FeaturesText }) {
  return (
    <span
      className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ink"
      style={{
        borderColor: `color-mix(in srgb, ${TINT[tier]} 50%, transparent)`,
        background: `color-mix(in srgb, ${TINT[tier]} 16%, transparent)`,
      }}
    >
      {t.tiers[tier]}
    </span>
  );
}

const anchor = (f: SiteFeature) => `f-${f.id}`;

function FeatureCard({ f, t }: { f: SiteFeature; t: FeaturesText }) {
  return (
    <li id={anchor(f)} className="card scroll-mt-20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">
          {f.landing ? (
            <Link href={`/features/${f.landing}/`} className="hover:text-accent hover:underline">
              {f.name}
            </Link>
          ) : (
            f.name
          )}
        </h3>
        <TierChip tier={f.tier} t={t} />
      </div>
      <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
      {f.proPart && <p className="mt-2 text-sm text-muted">{f.proPart}</p>}
      <p className="mt-3 text-xs text-muted">
        {t.where[f.where ?? "all"]}
        {f.note && <span className="block">{f.note}</span>}
      </p>
    </li>
  );
}

const MARK: Record<Support, string> = { yes: "✓", no: "–", soon: "…", investigating: "…", chrome: "✓", health: "✓" };

function SupportCell({ s, t }: { s: Support; t: FeaturesText }) {
  return (
    <td
      className={`px-2 py-3 text-sm md:px-3 md:whitespace-nowrap ${s === "no" ? "text-muted" : s === "soon" || s === "investigating" ? "text-muted italic" : "text-ink"}`}
    >
      <span aria-hidden className="mr-1">
        {MARK[s]}
      </span>
      {t.support[s]}
    </td>
  );
}

/** The whole page in one language, header and footer included. */
export function FeaturesPage({ lang = "en" }: { lang?: SiteLang }) {
  return (
    <SitePage kind="features-index" lang={lang} path={PATH}>
      <FeaturesView lang={lang} />
    </SitePage>
  );
}

export function FeaturesView({ lang = "en" }: { lang?: SiteLang }) {
  const t = featuresText(lang);
  const c = t.chrome;
  const name = BRAND.name;
  const groups = featureGroupsIn(lang);
  const newest = newestFeatures(3, groups);
  const link = "text-accent underline underline-offset-2";
  return (
    <>
      <Crumbs items={[{ label: c.crumb }]} lang={lang} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{fill(c.h1, { name })}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        {withLink(
          fill(c.intro, { name, count: ALL_FEATURES.length }),
          "pricing",
          <Link href={localPath(lang, "/pricing/")} className={link}>
            {c.pricing}
          </Link>,
        )}
      </p>

      <nav aria-label={c.onThisPage} className="mt-6">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm whitespace-nowrap md:mx-0 md:flex-wrap md:px-0">
          {[{ id: "newest", title: c.newestNav }, { id: "works-with", title: c.worksWithNav }, ...groups].map((g) => (
            <li key={g.id}>
              <a
                href={`#${g.id}`}
                className="press inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 hover:border-accent/60"
              >
                {g.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="newest" aria-labelledby="newest-h" className="mt-12 scroll-mt-20">
        <h2 id="newest-h" className="text-2xl font-bold tracking-tight md:text-3xl">
          {c.newestH}
        </h2>
        <p className="mt-2 text-muted">
          {withLink(
            c.newestIntro,
            "whatsNew",
            <Link href="/whats-new/" className={link}>
              {c.whatsNew}
            </Link>,
          )}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newest.map(({ group, features }) => (
            <div key={group.id} className="card p-5">
              <h3 className="text-sm font-semibold text-muted">
                <a href={`#${group.id}`} className="hover:text-accent hover:underline">
                  {group.title}
                </a>
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {features.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2">
                    <a href={`#${anchor(f)}`} className="font-semibold hover:text-accent hover:underline">
                      {f.name}
                    </a>
                    <TierChip tier={f.tier} t={t} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {groups.map((g, i) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="mt-14 scroll-mt-20">
          <h2 id={`${g.id}-h`} className="text-2xl font-bold tracking-tight md:text-3xl">
            {g.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{g.intro}</p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {g.features.map((f) => (
              <FeatureCard key={f.id} f={f} t={t} />
            ))}
          </ul>
          {i === 2 && <CtaInline cta="features-mid" title={c.midTitle} body={c.midBody} button={c.midButton} />}
        </section>
      ))}

      <section id="works-with" aria-labelledby="works-with-h" className="mt-14 scroll-mt-20">
        <h2 id="works-with-h" className="text-2xl font-bold tracking-tight md:text-3xl">
          {fill(c.worksH, { name })}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{fill(c.worksIntro, { name })}</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line" role="region" aria-label={c.tableLabel} tabIndex={0}>
          <table className="w-full border-collapse text-left md:min-w-[44rem]">
            <thead className="bg-surface text-sm">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {c.cols.connection}
                </th>
                <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">
                  {c.cols.does}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {c.cols.android}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {c.cols.iphone}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {c.cols.web}
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {c.cols.plan}
                </th>
              </tr>
            </thead>
            {connectionGroupsIn(lang).map((g) => (
              <tbody key={g.id}>
                <tr className="border-t border-line">
                  <th
                    scope="colgroup"
                    colSpan={6}
                    className="bg-surface/50 px-3 pt-4 pb-2 text-xs font-bold tracking-wide text-muted uppercase"
                  >
                    {g.title}
                  </th>
                </tr>
                {g.rows.map((row) => (
                  <tr key={row.id} id={`c-${row.id}`} className="border-t border-line/60 align-top">
                    <th scope="row" className="px-3 py-3 font-semibold">
                      {row.name}
                      <span className="mt-1 block text-sm font-normal text-muted md:hidden">{row.does}</span>
                      {row.link && (
                        <Link href={row.link.href} className={`mt-1 block text-sm font-normal ${link}`}>
                          {row.link.label}
                        </Link>
                      )}
                    </th>
                    <td className="hidden px-3 py-3 text-sm text-muted md:table-cell">{row.does}</td>
                    <SupportCell s={row.android} t={t} />
                    <SupportCell s={row.ios} t={t} />
                    <SupportCell s={row.web} t={t} />
                    <td className="px-3 py-3">
                      <TierChip tier={row.tier} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">{fill(c.footnote, { name })}</p>
      </section>

      {/* The one-page-per-feature pages are English for now, so only the English page lists them. */}
      {lang === "en" && (
        <p className="mt-10 text-muted">
          One page per feature:{" "}
          {LANDINGS.filter((l) => l.group === "features").map((l, i, all) => (
            <span key={l.slug}>
              <Link href={landingPath(l)} className={link}>
                {l.name}
              </Link>
              {i < all.length - 1 ? ", " : ""}
            </span>
          ))}
          . And{" "}
          <Link href="/apps/" className={link}>
            what {name} is built for
          </Link>
          .
        </p>
      )}

      <CtaBanner cta="features-index-end" title={c.endTitle} body={c.endBody} lang={lang} />
    </>
  );
}
