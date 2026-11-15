import type { Metadata } from "next";

import { vsIndexMeta, VsIndexView } from "@/components/site/VsView";

export const metadata: Metadata = vsIndexMeta("ja");

export default function Page() {
  return <VsIndexView lang="ja" />;
}
