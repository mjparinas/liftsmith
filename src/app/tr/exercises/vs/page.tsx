import type { Metadata } from "next";

import { vsIndexMeta, VsIndexView } from "@/components/site/VsView";

export const metadata: Metadata = vsIndexMeta("tr");

export default function Page() {
  return <VsIndexView lang="tr" />;
}
