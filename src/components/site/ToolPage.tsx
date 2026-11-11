// The frame every free tool page shares: breadcrumbs, title, the calculator, a call to action, the questions
// (also as FAQPage data), further reading and the end banner, with WebApplication data for the tool.
import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";

import { Crumbs, CtaBanner, CtaInline, JsonLd, SitePage } from "./SiteChrome";

export interface ToolPageProps {
  /** The tool's slug under /tools/, also used in each call to action's data-cta. */
  slug: string;
  /** The short name: "Warm-up calculator". */
  name: string;
  intro: ReactNode;
  sticky: string;
  children: ReactNode;
  mid: { title: string; body: string; button: string };
  end: { title: string; body: string };
  faq: [string, string][];
  /** Written explanation under the calculator: how it works, a table and so on. */
  more?: ReactNode;
  reading: { href: string; label: string }[];
}

export function ToolPage(p: ToolPageProps) {
  const short = p.slug.replace(/-calculator$/, "");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${BRAND.name} ${p.name.toLowerCase()}`,
      url: `${SITE_URL}/tools/${p.slug}/`,
      applicationCategory: "HealthApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <SitePage kind="tool" sticky={p.sticky}>
      <JsonLd data={jsonLd} />
      <Crumbs items={[{ href: "/tools/", label: "Tools" }, { label: p.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{p.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{p.intro}</p>
      <div className="mt-8">{p.children}</div>
      <CtaInline cta={`tool-${short}-mid`} title={p.mid.title} body={p.mid.body} button={p.mid.button} />
      {p.more ? <div className="mt-10 max-w-3xl space-y-4 leading-relaxed">{p.more}</div> : null}
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
        <dl className="mt-4 space-y-5">
          {p.faq.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-muted">
          More:{" "}
          {p.reading.map((r, i) => (
            <span key={r.href}>
              {i > 0 ? (i === p.reading.length - 1 ? " and " : ", ") : null}
              <Link href={r.href} className="text-accent underline underline-offset-2">
                {r.label}
              </Link>
            </span>
          ))}
          .
        </p>
      </section>
      <CtaBanner cta={`tool-${short}-end`} title={p.end.title} body={p.end.body} />
    </SitePage>
  );
}
