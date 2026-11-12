import type { Metadata } from "next";

import { homeMetadata, HomeView } from "@/components/site/HomeView";

// The home page in this language (src/lib/siteLang.ts). English is src/app/page.tsx; the page itself is HomeView.

export const metadata: Metadata = homeMetadata("ja");

export default function Home() {
  return <HomeView lang="ja" />;
}
