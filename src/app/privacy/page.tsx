import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { BRAND } from "@/lib/brand";
import { pageMeta } from "@/lib/pageMeta";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Privacy",
  description: `What ${BRAND.name} collects, why, and how to turn it off.`,
  path: "/privacy/",
});

// Keep in step with docs/PRIVACY_LABELS.md (Play Data safety and App Store privacy answers),
// ios/App/App/PrivacyInfo.xcprivacy and public/privacypolicy.html (Health Connect rationale).
const UPDATED = "10 November 2026";

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>

        <h2 className="mt-8 text-xl font-semibold">The short version</h2>
        <p className="mt-2">
          {BRAND.name} works offline. Your workouts, weights, gyms, body measurements and health data stay on your phone, unless you sign in
          to an account to back them up and sync them to your other devices. We have no ads and never sell or share data with advertisers or
          data brokers. To make the app better we collect anonymous usage stats, which you can turn off in Settings.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Usage stats from the app</h2>
        <p className="mt-2">
          When usage stats are on, the app sends us, under a random install id made on your device (not an advertising id):
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            Your device and app: platform, device maker and model, operating system version, app version, screen size, language, time zone
            and whether reduced motion is on.
          </li>
          <li>
            How you found the app: the store it came from, the campaign tags on the store or website link you followed (for example
            utm_source), the website you came from, and on iPhone whether an Apple Search Ads ad led to the install.
          </li>
          <li>
            How you use it: which screens you open, setup wizard steps, which features you use, permissions you allow or refuse, that a
            workout started or finished with how many exercises and sets and how long it took, feedback you send (its type only), and
            paywall views, trials and purchases with the plan and price.
          </li>
          <li>Your country and region, worked out from your internet address when the stats arrive. The address itself isn&apos;t kept.</li>
          <li>
            When the app checks which features are switched on (feature flags), the install id goes with the question, so a feature can
            reach some installs before others, and we record which version of a feature you were shown when we&apos;re comparing two. With
            usage stats off, the app still checks, but without the install id, and you get the usual version.
          </li>
        </ul>
        <p className="mt-2">
          We never collect, in usage stats, the weights or reps you lift, heart rate, body weight, readings from Health Connect or Apple
          Health, cycle data, your location, your name or email, or anything you type. We don&apos;t use any advertising id (IDFA or Android
          advertising id) and don&apos;t track you across other companies&apos; apps or websites, so there&apos;s no tracking prompt.
        </p>
        <p className="mt-2">
          We use these stats to see what works and what doesn&apos;t: how many people finish setup, which features get used, which devices
          to test on, which links bring people in, and how subscriptions are doing. In the EU, EEA, UK and Switzerland usage stats start off
          and are only sent if you switch them on. Everywhere else they start on. You can switch them off in Settings › Usage stats or
          during setup. Switching them off stops sending and deletes anything waiting on your device, and &ldquo;Erase this device&rdquo;
          also resets the install id.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Visits to this website</h2>
        <p className="mt-2">
          We count page views and clicks on our download and &ldquo;open the app&rdquo; buttons with our own cookieless counter. For each
          one we keep the page, the website you came from, campaign tags in the link, your country, and your browser, operating system and
          device type. To count a visitor once a day without cookies, we keep a one-way code made from your internet address, your browser
          and a secret that changes every day, so a visit can&apos;t be linked to the next day&apos;s or turned back into your address. If
          your browser sends a Global Privacy Control signal, nothing is counted. When usage stats are allowed, the site also remembers on
          your device how you first found us, so a web app install can be credited to it.
        </p>
        <p className="mt-2">
          Our host, Vercel, also counts page views on this website with Vercel Web Analytics. It uses no cookies and keeps no internet
          address: it records the page (without the link&apos;s tags), the website you came from, your country, and your browser, operating
          system and device type, and tells visitors apart with a code that resets every day. It never runs inside the Liftsmith app, and a
          Global Privacy Control signal turns it off too.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Health data</h2>
        <p className="mt-2">
          If you try the rep counter, the camera picture and motion sensor readings are analyzed on your device as you lift and then thrown
          away. Nothing is recorded, saved or sent to us.
        </p>
        <p className="mt-2">
          With your permission the app reads weight, height, body fat, resting heart rate, sleep, heart rate variability, steps, VO2 max,
          respiratory rate and the calories and protein a food app logs from Health Connect or Apple Health to fill in setup, bring in
          weigh-ins and body fat, keep your TDEE (daily calories) current, show the Health view on the Body tab against your own normal,
          give coach&apos;s notes about what you eat, and (with Pro) adjust how hard today&apos;s workout is, and saves each finished
          workout back as a strength training workout with its time, title, sets, active calories and average heart rate. These readings
          stay on your phone and are never part of usage stats. If you sign in to sync, they&apos;re copied to your own account so your
          other devices have them, and nowhere else.{" "}
          <a className="text-accent underline" href="/privacypolicy.html">
            More about health data
          </a>
          .
        </p>
        <p className="mt-2">
          {BRAND.name}&apos;s use of information received from Health Connect adheres to the{" "}
          <a className="text-accent underline" href="https://support.google.com/googleplay/android-developer/answer/12991134">
            Health Connect Permissions policy
          </a>
          , including the Limited Use requirements. Information from Apple Health is used the same way: only for the features above
          (including syncing it to your own account when you sign in), never transferred to anyone else, never used for advertising, credit
          or lending decisions, and never read by people.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Accounts and sync</h2>
        <p className="mt-2">
          An account is optional. If you sign in (with Google, with Apple, or with a code we email you), we keep your email address, which
          sign-in methods you used, and a copy of what you log in the app so it&apos;s backed up and on every device you sign in on: your
          workouts and sets, notes, body weight, gyms, routines and settings, and, if you use them, health readings from Health Connect or
          Apple Health, injuries and cycle logs. Progress photos are never uploaded. This copy is used only to give it back to you on your
          devices. It&apos;s never part of usage stats, never used for advertising, never shared, and never read by people unless you ask us
          for help with it. Sign-in with Google or Apple gives us only your account id there and your email (Apple can give a private relay
          address instead). You can sign out on any device, which keeps that device&apos;s data, or delete your account in Settings ›
          Account and sync, which deletes your account and our copy at once.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Friends</h2>
        <p className="mt-2">
          Friends is optional and needs an account. If you join, we keep the handle and name you pick, who you follow and who follows you,
          who you&apos;ve blocked, and what you post: the workouts you choose to post (or every workout, if you turn that on), with their
          time, sets, exercises and best sets (weights only if you show them), plus your likes and comments. Your followers see your posts;
          by default you approve each follower first. If you make your profile public, anyone can see it and the workouts you post, in the
          app and on a web page at your handle that search engines may list; turn Public profile off and the page goes away. If you send a
          workout to a friend, we keep its name and exercises (no weights or notes) so it shows in their activity. If you allow
          notifications, we keep your phone&apos;s push token with your account and send it through Google&apos;s Firebase Cloud Messaging
          (Android) or Apple&apos;s push service (iPhone) to tell you about follows, comments and workouts sent to you; signing out or
          leaving Friends removes it. A post never includes heart rate, body weight or fat, measurements, cycle data, injuries, gyms or
          places. If you report something, we keep the report and who made it so we can review it, and the person you reported isn&apos;t
          told who reported them. Leave Friends in its settings, or delete your account, and all of this is deleted.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Gyms you share or list</h2>
        <p className="mt-2">
          Sharing a gym as a link puts its name, equipment and weights in the link itself; nothing is sent to us. Listing a gym so lifters
          nearby can find it is optional and needs an account. If you list one, we keep its name, equipment and weights with your account,
          and its area rounded to about 1 km, never your exact position or your machine settings. Anyone looking for gyms near them sees the
          name, equipment and distance, but not who listed it. When you look for gyms near you, the app sends your area rounded the same
          way, and we don&apos;t keep it. Only list a gym open to the public, never your home. If someone reports a listing, we keep a
          one-way code made from their internet address (or their account) so each person counts once. Turn the listing off in Gyms, or
          delete your account, and it&apos;s deleted.
        </p>
        <p className="mt-2">
          The gyms you can find near you also include real gyms from OpenStreetMap, a public map. Adding one of them counts you once toward
          how many lifters train there: we keep that you added it with your account (or a one-way code from your internet address), and show
          only the total. If you list a gym you added this way, the listing says which real gym it is. Deleting your account removes you
          from those totals.
        </p>
        <p className="mt-2">
          If you claim a gym as its owner, manager or staff, we keep your name, role, the work email you give, and optionally a phone number
          and a note, with your account, so we can check the claim. A claim from an address at the gym&apos;s own website gets a code by
          email; any other claim is read by our team. The gym&apos;s details you then set (hours, website, phone, a description and its
          equipment) are public on its page; your name and email are never shown. Stop managing the gym, or delete your account, and the gym
          goes back to unofficial and your claims are deleted.
        </p>
        <p className="mt-2">
          If you ask us to mail your gym a table stand, we keep the mailing address you give and the name on it with your account until
          it&apos;s sent, and the gym&apos;s address afterwards as our mailing record. Deleting your account takes your name off it. Visits
          from the QR code on a gym&apos;s poster are counted with a one-way code from your internet address, once a day, and only the total
          is kept.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Connected apps: Strava, Oura, WHOOP, Withings, Polar, Concept2 and Sonos</h2>
        <p className="mt-2">
          These are optional and need an account. When you connect one, you sign in on that service&apos;s own page and allow {BRAND.name};
          we keep the access it gives us (encrypted) with your account, plus your name on Strava to show who&apos;s connected. With Strava
          connected, each finished workout (its start time, length and your sets) is posted to your Strava account, unless you turn that
          off. With Oura or WHOOP connected, the app asks our server for your last few weeks of sleep, heart rate variability, resting heart
          rate, breathing rate and (Oura) steps; with Withings connected, the same plus your weigh-ins and body fat; with Polar connected,
          your sleep and nightly heart rate, heart rate variability and breathing rate; with Concept2 connected, your Logbook&apos;s rowing,
          ski and bike sessions (when, how long and how far), which are saved as cardio workouts. Our server fetches them from the service
          and passes them straight to your phone without keeping them, and they&apos;re then treated like readings from Health Connect or
          Apple Health, or like workouts you logged yourself. For Polar we also keep the user number Polar gives us, so we can remove our
          access when you disconnect. Disconnect in Settings › Connected apps, or delete your account, and we withdraw our access at the
          service where it lets us (Withings, Concept2 and Sonos have no way for us to do this, so you can also remove {BRAND.name} in your
          account there) and delete what we kept. With Sonos connected (an experiment in Labs), the app asks our server to list your Sonos
          speakers and favourites, read what one is playing and its volume, and send play, pause, skip and volume commands to it; nothing
          from Sonos is kept.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Reminders</h2>
        <p className="mt-2">
          Phone reminders are scheduled on your phone from your own data and send nothing to us. If you turn on email reminders, we keep
          your email address, which kinds of email you chose, when you agreed, and only what&apos;s needed to time them: your training days
          and time, time zone, days-a-week goal, when you finished setup, when your first and latest workouts were, how many days you
          trained this week, your streak and whether you have Pro. Never your weights, reps, heart rate or health data. Nothing is sent
          until you confirm the address, offers stay off unless you turn them on, and every email has a one-click unsubscribe link. Stop all
          email in Settings › Reminders, or erase this device, and we delete your address and its history.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Subscriptions</h2>
        <p className="mt-2">
          Pro is bought through Google Play or the App Store, which take the payment; we never see your card. RevenueCat checks the
          store&apos;s receipts for us so the app knows whether you have Pro. It receives your random install id, the plan, its price,
          currency and country, trial and renewal dates, and the store&apos;s purchase receipt. Never your name, email, workouts or health
          data. The stores also tell us (through RevenueCat) when a subscription starts, renews, is cancelled or refunded, so we can count
          revenue.
        </p>
        <p className="mt-2">
          On the web app, Pro is paid by card through Stripe, on Stripe&apos;s own checkout page; we never see your card. A web subscription
          needs an account, so Stripe receives your account&apos;s email, a random account id, your random install id and any code you used,
          and tells us when the subscription starts, renews, is cancelled or refunded. If a phone signed in to your account has a store
          subscription, we link that phone&apos;s install id to your account so Pro works on the web too. Deleting your account cancels a
          web subscription and removes the link; Stripe keeps its own payment records, as the law requires.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Codes</h2>
        <p className="mt-2">
          If you use a code or its link, whether a creator&apos;s or one of ours, we record the code with your random install id, where it
          came from (a link, the Play install, or typed in) and your platform, and RevenueCat keeps the code with your subscription. We do
          this whether usage stats are on or off, because it&apos;s how we give you what the code offers, keep a limited code to its number
          of uses, and pay a creator their share when you subscribe. Anything we tell a creator is totals for their code (sign-ups, trials,
          subscribers and what they earned), never who you are. You can remove a code in Settings › Redeem a code until a trial or
          subscription starts.
        </p>
        <h2 className="mt-8 text-xl font-semibold">Feedback and bug reports</h2>
        <p className="mt-2">
          If you send feedback, we receive your message, your email if you give it, a screenshot if you attach one, and device details if
          you allow them. We use them only to answer you and fix problems.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Who processes it</h2>
        <p className="mt-2">
          Usage stats, site visits, accounts and synced data are stored in our database (Turso), on servers run by Vercel. Emails go through
          Resend. Subscriptions are checked by RevenueCat, and web payments are taken by Stripe. When you email us, we may ask
          Anthropic&apos;s Claude for a first draft of our answer; your message is sent for that one request, and a person reads and sends
          every reply. None of them may use the data for their own purposes. We keep usage stats for up to 25 months.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Your choices</h2>
        <p className="mt-2">
          Turn usage stats off in Settings. Erase everything on your device from Settings › Erase this device. Delete your account and
          everything synced to it from Settings › Account and sync (sign in at www.getliftsmith.com/app/ to do it from a browser; every way
          to delete, and what&apos;s kept, is on{" "}
          <a className="text-accent underline" href="/delete-account/">
            Delete your account
          </a>
          ). To ask what we hold under your install id, or to have it deleted, send feedback from the app with your install id (shown under
          Settings › Usage stats) and we&apos;ll do it within 30 days.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Contact</h2>
        <p className="mt-2">
          Questions about privacy or your data:{" "}
          <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . You can also send feedback from the app (Settings › Send feedback or report a bug). The rules for using {BRAND.name} are in our{" "}
          <a className="text-accent underline" href="/terms/">
            terms of use
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
