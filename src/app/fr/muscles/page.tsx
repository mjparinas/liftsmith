import type { Metadata } from "next";

import { musclesIndexMeta, MusclesIndexView } from "@/components/site/MuscleView";

export const metadata: Metadata = musclesIndexMeta("fr");

export default function Page() {
  return <MusclesIndexView lang="fr" />;
}
