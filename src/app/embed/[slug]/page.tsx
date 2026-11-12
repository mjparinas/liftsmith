// A free calculator, bare, for other sites to show in an <iframe> (src/lib/embeds.ts). Kept out of search (the full
// tool page is the one to rank) and allowed in frames by next.config.ts. Nothing on it is stored, sent or signed in.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { OneRmCalculator } from "@/components/site/OneRmCalculator";
import { PlateCalculator } from "@/components/site/PlateCalculator";
import { BrandMark } from "@/components/site/SiteChrome";
import { WarmupCalculator } from "@/components/site/WarmupCalculator";
import { BRAND } from "@/lib/brand";
import { embedFor, EMBEDS, toolPath } from "@/lib/embeds";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => EMBEDS.map((e) => ({ slug: e.slug }));

const CALCULATORS: Record<string, ReactNode> = {
  "plate-calculator": <PlateCalculator />,
  "one-rep-max-calculator": <OneRmCalculator />,
  "warm-up-calculator": <WarmupCalculator />,
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = embedFor((await params).slug);
  if (!e) return {};
  return {
    title: { absolute: `${e.name} | ${BRAND.name}` },
    robots: { index: false, follow: true },
    alternates: { canonical: toolPath(e) },
  };
}

export default async function EmbedPage({ params }: Props) {
  const e = embedFor((await params).slug);
  const calculator = e && CALCULATORS[e.slug];
  if (!e || !calculator) notFound();
  // Clicks from a frame open the full page in a new tab; utm_source tells the Traffic tab they came from an embed.
  const credit = `${SITE_URL}${toolPath(e)}?utm_source=embed&utm_medium=widget`;
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="sr-only">{e.name}</h1>
      {calculator}
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <BrandMark />
        <span>
          <a href={credit} target="_blank" rel="noopener" className="text-accent underline underline-offset-2" data-cta={`embed-${e.slug}`}>
            {e.name}
          </a>{" "}
          by {BRAND.name}, the free strength training app.
        </span>
      </p>
    </main>
  );
}
