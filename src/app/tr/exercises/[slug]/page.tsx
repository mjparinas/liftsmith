import type { Metadata } from "next";

import { LocalExerciseView, localMeta, localParams } from "@/components/site/LocalExerciseView";

export const dynamicParams = false;
export const generateStaticParams = localParams("tr");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localMeta("tr", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalExerciseView lang="tr" slug={(await params).slug} />;
}
