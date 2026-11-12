import type { Metadata } from "next";

import { LocalExerciseView, localMeta, localParams } from "@/components/site/LocalExerciseView";

export const dynamicParams = false;
export const generateStaticParams = localParams("ja");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localMeta("ja", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalExerciseView lang="ja" slug={(await params).slug} />;
}
