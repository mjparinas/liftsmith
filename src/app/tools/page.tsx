import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Free tools for lifters",
  description: `Free calculators from ${BRAND.name}: TDEE and daily calories, with more on the way.`,
  alternates: { canonical: "/tools/" },
};

const TOOLS = [{ href: "/tools/tdee-calculator/", name: "TDEE calculator", blurb: "Calories a day to maintain, cut or bulk, with BMR, BMI and a protein range." }];

export default function ToolsIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <nav className="text-sm text-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-ink">{BRAND.name}</Link> › Tools</nav>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Tools</h1>
      <ul className="mt-6 space-y-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="press card block p-5 hover:border-accent/40">
              <span className="block text-lg font-semibold">{t.name}</span>
              <span className="block text-muted">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
