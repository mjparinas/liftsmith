import type { Metadata } from "next";

import { homeMetadata, HomeView } from "@/components/site/HomeView";

// The English home page. The other languages are at /es/, /fr/… (src/app/[lang]/page.tsx); the page itself is HomeView.

export const metadata: Metadata = homeMetadata("en");

export default function Home() {
  return <HomeView lang="en" />;
}
