import type { Metadata } from "next";

import { challengesIndexMeta, ChallengesIndexView } from "@/components/site/ChallengeView";

export const metadata: Metadata = challengesIndexMeta("tr");

export default function Page() {
  return <ChallengesIndexView lang="tr" />;
}
