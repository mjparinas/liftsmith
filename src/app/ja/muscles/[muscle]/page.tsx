import type { Metadata } from "next";

import { muscleMeta, muscleParams, MuscleView } from "@/components/site/MuscleView";

export const dynamicParams = false;
export const generateStaticParams = muscleParams;

type Props = { params: Promise<{ muscle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return muscleMeta("ja", (await params).muscle);
}

export default async function Page({ params }: Props) {
  return <MuscleView lang="ja" slug={(await params).muscle} />;
}
