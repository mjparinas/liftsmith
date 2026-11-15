import type { Metadata } from "next";

import { vsMeta, vsParams, VsView } from "@/components/site/VsView";

export const dynamicParams = false;
export const generateStaticParams = vsParams;

type Props = { params: Promise<{ pair: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return vsMeta("de", (await params).pair);
}

export default async function Page({ params }: Props) {
  return <VsView lang="de" slug={(await params).pair} />;
}
