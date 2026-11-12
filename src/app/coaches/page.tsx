import type { Metadata } from "next";

import { coachesMetadata, CoachesView } from "@/components/site/CoachesView";

// The English page for coaches. The other languages are at /es/coaches/ and friends; the page itself is CoachesView.

export const metadata: Metadata = coachesMetadata("en");

export default function Coaches() {
  return <CoachesView lang="en" />;
}
