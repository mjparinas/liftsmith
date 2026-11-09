import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Your training", robots: { index: false, follow: false } };

export default function MePage() {
  return <Dashboard />;
}
