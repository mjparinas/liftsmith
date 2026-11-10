import type { Metadata } from "next";

import { Crumbs, CtaBanner, LinkGrid, SitePage } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { TOOL_PAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free tools for lifters",
  description: `Free calculators from ${BRAND.name}: plates per side, one-rep max and TDEE. No sign-up, nothing stored.`,
  alternates: { canonical: "/tools/" },
};

export default function ToolsIndex() {
  return (
    <SitePage kind="tools-index">
      <Crumbs items={[{ label: "Tools" }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Free tools for lifters</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        The same calculators the {BRAND.name} app runs on, free in your browser. No sign-up, and nothing you enter is stored or sent.
      </p>
      <LinkGrid items={TOOL_PAGES.map((t) => ({ href: t.path, title: t.name, body: t.blurb }))} />
      <CtaBanner
        cta="tools-index-end"
        title="Let the app do the maths for you"
        body={`In ${BRAND.name} these run on their own: plates drawn for every set, your max estimated from every set you log, and calories that follow your weigh-ins.`}
      />
    </SitePage>
  );
}
