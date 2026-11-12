import type { Metadata } from "next";

import { LocalExerciseView, localMeta, localParams } from "@/components/site/LocalExerciseView";

export const dynamicParams = false;
export const generateStaticParams = localParams("it");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localMeta("it", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalExerciseView lang="it" slug={(await params).slug} />;
}
