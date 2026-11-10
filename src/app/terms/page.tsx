import type { Metadata } from "next";
import Link from "next/link";

import { InfoPage, Section } from "@/components/site/InfoPage";
import { BRAND } from "@/lib/brand";
import { FLAGS } from "@/lib/flags";
import { CONTACT_EMAIL, MAILING_ADDRESS } from "@/lib/site";
import { PRICES } from "@/lib/trial";

const name = BRAND.name;
const TRIAL_DAYS = FLAGS.trialDays.default;

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms for using ${name}: your account, training safely, Pro, the free trial, cancelling and refunds, and the rules for using the service.`,
  alternates: { canonical: "/terms/" },
};

// Written from Gradelings' terms and adapted (Melvin, 2026-11-10). Not reviewed by a lawyer (Melvin's call, 2026-11-10).
// Keep in step with /privacy/, /pricing/ and the paywall's store terms (Pro.tsx).
export const TERMS_UPDATED = "10 November 2026";

export default function Terms() {
  return (
    <InfoPage
      kind="terms"
      title="Terms of use"
      updated={TERMS_UPDATED}
      intro={`These terms are the agreement between you and ${name} ("we", "us") for using the ${name} apps, the web app and this website. By using ${name}, you agree to them.`}
    >
      <Section title="Who can use it">
        <p>
          You must be at least 16 to use {name}, or the age of digital consent where you live if that&apos;s higher. How we handle
          information is described in our <Link href="/privacy/">privacy policy</Link>.
        </p>
      </Section>

      <Section title="Train safely" id="safety">
        <ul>
          <li>
            {name} plans workouts and suggests weights from what you tell it and what you log. It is not a doctor, physiotherapist or coach
            who can see you, and nothing in it is medical advice.
          </li>
          <li>
            Check with a doctor before you start a new training program, especially if you have a health condition, an injury, are pregnant,
            or haven&apos;t trained in a while.
          </li>
          <li>
            You decide what you lift. Use good form, a spotter or safety pins for heavy barbell work, and stop if something hurts. Injury
            mode, readiness and fitness age are training aids, not a diagnosis.
          </li>
          <li>To the extent the law allows, you train at your own risk.</li>
        </ul>
      </Section>

      <Section title="Your account">
        <ul>
          <li>You don&apos;t need an account. If you make one, with Google, Apple or your email, keep access to that sign-in private.</li>
          <li>You&apos;re responsible for what happens on your account. Tell us straight away if you think someone else has used it.</li>
          <li>
            You can delete your account at any time. The <Link href="/delete-account/">delete account page</Link> says how and what is kept.
          </li>
        </ul>
      </Section>

      <Section title="Pro, the free trial and billing" id="billing">
        <ul>
          <li>
            The free plan stays free. Pro costs {PRICES.monthly.price} {PRICES.monthly.per} or {PRICES.annual.price} {PRICES.annual.per} (US
            dollars; the store shows the price in your currency, with any tax, before you pay). See <Link href="/pricing/">pricing</Link>{" "}
            for what each plan includes.
          </li>
          <li>
            Pro is bought through Google Play or the App Store, and their terms apply to the payment too. The store takes the payment,
            renews the subscription automatically each month or year until you cancel, and charges at the start of each period.
          </li>
          <li>
            New subscribers may get a free trial (currently {TRIAL_DAYS} days). If you cancel before the trial ends, you pay nothing; if you
            don&apos;t, the plan you picked starts when it ends.
          </li>
          <li>
            Cancel at any time in your Google Play or App Store subscriptions. You keep Pro until the end of the period you&apos;ve paid
            for, and your workouts and data stay yours on the free plan. Deleting the app or your account doesn&apos;t cancel a
            subscription.
          </li>
          <li>
            Refunds are handled by the store you paid through, under its own policy. If the store can&apos;t help, write to us and
            we&apos;ll do what we reasonably can. Consumer laws where you live may give you rights to cancel or get a refund that these
            terms don&apos;t take away.
          </li>
          <li>
            The annual plan can be shared with your family through Google Play&apos;s or Apple&apos;s family sharing. The monthly plan is
            for one person.
          </li>
          <li>
            Features and prices can change. A price change for an existing subscription goes through the store, which tells you first and
            lets you cancel before it takes effect.
          </li>
        </ul>
      </Section>

      <Section title="What you can and can't do">
        <p>Please use {name} for your own training. You agree not to:</p>
        <ul>
          <li>
            copy, resell, scrape or republish our exercise library, demos, writing or artwork, or build a competing product from them;
          </li>
          <li>try to break, overload, reverse engineer or get around the security or the Pro features of the service;</li>
          <li>use someone else&apos;s account or creator code in a way they haven&apos;t agreed to; or</li>
          <li>use the service for anything unlawful or harmful.</li>
        </ul>
        <p>We may suspend or close accounts that break these rules.</p>
      </Section>

      <Section title="What we do and don't promise">
        <ul>
          <li>
            We work hard to make the plans, numbers and estimates right, but we can&apos;t promise they&apos;re free of mistakes, or that
            you&apos;ll reach a particular result.
          </li>
          <li>
            Numbers that come from other devices and apps (heart rate monitors, smart scales, Health Connect, Apple Health) are only as good
            as those devices.
          </li>
          <li>
            The app works offline, and we aim to keep sign-in and sync running, but we can&apos;t promise they&apos;ll always work without
            interruption.
          </li>
          <li>
            {name} isn&apos;t affiliated with or endorsed by any other fitness app, program author or equipment maker named on this site.
          </li>
        </ul>
      </Section>

      <Section title="Our content and your data">
        <p>
          We own {name}, including its exercise library, demos, writing and design, and give you a personal, non-transferable licence to use
          it for your training. Your workouts and the data you add are yours: you can export them as a CSV or a backup file, or delete them,
          at any time.
        </p>
      </Section>

      <Section title="Limits on our responsibility">
        <p>
          {name} is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the fullest extent the law allows, we aren&apos;t
          responsible for indirect or consequential losses, and our total responsibility to you for any claim is limited to what you paid
          for {name} in the 12 months before it arose (or US$50 if you&apos;ve paid nothing). Nothing in these terms removes rights you have
          under consumer protection law that can&apos;t be waived, or limits liability that the law doesn&apos;t allow to be limited.
        </p>
      </Section>

      <Section title="Ending the service or your account">
        <p>
          You can stop using {name} and delete your account at any time. We may suspend or end your account if you break these terms or if
          the law requires it. If we ever close the service, we&apos;ll tell you in advance so you can export your data.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms. If a change matters, we&apos;ll say so in the app or on this page before it takes effect, and the date
          at the top will change. If you don&apos;t accept the new terms, stop using {name} and cancel any subscription before they take
          effect.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of British Columbia and the federal laws of Canada that apply there. Disputes go to the
          courts of British Columbia, unless consumer law where you live gives you the right to use your own courts.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {MAILING_ADDRESS ? `, or by mail to ${name}, ${MAILING_ADDRESS}` : ""}, or the <Link href="/contact/">contact page</Link>.
        </p>
      </Section>
    </InfoPage>
  );
}
