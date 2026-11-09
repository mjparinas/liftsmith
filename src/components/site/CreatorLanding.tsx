"use client";
// The page a creator's link opens (/c/<code>/). It saves the code for the web app on this site, sends Android
// installs through Play with the code as the install referrer, and on iPhone shows the code to type, because
// the App Store passes nothing per install (AGENTS.md "Marketing and growth", Platform deltas).
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BRAND } from "@/lib/brand";
import { codeFromUrl, CREATOR_TRIAL_DAYS, setCode } from "@/lib/creator";
import { APP_PATH } from "@/lib/site";
import { StoreBadges } from "./StoreBadges";

const noop = () => () => {};

export function CreatorLanding() {
  // undefined while the page is pre-rendered; the code (or null for none) in the browser.
  const code = useSyncExternalStore(noop, () => codeFromUrl(location.href), () => undefined);
  const [found, setFound] = useState<{ code: string; name: string | null; known: boolean } | null>(null);
  useEffect(() => {
    if (!code) return;
    // Saved for the web app on this site, unless the server says there's no such code (a mistyped link
    // shouldn't replace a good one). Offline or server down, it's saved and checked by the app later.
    // A code the visitor typed in the app before stays.
    const save = () => setCode(code, "link", false);
    fetch(`/api/creator/?code=${encodeURIComponent(code)}`)
      .then(async (r) => {
        if (r.status === 404) return setFound({ code, name: null, known: false });
        save();
        if (r.ok) {
          const j = (await r.json()) as { name?: string };
          setFound({ code, name: j.name ?? null, known: true });
        }
      })
      .catch(save);
  }, [code]);
  const hit = found && found.code === code ? found : null;
  const s = { code: code ?? null, name: hit?.name ?? null, known: code === null ? false : (hit?.known ?? null) };

  const days = CREATOR_TRIAL_DAYS;
  if (s.known === false)
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">That code isn&apos;t one we know</h1>
        <p className="mt-3 text-lg text-muted">{s.code ? <>Check the spelling of <code className="font-semibold text-ink">{s.code}</code> with the creator who shared it.</> : "This link is missing its code."} You can still try {BRAND.name} free.</p>
        <StoreBadges className="mt-6" place="creator-unknown" />
      </div>
    );

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Creator code {s.code}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">{s.name ? `${s.name} sent you a ${days}-day Pro trial` : `You've got a ${days}-day Pro trial`}</h1>
      <p className="mt-3 text-lg text-muted">{BRAND.name} plans every workout around your gym, your plates and how recovered you are. The usual trial is 14 days; this code makes it {days}. The free plan stays free after it.</p>
      {s.code && <StoreBadges className="mt-6" place="creator" code={s.code} />}
      <ol className="mt-8 space-y-3 text-base">
        <li className="card p-4"><span className="font-semibold">Android:</span> get it on Google Play from this page and the code comes with it.</li>
        <li className="card p-4"><span className="font-semibold">iPhone:</span> the App Store can&apos;t pass the code along, so type <code className="font-semibold">{s.code}</code> under &ldquo;Have a creator code?&rdquo; on the last setup step, or in Settings › Creator code.</li>
        <li className="card p-4"><span className="font-semibold">In your browser:</span> the code is saved. <Link href={APP_PATH} className="font-semibold text-accent underline" data-cta="open-app-creator">Open the web app →</Link></li>
      </ol>
      <p className="mt-6 text-sm text-muted">{s.name ?? "The creator"} earns a share of what {BRAND.name} makes if you subscribe. It costs you nothing extra, and they&apos;re asked to say so when they share it.</p>
    </div>
  );
}
