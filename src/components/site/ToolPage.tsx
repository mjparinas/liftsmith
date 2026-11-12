// The frame every free tool page shares: breadcrumbs, title, the calculator, a call to action, the questions
// (also as FAQPage data), further reading and the end banner, with WebApplication data for the tool.
import Link from "next/link";
import type { ReactNode } from "react";

import { BRAND } from "@/lib/brand";
import { embedFor } from "@/lib/embeds";
import { SITE_URL } from "@/lib/site";
import { localPath, type SiteLang } from "@/lib/siteLang";
import type { ToolFrameText } from "@/locales/site/tools/types";

import { EmbedCode } from "./EmbedCode";
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
  /** The page's language; a translated page also passes its frame's words. */
  lang?: SiteLang;
  frame?: ToolFrameText;
  /** Set on a tool that has a page in every language: adds the language switcher. */
  translated?: boolean;
}

const FRAME_EN: ToolFrameText = { tools: "Tools", questions: "Questions", more: "More:", and: " and ", englishLinks: "" };

export function ToolPage(p: ToolPageProps) {
  const short = p.slug.replace(/-calculator$/, "");
  const lang = p.lang ?? "en";
  const f = p.frame ?? FRAME_EN;
  // The embed code and the frame it makes are English; translated pages leave it out.
  const embed = lang === "en" ? embedFor(p.slug) : undefined;
  const path = `/tools/${p.slug}/`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      ...(lang === "en" ? {} : { inLanguage: lang }),
      name: lang === "en" ? `${BRAND.name} ${p.name.toLowerCase()}` : p.name,
      url: `${SITE_URL}${localPath(lang, path)}`,
      applicationCategory: "HealthApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      ...(lang === "en" ? {} : { inLanguage: lang }),
      mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
  return (
    <SitePage kind="tool" sticky={p.sticky} lang={lang} path={p.translated ? path : undefined}>
      <JsonLd data={jsonLd} />
      <Crumbs lang={lang} items={[{ href: "/tools/", label: f.tools }, { label: p.name }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{p.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{p.intro}</p>
      <div className="mt-8">{p.children}</div>
      <CtaInline cta={`tool-${short}-mid`} title={p.mid.title} body={p.mid.body} button={p.mid.button} />
      {p.more ? <div className="mt-10 max-w-3xl space-y-4 leading-relaxed">{p.more}</div> : null}
      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">{f.questions}</h2>
        <dl className="mt-4 space-y-5">
          {p.faq.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-muted">{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-muted">
          {f.more}{" "}
          {p.reading.map((r, i) => (
            <span key={r.href}>
              {i > 0 ? (i === p.reading.length - 1 ? f.and : lang === "ja" ? "、" : ", ") : null}
              <Link href={r.href} className="text-accent underline underline-offset-2">
                {r.label}
              </Link>
            </span>
          ))}
          {lang === "ja" ? "" : "."}
        </p>
        {f.englishLinks ? <p className="mt-2 text-xs text-muted">{f.englishLinks}</p> : null}
      </section>
      {embed ? <EmbedCode embed={embed} /> : null}
      <CtaBanner cta={`tool-${short}-end`} lang={lang} title={p.end.title} body={p.end.body} />
    </SitePage>
  );
}
