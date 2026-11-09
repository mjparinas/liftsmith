import type { Metadata } from "next";
import { App } from "@/components/app/App";

export const metadata: Metadata = { title: "App", robots: { index: false, follow: false } };

export default function AppPage() {
  return <App />;
}
