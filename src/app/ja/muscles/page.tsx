import type { Metadata } from "next";

import { musclesIndexMeta, MusclesIndexView } from "@/components/site/MuscleView";

export const metadata: Metadata = musclesIndexMeta("ja");

export default function Page() {
  return <MusclesIndexView lang="ja" />;
}
