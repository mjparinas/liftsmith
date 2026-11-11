// One landing or feature page (src/content/landings.ts): title and intro beside a real screenshot, the
// sections, a call to action, the questions (FAQPage data) and further reading, with the usual calls to action.
import Link from "next/link";

import { landingPath, type Landing } from "@/content/landings";
import { BRAND } from "@/lib/brand";
import { ogImage } from "@/lib/ogImages";
import { absolute } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

import { rich } from "./ArticleView";
import { Screenshot } from "./Screenshot";
import { Crumbs, CtaBanner, CtaButton, CtaInline, JsonLd, LinkGrid } from "./SiteChrome";

export const GROUP_LABEL = { apps: "Apps", features: "Features" } as const;

export function LandingView({ l, related }: { l: Landing; related: Landing[] }) {
  const path = landingPath(l);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: l.h1,
      description: l.description,
      url: absolute(path),
      primaryImageOfPage: absolute(ogImage(path)),
      about: {
        "@type": "MobileApplication",
        name: BRAND.name,
        operatingSystem: "Android, iOS, Web",
        applicationCategory: "HealthApplication",
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: l.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  const [first, ...rest] = l.sections;
  return (
    <article>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: `/${l.group}/`, label: GROUP_LABEL[l.group] }, { label: l.name }]} />
      <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">
            {l.plan === "Free" ? "Free" : l.plan === "Pro" ? "Pro" : "Free, with Pro extras"}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">{l.h1}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{rich(l.intro)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CtaButton cta={`${l.group}-top`}>Start free</CtaButton>
            <span className="text-sm text-muted">No account needed. No ads, ever.</span>
          </div>
        </div>
        <div className="mx-auto w-56 rounded-[2.2rem] border border-line bg-surface p-2 lg:w-full">
          <Screenshot
            src={`/screens/${l.screen}.webp`}
            alt={l.screenAlt}
            sizes="(min-width: 1024px) 300px, 224px"
            priority
            className="h-auto w-full rounded-[1.8rem]"
          />
        </div>
      </div>
      <div className="max-w-3xl">
        {first ? <Section s={first} /> : null}
        <CtaInline cta={`${l.group}-mid`} title={l.mid.title} body={l.mid.body} button={l.mid.button} />
        {rest.map((s) => (
          <Section key={s.h2} s={s} />
        ))}
        <section>
          <h2 className="mt-10 text-2xl font-bold tracking-tight">Questions</h2>
          <dl className="mt-4 space-y-5">
            {l.faq.map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1 text-muted">{rich(a)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <p className="mt-8 text-muted">
          Read more:{" "}
          {l.links.map((r, i) => (
            <span key={r.href}>
              {i > 0 ? (i === l.links.length - 1 ? " and " : ", ") : null}
              <Link href={r.href} className="text-accent underline underline-offset-2">
                {r.label}
              </Link>
            </span>
          ))}
          .
        </p>
      </div>
      <CtaBanner cta={`${l.group}-end`} title={l.end.title} body={l.end.body} />
      {related.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">More of {BRAND.name}</h2>
          <LinkGrid items={related.map((r) => ({ href: landingPath(r), title: r.name, body: r.description }))} />
        </section>
      ) : null}
    </article>
  );
}

function Section({ s }: { s: Landing["sections"][number] }) {
  return (
    <section>
      <h2 className="mt-10 text-2xl font-bold tracking-tight">{s.h2}</h2>
      {s.p.map((p, i) => (
        <p key={i} className="mt-4 leading-relaxed text-muted">
          {rich(p)}
        </p>
      ))}
      {s.ul ? (
        <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-muted">
          {s.ul.map((x, i) => (
            <li key={i}>{rich(x)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Three other pages of the same group, then the other group, for "More of Liftsmith". */
export function relatedLandings(l: Landing, all: readonly Landing[]): Landing[] {
  const same = all.filter((x) => x !== l && x.group === l.group);
  const other = all.filter((x) => x.group !== l.group);
  const start = all.indexOf(l);
  const pick = (list: Landing[], n: number) =>
    list
      .slice(start % Math.max(1, list.length))
      .concat(list)
      .slice(0, n);
  return [...pick(same, 2), ...pick(other, 1)];
}
