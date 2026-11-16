import type { Metadata } from "next";

import { programsIndexMeta, ProgramsIndexView } from "@/components/site/ProgramView";

export const metadata: Metadata = programsIndexMeta("pl");

export default function Page() {
  return <ProgramsIndexView lang="pl" />;
}
