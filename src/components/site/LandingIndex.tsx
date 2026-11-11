// The /apps/ and /features/ index pages: every landing page of one group, then a link to the other group.
import Link from "next/link";

import { landingPath, LANDINGS, type Landing } from "@/content/landings";

import { GROUP_LABEL } from "./LandingView";
import { Crumbs, CtaBanner, LinkGrid, SitePage } from "./SiteChrome";

export function LandingIndex({ group, h1, intro }: { group: Landing["group"]; h1: string; intro: string }) {
  const other = group === "apps" ? "features" : "apps";
  return (
    <SitePage kind={`${group}-index`}>
      <Crumbs items={[{ label: GROUP_LABEL[group] }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">{h1}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p>
      <LinkGrid
        items={LANDINGS.filter((l) => l.group === group).map((l) => ({ href: landingPath(l), title: l.name, body: l.description }))}
      />
      <p className="mt-8 text-muted">
        See also{" "}
        <Link href={`/${other}/`} className="text-accent underline underline-offset-2">
          {other === "apps" ? "what Liftsmith is built for" : "every feature, one page each"}
        </Link>{" "}
        and the{" "}
        <Link href="/tools/" className="text-accent underline underline-offset-2">
          free tools
        </Link>
        .
      </p>
      <CtaBanner
        cta={`${group}-index-end`}
        title="Start free, no account"
        body="Your first workout is planned in under a minute. No ads, ever."
      />
    </SitePage>
  );
}
