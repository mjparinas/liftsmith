import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Delete your account",
  description: `How to delete your ${BRAND.name} account and its data, what's deleted, what's kept and for how long.`,
  path: "/delete-account/",
});

// Google Play's Data safety form links here ("Delete account URL"), so it names the app, puts the steps first and says what's
// deleted, kept and for how long. Keep in step with /privacy/, docs/PRIVACY_LABELS.md and DELETE /api/account/ (deleteAccount in
// src/server/accounts.ts). Decision: docs/decisions/accounts-and-sign-in.md.
const UPDATED = "10 November 2026";
const SUBJECT = encodeURIComponent(`Delete my ${BRAND.name} account`);

export default function DeleteAccount() {
  const mail = (
    <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}?subject=${SUBJECT}`}>
      {CONTACT_EMAIL}
    </a>
  );
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed">
        <h1 className="text-3xl font-bold">Delete your {BRAND.name} account</h1>
        <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>
        <p className="mt-4">
          {BRAND.name} (the strength training app on Google Play and the App Store) works without an account. If you signed in to back up
          and sync your training, you can delete that account and everything synced to it at any time, in the app or by email.
        </p>

        <h2 className="mt-8 text-xl font-semibold">In the app (takes a few seconds)</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>Open {BRAND.name} and go to the Settings tab.</li>
          <li>Tap Account and sync, at the top.</li>
          <li>Tap Delete my account, then Delete my account for good.</li>
        </ol>
        <p className="mt-2">
          No phone? Sign in at{" "}
          <a className="text-accent underline" href={`${SITE_URL}/app/`}>
            www.getliftsmith.com/app/
          </a>{" "}
          with the same Google, Apple or email sign-in, and follow the same steps. The account is deleted straight away.
        </p>

        <h2 className="mt-8 text-xl font-semibold">By email</h2>
        <p className="mt-2">
          Can&apos;t sign in any more? Email {mail} from the address you signed in with (for Sign in with Apple&apos;s private relay, write
          from your Apple ID email and we&apos;ll match it), with the subject &ldquo;Delete my {BRAND.name} account&rdquo;. We delete it
          within 30 days and reply when it&apos;s done. We may ask you to confirm from that address first, so nobody else can delete your
          account.
        </p>

        <h2 className="mt-8 text-xl font-semibold">What&apos;s deleted</h2>
        <p className="mt-2">Straight away, from our servers:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            Your account: your email address, your Google or Apple account id, and every sign-in session (all your devices are signed out).
          </li>
          <li>
            The synced copy of your training: workouts and sets, notes, body weight and body fat, gyms, routines and settings, and if you
            used them, health readings from Health Connect or Apple Health, injuries and cycle logs.
          </li>
          <li>Your Sign in with Apple link, which we revoke with Apple.</li>
        </ul>
        <p className="mt-2">Progress photos are never uploaded, so there&apos;s nothing of them to delete on our side.</p>

        <h2 className="mt-8 text-xl font-semibold">What&apos;s kept, and for how long</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Our database backups:</strong> copies of the deleted data in our database provider&apos;s backups are overwritten within
            30 days.
          </li>
          <li>
            <strong>The copy on your own devices:</strong> each phone or browser keeps its own data, which never reaches us without an
            account. Remove it with Settings › Erase this device, or by uninstalling the app.
          </li>
          <li>
            <strong>Usage stats:</strong> anonymous stats under a random install id, never linked to your account, kept for up to 25 months.
            Ask us by email to delete them sooner.
          </li>
          <li>
            <strong>Email reminders:</strong> if you turned them on, your reminder address is kept until you stop them (Settings › Reminders
            › Stop all email and delete my address, the unsubscribe link in any email, or Erase this device), or until you ask us by email.
          </li>
          <li>
            <strong>Feedback you sent</strong> stays in our support inbox until you ask us to delete it.
          </li>
          <li>
            <strong>Subscriptions:</strong> deleting your account doesn&apos;t cancel Pro bought in Google Play or the App Store; cancel it
            there. A subscription bought on the web app is cancelled straight away when you delete your account. Google, Apple, Stripe and
            RevenueCat (which checks purchases for us) keep purchase records, and we keep our record of subscription events, for as long as
            tax and accounting law requires. None of these hold your workouts or health data.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Delete some data and keep your account</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            Cycle logs: Settings › Cycle-aware readiness › Turn off and delete cycle data. They&apos;re deleted on this device and from your
            synced copy.
          </li>
          <li>Email reminders: Settings › Reminders › Stop all email and delete my address.</li>
          <li>Usage stats: switch them off in Settings, which also deletes anything waiting to be sent.</li>
          <li>
            Anything else (some workouts, health readings, or everything synced while keeping the account): email {mail} from your account
            address and say what to delete. We do it within 30 days.
          </li>
        </ul>

        <p className="mt-8 text-sm text-muted">
          More about what we collect and why is in our{" "}
          <a className="text-accent underline" href="/privacy/">
            privacy policy
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
