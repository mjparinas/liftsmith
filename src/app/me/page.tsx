import type { Metadata } from "next";

import { MeRedirect } from "@/components/MeRedirect";

export const metadata: Metadata = { title: "Your training", robots: { index: false, follow: false } };

// Retired: the dashboard moved into the app (docs/decisions/desktop-layout.md). Sends old links there.
export default function MePage() {
  return <MeRedirect />;
}
