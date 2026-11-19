// The public trust centre (/trust/), like Gradelings': one short line per control, each with a shield. Every "live"
// line must be true of what ships today (the apps and www.getliftsmith.com); anything still being built is "progress"
// until it ships, and anything we don't do is left out. Keep it in step with /privacy/, /delete-account/,
// docs/PRIVACY_LABELS.md and the Security section of AGENTS.md. Decision: docs/decisions/trust-centre.md.
// A server component with no language catalogue imports (sitePerf.test.ts): the website is English only.
import Link from "next/link";

import { BRAND } from "@/lib/brand";
import { CONTACT_EMAIL } from "@/lib/site";

/** The day this page's claims were last checked against the code. */
export const TRUST_UPDATED = "19 November 2026";

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
      { title: "Accounts are optional", note: "Sign in only if you want a backup, your other devices, Friends or a coach." },
      { title: "Usage stats you control", note: "No advertising id. Off by default in the EU and UK, off anytime in Settings." },
      { title: "No cookies on this website", note: "Visits are counted without cookies, and Global Privacy Control turns it off." },
      { title: "Progress photos never upload", note: "They stay on your phone, and go in a backup file only if you switch it on." },
      { title: "Delete anytime", note: "Your account and everything synced to it, in a few taps." },
      { title: "Where synced data lives", note: "In our own Turso database, used by our servers on Vercel. Never sold or shared." },
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
      { title: "Connected apps on your terms", note: "Strava, Garmin, Oura and the rest: access kept encrypted, removed on disconnect." },
    ],
  },
  {
    title: "Accounts",
    controls: [
      { title: "No passwords to leak", note: "Sign in with Google, Apple, or a code we email you." },
      { title: "Secure sessions", note: "Random tokens. The server keeps only a hash of each one." },
      { title: "Sign-in limits", note: "Five tries per email code, and repeated sign-ins are slowed down." },
      { title: "Yours alone", note: "Synced data comes back only to your devices, and to a coach only if you share." },
      { title: "Signing out clears the phone", note: "What's waiting is saved to your account first, then the device is wiped." },
      { title: "Extra care for under-18s", note: "No public profile, body composition or promotional email before 18." },
    ],
  },
  {
    title: "Coaching",
    controls: [
      { title: "You choose what a coach sees", note: "Workouts always. Heart rate, notes, readiness, body, pain and cycle by switch." },
      { title: "Stop sharing anytime", note: "One tap cuts a coach's access at once. Unlinking deletes your chat." },
      { title: "Private chats", note: "Messages between you and your coach never show in the admin panel." },
    ],
  },
  {
    title: "Payments",
    controls: [
      { title: "Store checkout in the apps", note: "Google Play or the App Store take payment. We never see your card." },
      { title: "Stripe on the web", note: "Pro on the web is paid on Stripe's own checkout page. No card reaches us." },
      { title: "Coaches are paid directly", note: "Clients and programs are paid to the coach's own Stripe account." },
      { title: "Receipts checked for us", note: "RevenueCat verifies them and never gets your name, email or workouts." },
      { title: "Verified payment events", note: "Store and Stripe events are checked with a secret or signature first." },
      { title: "Coach payments kept apart", note: "Paying a coach can never unlock Pro or count as our revenue." },
    ],
  },
  {
    title: "Infrastructure",
    controls: [
      { title: "HTTPS everywhere", note: "With HSTS, so connections are always encrypted." },
      { title: "Security headers", note: "No framing, no sniffing. Only the camera, Bluetooth and location are allowed." },
      { title: "Strict script policy", note: "Each website page runs only the scripts it lists." },
      { title: "Our own code, not a CDN", note: "Served by us, except Google and Apple sign-in. No trackers or ad scripts." },
      { title: "Maps without tracking", note: "Gym maps come through our server, so Mapbox never sees you." },
      { title: "Rate limits on every public route", note: "Kept in the database, so bursts can't get around them." },
      { title: "Uptime monitoring", note: "The site and its database are checked from outside, around the clock." },
      { title: "Public status page", note: "A live check of the website, sign-in and syncing, at /status/." },
    ],
  },
  {
    title: "Email and AI",
    controls: [
      { title: "SPF, DKIM and DMARC", note: "Mail from getliftsmith.com is signed, and fakes are sent to spam." },
      { title: "Email you control", note: "Only to your verified address, a switch per kind, one-click unsubscribe." },
      { title: "AI drafts, human replies", note: "A person reads and sends every reply to your email." },
      { title: "AI suggests, staff decide", note: "Claude helps staff sort reports and gym pages. It never sees your training." },
    ],
  },
  {
    title: "Operations",
    controls: [
      { title: "Locked-down admin access", note: "Named staff accounts, two-step sign-in, every change logged." },
      { title: "No workouts for staff", note: "The admin panel shows counts, never your workouts or health readings." },
      { title: "Tested on every change", note: "Automated tests, accessibility checks and a dependency audit." },
      { title: "Security reviews", note: "November 2026, three rounds, with fixes for what each one found." },
    ],
  },
];

/** One outside service and what it gets, for "What leaves your phone". Each service gets something only while the lifter
 *  uses the feature named in `when`; anything not listed never leaves the phone (`STAYS`). */
export interface DataFlow {
  service: string;
  gets: string;
  when: string;
}

export const DATA_FLOWS: DataFlow[] = [
  {
    service: `${BRAND.name} (Vercel and Turso)`,
    gets: "Your training, settings and health readings, kept under your account",
    when: "Only once you sign in, to back up and sync your devices",
  },
  {
    service: `${BRAND.name} usage stats`,
    gets: "Which screens and features are used, under a random install id. No health data",
    when: "Unless you turn usage stats off (off by default in the EU and UK)",
  },
  { service: "Google or Apple", gets: "That you signed in to " + BRAND.name, when: "When you sign in with Google or Apple" },
  {
    service: "Google Play, App Store, RevenueCat",
    gets: "Your purchase and a random install id. Never your name, email or workouts",
    when: "When you start a trial or buy Pro in the app",
  },
  { service: "Stripe", gets: "Your card and email, on Stripe's own page", when: "When you buy Pro or a coach's program on the web" },
  {
    service: "Firebase and Apple push",
    gets: "Your device's push address and the text of each notification",
    when: "When you allow notifications for Friends, clubs or a coach",
  },
  { service: "Resend", gets: "Your email address and the emails we send you", when: "While Email me is on" },
  {
    service: "Strava",
    gets: "Each finished workout: its time and the sets, one line per exercise",
    when: "Only if you connect Strava and leave posting on",
  },
  {
    service: "Oura, WHOOP, Withings, Polar, Concept2, Garmin",
    gets: "Our requests for your readings or sessions, and nothing else",
    when: "Only if you connect that service",
  },
  { service: "Sonos", gets: "Play, pause, skip and volume for your speaker", when: "Only if you connect Sonos in Labs" },
  {
    service: "Anthropic (Claude)",
    gets: "An email you sent us, or a reported post, for one suggestion. Never your training",
    when: "When staff answer your email or review a report",
  },
  {
    service: "Mapbox",
    gets: "Nothing about you: map tiles come through our own server",
    when: "When a gym map is on screen",
  },
];

/** What never leaves the phone, whatever is switched on. */
export const STAYS = [
  "Progress photos",
  "The camera, for rep counting, bar speed and form checks",
  "Your voice, for voice set logging",
  "Bluetooth heart rate straps, scales and gym machines",
  "Health Connect and Apple Health, until you sign in to sync",
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
      <section className="mt-8" aria-labelledby="trust-flows">
        <h2 id="trust-flows" className="text-xl font-bold">
          What leaves your phone
        </h2>
        <p className="mt-1 max-w-2xl text-muted">
          Every outside service the app talks to, what it gets and when. Each one gets something only while you use that feature.
        </p>
        <div className="card mt-3 p-4">
          <div
            aria-hidden="true"
            className="hidden gap-4 pb-2 text-xs font-semibold tracking-wide text-muted uppercase md:grid md:grid-cols-[14rem_1fr_1fr]"
          >
            <span>Service</span>
            <span>What it gets</span>
            <span>When</span>
          </div>
          <ul className="divide-y divide-line">
            {DATA_FLOWS.map((f) => (
              <li key={f.service} className="grid gap-1 py-2.5 md:grid-cols-[14rem_1fr_1fr] md:gap-4">
                <h3 className="leading-snug font-semibold">{f.service}</h3>
                <p className="text-sm">
                  <span className="sr-only">What it gets: </span>
                  {f.gets}
                </p>
                <p className="text-sm text-muted">
                  <span className="sr-only">When: </span>
                  {f.when}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card mt-4 p-4">
          <h3 className="font-semibold">Never leaves your phone</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted">
            {STAYS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>
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
