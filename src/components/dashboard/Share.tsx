"use client";
import { BRAND } from "@/lib/brand";
import { decodeShare, encodeShare, SHARE_DAYS, shareCard, shareLevel, type ShareCard } from "@/lib/dashboard";
import { weekOf, type Stats } from "@/lib/derive";
import { exerciseName } from "@/lib/game";
import { shareName } from "@/lib/achievements";
import { track } from "@/lib/analytics";
import type { AppEvent, Profile } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

// Sharing with friends, before accounts exist: the summary travels in the link's #fragment, which
// browsers never send to a server, so nobody but the people given the link can read it.

/** Names for trophy ids in links made before achievements. */
const TROPHY_NAME: Record<string, string> = {
  first: "First rep",
  ten: "Habit",
  fifty: "Lifer",
  "first-pr": "Personal best",
  "plate-ohp": "One-plate press",
  "plate-bench": "One-plate bench",
  "two-plate-bench": "Two-plate bench",
  "bw-bench": "Bodyweight bench",
  "three-plate-squat": "Three-plate squat",
  "four-plate-dead": "Four-plate deadlift",
  "ten-pullups": "Ten clean pull-ups",
  explorer: "Explorer",
  "streak-4": "Month strong",
  "volume-100k": "100 tonnes",
};

export function ShareView({ card }: { card: ShareCard }) {
  const lvl = shareLevel(card);
  const trained = new Set(card.d);
  // Twelve Monday-first weeks ending with the week the card was made; each cell holds its offset back
  // from that day, or null outside the 12-week window.
  const weeks = Array.from({ length: SHARE_DAYS / 7 + 1 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = new Date(weekOf(card.d0));
      day.setDate(day.getDate() + (w - SHARE_DAYS / 7) * 7 + d);
      const off = Math.round((card.d0 - day.getTime()) / 86400_000);
      return off >= 0 && off < SHARE_DAYS ? off : null;
    }),
  );
  return (
    <article className="card p-5" aria-label="Shared training summary">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{BRAND.name}</p>
      <h2 className="mt-1 text-2xl font-bold">{card.n ?? `A ${BRAND.name} lifter`}</h2>
      <p className="text-muted">Level {lvl.level} · {lvl.title}</p>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          ["Workouts", fmtNum(card.w)],
          ["Week streak", fmtNum(card.s)],
          ["Badges", fmtNum(card.t.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-raised p-3">
            <dt className="text-xs uppercase tracking-wider text-faint">{k}</dt>
            <dd className="num mt-1 text-2xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">Last 12 weeks</h3>
      <div className="mt-2 flex gap-1" role="img" aria-label={`Trained on ${trained.size} of the last ${SHARE_DAYS} days`}>
        {weeks.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((off, d) => <span key={d} className={`block h-3 w-3 rounded-[3px] ${off === null ? "" : trained.has(off) ? "bg-accent" : "bg-raised"}`} />)}
          </div>
        ))}
      </div>
      {card.l.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">Best lifts (estimated one-rep max)</h3>
          <ul className="mt-2 divide-y divide-line">
            {card.l.map(([id, kg]) => (
              <li key={id} className="flex justify-between py-2">
                <span>{exerciseName(id)}</span>
                <span className="num font-semibold">{fmtNum(Math.round(fromKg(kg, card.u)))} {card.u}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {card.t.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted">Badges</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {card.t.map((t) => <li key={t} className="rounded-full border border-line px-3 py-1 text-sm">{shareName(t) ?? TROPHY_NAME[t] ?? t}</li>)}
          </ul>
        </>
      )}
      <p className="mt-5 text-xs text-faint">Made {new Date(card.d0).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</p>
    </article>
  );
}

export function SharePanel({ events, stats, profile, now }: { events: AppEvent[]; stats: Stats; profile: Profile; now: number }) {
  const [withName, setWithName] = useState(false);
  const [note, setNote] = useState("");
  const card = useMemo(() => shareCard(events, stats, profile, now, { name: withName }), [events, stats, profile, now, withName]);
  const url = typeof location === "undefined" ? "" : `${location.origin}/share/#${encodeShare(card)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied.");
      track("feature", { name: "share_profile", detail: "copy" });
    } catch {
      setNote("Couldn't copy. Select the link and copy it.");
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: `My ${BRAND.name} training`, url });
      track("feature", { name: "share_profile", detail: "native" });
    } catch {
      // Closed the share sheet: nothing to do.
    }
  };
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <p className="text-muted">Send friends a link to your training summary: level, workouts, streak, badges, best lifts and the days you trained in the last 12 weeks.</p>
        <p className="mt-2 text-sm text-faint">It never includes heart rate, body weight, cycle data, your gyms or where they are. The summary lives in the link itself, so nothing is uploaded; anyone with the link can see it.</p>
        <label className="mt-4 flex items-center gap-3">
          <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" disabled={!profile.name.trim()} />
          <span>Show my name{profile.name.trim() ? ` (${profile.name.trim()})` : " (add one in the app's Settings)"}</span>
        </label>
        <label className="mt-4 block text-sm text-muted" htmlFor="share-url">Your link</label>
        <input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="card num mt-1 w-full px-3 py-2 text-sm" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void copy()} className="press rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink">Copy link</button>
          {typeof navigator !== "undefined" && "share" in navigator && <button type="button" onClick={() => void share()} className="press rounded-2xl border border-line bg-raised px-5 py-3">Share…</button>}
        </div>
        <p className="mt-2 min-h-5 text-sm text-good" aria-live="polite">{note}</p>
        <p className="mt-4 text-sm text-faint">Following friends and a shared feed come with accounts.</p>
      </div>
      <ShareView card={card} />
    </div>
  );
}

/** The /share/ page: reads the summary from the link. */
export function SharedProfile() {
  const hash = useSyncExternalStore(
    (on) => {
      window.addEventListener("hashchange", on);
      return () => window.removeEventListener("hashchange", on);
    },
    () => location.hash,
    () => null,
  );
  const card = useMemo(() => (hash === null ? undefined : decodeShare(hash.slice(1))), [hash]);
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      {card === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : card ? (
        <ShareView card={card} />
      ) : (
        <div className="card p-5">
          <h1 className="text-xl font-bold">This link doesn&apos;t work</h1>
          <p className="mt-2 text-muted">It may have been cut short when it was copied. Ask your friend to send it again.</p>
        </div>
      )}
      <Link href="/" className="press mt-6 block rounded-2xl bg-accent px-6 py-4 text-center text-lg font-semibold text-accent-ink">Try {BRAND.name}</Link>
    </main>
  );
}
