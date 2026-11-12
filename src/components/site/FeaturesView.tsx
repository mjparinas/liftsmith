// The public features page (/features/): the newest features, every feature by group, and the table of what
// Liftsmith works with. Everything comes from src/content/features.ts.
import Link from "next/link";

import {
  ALL_FEATURES,
  CONNECTION_GROUPS,
  FEATURE_GROUPS,
  newestFeatures,
  SUPPORT_LABEL,
  TIER_LABEL,
  WHERE_LABEL,
  type SiteFeature,
  type Support,
  type Tier,
} from "@/content/features";
import { landingPath, LANDINGS } from "@/content/landings";
import { BRAND } from "@/lib/brand";
import { dayLabel } from "@/lib/whatsNew";

import { Crumbs, CtaBanner, CtaInline } from "./SiteChrome";

// Each plan's chip is a tint from the palette; the label says the plan in words.
const TINT: Record<Tier, string> = {
  free: "var(--color-mint)",
  both: "var(--color-cyan)",
  pro: "var(--color-violet)",
  lab: "var(--color-ember)",
};

function TierChip({ tier }: { tier: Tier }) {
  return (
    <span
      className="inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ink"
      style={{
        borderColor: `color-mix(in srgb, ${TINT[tier]} 50%, transparent)`,
        background: `color-mix(in srgb, ${TINT[tier]} 16%, transparent)`,
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

const anchor = (f: SiteFeature) => `f-${f.id}`;

function FeatureCard({ f }: { f: SiteFeature }) {
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
        <TierChip tier={f.tier} />
      </div>
      <p className="mt-2 leading-relaxed text-muted">{f.body}</p>
      {f.proPart && <p className="mt-2 text-sm text-muted">{f.proPart}</p>}
      <p className="mt-3 text-xs text-muted">
        {WHERE_LABEL[f.where ?? "all"]}
        {f.note && <span className="block">{f.note}</span>}
      </p>
    </li>
  );
}

const MARK: Record<Support, string> = { yes: "✓", no: "–", soon: "…", chrome: "✓", health: "✓" };

function SupportCell({ s }: { s: Support }) {
  return (
    <td
      className={`px-2 py-3 text-sm md:px-3 md:whitespace-nowrap ${s === "no" ? "text-muted" : s === "soon" ? "text-muted italic" : "text-ink"}`}
    >
      <span aria-hidden className="mr-1">
        {MARK[s]}
      </span>
      {SUPPORT_LABEL[s]}
    </td>
  );
}

export function FeaturesView() {
  const newest = newestFeatures();
  return (
    <>
      <Crumbs items={[{ label: "Features" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Every {BRAND.name} feature</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        All {ALL_FEATURES.length} features, which are free, what works with what, and what&apos;s new. Most of it is free; see{" "}
        <Link href="/pricing/" className="text-accent underline underline-offset-2">
          pricing
        </Link>{" "}
        for what Pro adds.
      </p>

      <nav aria-label="On this page" className="mt-6">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm whitespace-nowrap md:mx-0 md:flex-wrap md:px-0">
          {[{ id: "newest", title: "Newest" }, { id: "works-with", title: "Works with" }, ...FEATURE_GROUPS].map((g) => (
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
          Newest features
        </h2>
        <p className="mt-2 text-muted">
          Added lately, newest first. Every change, fixes included, is on{" "}
          <Link href="/whats-new/" className="text-accent underline underline-offset-2">
            What&apos;s new
          </Link>
          .
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {newest.map(({ day, features }) => (
            <div key={day} className="card p-5">
              <h3 className="text-sm text-muted">
                <time dateTime={day}>{dayLabel(day)}</time>
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {features.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2">
                    <a href={`#${anchor(f)}`} className="font-semibold hover:text-accent hover:underline">
                      {f.name}
                    </a>
                    <TierChip tier={f.tier} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {FEATURE_GROUPS.map((g, i) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="mt-14 scroll-mt-20">
          <h2 id={`${g.id}-h`} className="text-2xl font-bold tracking-tight md:text-3xl">
            {g.title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{g.intro}</p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {g.features.map((f) => (
              <FeatureCard key={f.id} f={f} />
            ))}
          </ul>
          {i === 2 && (
            <CtaInline
              cta="features-mid"
              title="See it for yourself"
              body="Free, with no account. Your first workout is planned in under a minute."
              button="Start free"
            />
          )}
        </section>
      ))}

      <section id="works-with" aria-labelledby="works-with-h" className="mt-14 scroll-mt-20">
        <h2 id="works-with-h" className="text-2xl font-bold tracking-tight md:text-3xl">
          What {BRAND.name} works with
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Apps, watches and devices, and where each one works. &ldquo;Through Health&rdquo; means it reaches {BRAND.name} through Health
          Connect on Android or Apple Health on iPhone. &ldquo;Chrome&rdquo; means the web app in Chrome, which has Web Bluetooth.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line" role="region" aria-label="Compatibility table" tabIndex={0}>
          <table className="w-full md:min-w-[44rem] border-collapse text-left">
            <thead className="bg-surface text-sm">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Connection
                </th>
                <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">
                  What it does
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Android
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  iPhone
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Web
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Plan
                </th>
              </tr>
            </thead>
            {CONNECTION_GROUPS.map((g) => (
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
                {g.rows.map((c) => (
                  <tr key={c.id} id={`c-${c.id}`} className="border-t border-line/60 align-top">
                    <th scope="row" className="px-3 py-3 font-semibold">
                      {c.name}
                      <span className="mt-1 block text-sm font-normal text-muted md:hidden">{c.does}</span>
                      {c.link && (
                        <Link href={c.link.href} className="mt-1 block text-sm font-normal text-accent underline underline-offset-2">
                          {c.link.label}
                        </Link>
                      )}
                    </th>
                    <td className="hidden px-3 py-3 text-sm text-muted md:table-cell">{c.does}</td>
                    <SupportCell s={c.android} />
                    <SupportCell s={c.ios} />
                    <SupportCell s={c.web} />
                    <td className="px-3 py-3">
                      <TierChip tier={c.tier} />
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          &ldquo;Coming soon&rdquo; means it&apos;s built and waiting on the other company&apos;s approval or store listing. Fitness
          services connect through a free {BRAND.name} account. Labs are experiments in Pro you switch on in Settings › Labs. Product names
          are trademarks of their owners.
        </p>
      </section>

      <p className="mt-10 text-muted">
        One page per feature:{" "}
        {LANDINGS.filter((l) => l.group === "features").map((l, i, all) => (
          <span key={l.slug}>
            <Link href={landingPath(l)} className="text-accent underline underline-offset-2">
              {l.name}
            </Link>
            {i < all.length - 1 ? ", " : ""}
          </span>
        ))}
        . And{" "}
        <Link href="/apps/" className="text-accent underline underline-offset-2">
          what {BRAND.name} is built for
        </Link>
        .
      </p>

      <CtaBanner
        cta="features-index-end"
        title="Start free, no account"
        body="Your first workout is planned in under a minute. No ads, ever."
      />
    </>
  );
}
