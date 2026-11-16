import type { Metadata } from "next";

import { muscleMeta, muscleParams, MuscleView } from "@/components/site/MuscleView";

export const dynamicParams = false;
export const generateStaticParams = muscleParams;

type Props = { params: Promise<{ muscle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return muscleMeta("ko", (await params).muscle);
}

export default async function Page({ params }: Props) {
  return <MuscleView lang="ko" slug={(await params).muscle} />;
}
