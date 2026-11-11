import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingView, relatedLandings } from "@/components/site/LandingView";
import { SitePage } from "@/components/site/SiteChrome";
import { LANDING_BY_PATH, LANDINGS } from "@/content/landings";
import { pageMeta } from "@/lib/pageMeta";

export const dynamicParams = false;
export const generateStaticParams = () => LANDINGS.filter((l) => l.group === "apps").map((l) => ({ slug: l.slug }));

type Props = { params: Promise<{ slug: string }> };

const find = async (params: Props["params"]) => LANDING_BY_PATH.get(`/apps/${(await params).slug}/`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await find(params);
  return l ? pageMeta({ title: l.title, description: l.description, path: `/apps/${l.slug}/` }) : {};
}

export default async function Page({ params }: Props) {
  const l = await find(params);
  if (!l) notFound();
  return (
    <SitePage kind="apps" sticky={l.mid.title}>
      <LandingView l={l} related={relatedLandings(l, LANDINGS)} />
    </SitePage>
  );
}
