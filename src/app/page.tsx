import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { APP_PATH } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">{BRAND.name}</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">Workouts built around your gym, your recovery and your time.</h1>
      <p className="mt-4 text-lg text-muted">Pick how long you have. {BRAND.name} plans every set from the equipment and plates you own, progresses the weight for you, and shows exactly which plates to load.</p>
      <Link href={APP_PATH} className="press mt-8 inline-block rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-accent-ink">Build my workout</Link>
    </main>
  );
}
