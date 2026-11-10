// The public trust centre (/trust/), like Gradelings': one short line per control, each with a shield. Every "live"
// line must be true of what ships today (the apps and www.getliftsmith.com); anything still being built is "progress"
// until it ships, and anything we don't do is left out. Keep it in step with /privacy/, /delete-account/,
// docs/PRIVACY_LABELS.md and the Security section of AGENTS.md. Decision: docs/decisions/trust-centre.md.
// A server component with no language catalogue imports (sitePerf.test.ts): the website is English only.
import Link from "next/link";

import { BRAND } from "@/lib/brand";
import { CONTACT_EMAIL } from "@/lib/site";

/** The day this page's claims were last checked against the code. */
export const TRUST_UPDATED = "10 November 2026";

export interface Control {
  title: string;
  note: string;
  status?: "live" | "progress";
}

export const TRUST_GROUPS: { title: string; controls: Control[] }[] = [
  {
    title: "Privacy",
    controls: [
      { title: "No ads, ever", note: "We never sell or share your data with advertisers or data brokers." },
      { title: "Your training stays on your phone", note: "The app works offline. Nothing leaves it unless you sign in to sync." },
      { title: "Accounts are optional", note: "Sign in only if you want a backup and your other devices." },
      { title: "Usage stats you control", note: "No advertising id. Off by default in the EU and UK, off anytime in Settings." },
      { title: "No cookies on this website", note: "Visits are counted without cookies, and Global Privacy Control turns it off." },
      { title: "Delete anytime", note: "Your account and everything synced to it, in a few taps." },
    ],
  },
  {
    title: "Health data",
    controls: [
      { title: "Only what you allow", note: "Health Connect and Apple Health readings, each with your permission." },
      { title: "Never in stats or ads", note: "Health readings, weights and reps are never part of usage stats." },
      { title: "Limited Use", note: "Follows Health Connect's Limited Use rules. Never read by people." },
      { title: "The camera stays on your phone", note: "Rep counting is worked out on the device. Nothing is recorded." },
      { title: "Kept out of phone backups", note: "App data skips cloud and computer backups. Sign-in or a backup file moves it." },
    ],
  },
  {
    title: "Accounts",
    controls: [
      { title: "No passwords to leak", note: "Sign in with Google, Apple, or a code we email you." },
      { title: "Secure sessions", note: "Random tokens. The server keeps only a hash of each one." },
      { title: "Sign-in limits", note: "Five tries per email code, and repeated sign-ins are slowed down." },
      { title: "Yours alone", note: "Synced data only comes back to your devices. Progress photos never upload." },
    ],
  },
  {
    title: "Payments",
    controls: [
      { title: "Store checkout", note: "Google Play or the App Store take payment. We never see your card." },
      { title: "Receipts checked for us", note: "RevenueCat verifies them and never gets your name, email or workouts." },
      { title: "Verified subscription events", note: "Store events are checked with a shared secret before we act." },
    ],
  },
  {
    title: "Infrastructure",
    controls: [
      { title: "HTTPS everywhere", note: "With HSTS, so connections are always encrypted." },
      { title: "Security headers", note: "No framing, no sniffing. Only the camera and Bluetooth are allowed." },
      { title: "Strict script policy", note: "Each website page runs only the scripts it lists." },
      { title: "Our own code, not a CDN", note: "Libraries and models are served by us. No trackers or ad scripts." },
      { title: "Rate limits on every public route", note: "Kept in the database, so bursts can't get around them." },
      { title: "Uptime monitoring", note: "The site and its database are checked from outside, around the clock." },
    ],
  },
  {
    title: "Email and AI",
    controls: [
      { title: "Signed email (SPF and DKIM)", note: "Mail from getliftsmith.com can be checked as really ours." },
      { title: "Nothing until you confirm", note: "Reminder emails need a confirmed address, with one-click unsubscribe." },
      { title: "AI drafts, human replies", note: "A person reads and sends every reply to your email." },
    ],
  },
  {
    title: "Operations",
    controls: [
      { title: "Locked-down admin access", note: "Named staff accounts, two-step sign-in, every change logged." },
      { title: "No workouts for staff", note: "The admin panel shows counts, never your workouts or health readings." },
      { title: "Tested on every change", note: "Automated tests, accessibility checks and a dependency audit." },
      { title: "Security review", note: "November 2026, with fixes for what it found." },
    ],
  },
];

function Shield({ status }: { status: "live" | "progress" }) {
  const live = status === "live";
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-6 w-6 shrink-0 ${live ? "text-good" : "text-warn"}`}>
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
      {live ? (
        <path
          fill="none"
          stroke="var(--color-bg)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.5 12 2.4 2.4 4.6-4.8"
        />
      ) : (
        <path fill="none" stroke="var(--color-bg)" strokeWidth="2.2" strokeLinecap="round" d="M12 7.5V12l2.5 2" />
      )}
    </svg>
  );
}

function ControlRow({ control }: { control: Control }) {
  const status = control.status ?? "live";
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Shield status={status} />
      <div className="min-w-0 flex-1">
        <p className="leading-snug font-semibold">
          {control.title}
          {status === "progress" && (
            <span className="ml-2 rounded-full border border-line px-2 py-0.5 align-middle text-xs font-semibold text-warn">
              In progress
            </span>
          )}
        </p>
        <p className="text-sm text-muted">{control.note}</p>
      </div>
    </li>
  );
}

export function TrustCentre() {
  return (
    <article>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">Trust centre</h1>
      <p className="mt-2 text-sm text-muted">Last checked {TRUST_UPDATED}</p>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        How {BRAND.name} keeps your training and health data safe, in plain words. The details are in our{" "}
        <Link className="text-accent underline" href="/privacy/">
          privacy policy
        </Link>
        , and how to delete your data is on{" "}
        <Link className="text-accent underline" href="/delete-account/">
          Delete your account
        </Link>
        .
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TRUST_GROUPS.map((group) => (
          <section key={group.title} className="card p-4" aria-labelledby={`trust-${group.title}`}>
            <h2 id={`trust-${group.title}`} className="text-xl font-bold">
              {group.title}
            </h2>
            <ul className="mt-1 divide-y divide-line">
              {group.controls.map((c) => (
                <ControlRow key={c.title} control={c} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-8 max-w-2xl">
        <h2 className="text-xl font-bold">Report a security problem</h2>
        <p className="mt-1">
          Email{" "}
          <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . A person reads every report. See also our{" "}
          <a className="text-accent underline" href="/.well-known/security.txt">
            security.txt
          </a>
          .
        </p>
      </section>
    </article>
  );
}
