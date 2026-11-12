import type { Metadata } from "next";

import { coachesMetadata, CoachesView } from "@/components/site/CoachesView";

// The page for coaches in this language (src/lib/siteLang.ts). English is src/app/coaches/page.tsx.

export const metadata: Metadata = coachesMetadata("ja");

export default function Coaches() {
  return <CoachesView lang="ja" />;
}
