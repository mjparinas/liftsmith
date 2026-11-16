import type { Metadata } from "next";

import { localToolMeta, localToolParams, LocalToolView } from "@/components/site/LocalToolView";

export const dynamicParams = false;
export const generateStaticParams = localToolParams;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localToolMeta("tr", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalToolView lang="tr" slug={(await params).slug} />;
}
