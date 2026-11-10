import type { Metadata } from "next";

import { Crumbs, CtaBanner, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { articlePath, articlesOf } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Training guides: reps in reserve, deloads, progressive overload",
  description:
    "Plain-words guides to the ideas behind good strength training: how hard each set should be, when to take a lighter week, and how to keep getting stronger.",
  alternates: { canonical: "/guides/" },
};

export default function GuidesIndex() {
  return (
    <SitePage kind="guide-index">
      <Crumbs items={[{ label: "Guides" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Training guides</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        The few ideas that make strength training work, explained in plain words. {BRAND.name} runs all of them for you.
      </p>
      <LinkGrid items={articlesOf("guide").map((g) => ({ href: articlePath(g), title: g.title, body: g.description, meta: g.tag }))} />
      <h2 className="mt-12 text-2xl font-bold tracking-tight">From the blog</h2>
      <LinkGrid
        items={articlesOf("blog")
          .slice(0, 6)
          .map((g) => ({ href: articlePath(g), title: g.title, meta: g.tag }))}
      />
      <CtaBanner
        cta="guide-index-end"
        title="Let the app do the thinking"
        body={`${BRAND.name} sets effort targets for every week, schedules deloads and adds weight when you've earned it.`}
      />
    </SitePage>
  );
}
