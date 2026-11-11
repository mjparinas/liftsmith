// The frame for the site's plain text pages (terms, help, contact, pricing, what's new, status, about,
// accessibility): the usual header, footer and calls to action (SitePage), breadcrumbs, a title, an intro line
// and sections with readable prose.
import type { ReactNode } from "react";

import type { SiteLang } from "@/lib/siteLang";

import { Crumbs, SitePage, type Crumb } from "./SiteChrome";

export function InfoPage({
  kind,
  title,
  intro,
  updated,
  wide,
  children,
  lang,
  path,
  crumbs = [],
}: {
  /** Names the page for the sticky bar's data-cta (sticky-<kind>). */
  kind: string;
  title: string;
  intro?: ReactNode;
  updated?: string;
  wide?: boolean;
  children: ReactNode;
  /** For a page in every language (src/lib/siteLang.ts): its language and English path. */
  lang?: SiteLang;
  path?: string;
  /** Crumbs between the home page and this one, e.g. Help on a help topic. */
  crumbs?: Crumb[];
}) {
  return (
    <SitePage kind={kind} lang={lang} path={path}>
      <Crumbs items={[...crumbs, { label: title }]} lang={lang} />
      <article className={`mx-auto mt-6 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted">Last updated {updated}</p>}
        {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
        <div className="mt-8 flex flex-col gap-10">{children}</div>
      </article>
    </SitePage>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20" aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed [&_a]:text-accent [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}
