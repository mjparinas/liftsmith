import type { Metadata } from "next";

import { challengeMeta, challengeParams, ChallengeView } from "@/components/site/ChallengeView";

export const dynamicParams = false;
export const generateStaticParams = challengeParams;

type Props = { params: Promise<{ challenge: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return challengeMeta("tr", (await params).challenge);
}

export default async function Page({ params }: Props) {
  return <ChallengeView lang="tr" slug={(await params).challenge} />;
}
