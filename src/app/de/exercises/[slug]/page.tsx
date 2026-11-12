import type { Metadata } from "next";

import { LocalExerciseView, localMeta, localParams } from "@/components/site/LocalExerciseView";

export const dynamicParams = false;
export const generateStaticParams = localParams("de");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return localMeta("de", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <LocalExerciseView lang="de" slug={(await params).slug} />;
}
