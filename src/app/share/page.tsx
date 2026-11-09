import type { Metadata } from "next";
import { SharedProfile } from "@/components/dashboard/Share";

// A friend's training summary. The data is in the link's #fragment, so this page is the same for
// everyone and never indexed.
export const metadata: Metadata = { title: "Training summary", robots: { index: false, follow: false } };

export default function SharePage() {
  return <SharedProfile />;
}
