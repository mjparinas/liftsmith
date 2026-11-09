import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy", description: `What ${BRAND.name} collects, why, and how to turn it off.` };

// Keep in step with docs/PRIVACY_LABELS.md (Play Data safety and App Store privacy answers),
// ios/App/App/PrivacyInfo.xcprivacy and public/privacypolicy.html (Health Connect rationale).
const UPDATED = "9 November 2026";

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Last updated {UPDATED}</p>

      <h2 className="mt-8 text-xl font-semibold">The short version</h2>
      <p className="mt-2">{BRAND.name} works offline. Your workouts, weights, gyms, body measurements and health data stay on your phone. We have no ads and never sell or share data with advertisers or data brokers. To make the app better we collect anonymous usage stats, which you can turn off in Settings.</p>

      <h2 className="mt-8 text-xl font-semibold">Usage stats from the app</h2>
      <p className="mt-2">When usage stats are on, the app sends us, under a random install id made on your device (not an advertising id):</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>Your device and app: platform, device maker and model, operating system version, app version, screen size, language, time zone and whether reduced motion is on.</li>
        <li>How you found the app: the store it came from, the campaign tags on the store or website link you followed (for example utm_source), the website you came from, and on iPhone whether an Apple Search Ads ad led to the install.</li>
        <li>How you use it: which screens you open, setup wizard steps, which features you use, permissions you allow or refuse, that a workout started or finished with how many exercises and sets and how long it took, feedback you send (its type only), and paywall views, trials and purchases with the plan and price.</li>
        <li>Your country and region, worked out from your internet address when the stats arrive. The address itself isn&apos;t kept.</li>
      </ul>
      <p className="mt-2">We never collect, in usage stats, the weights or reps you lift, heart rate, body weight, readings from Health Connect or Apple Health, cycle data, your location, your name or email, or anything you type. We don&apos;t use any advertising id (IDFA or Android advertising id) and don&apos;t track you across other companies&apos; apps or websites, so there&apos;s no tracking prompt.</p>
      <p className="mt-2">We use these stats to see what works and what doesn&apos;t: how many people finish setup, which features get used, which devices to test on, which links bring people in, and how subscriptions are doing. In the EU, EEA, UK and Switzerland usage stats start off and are only sent if you switch them on. Everywhere else they start on. You can switch them off in Settings › Usage stats or during setup. Switching them off stops sending and deletes anything waiting on your device, and &ldquo;Erase this device&rdquo; also resets the install id.</p>

      <h2 className="mt-8 text-xl font-semibold">Visits to this website</h2>
      <p className="mt-2">We count page views and clicks on our download and &ldquo;open the app&rdquo; buttons with our own cookieless counter. For each one we keep the page, the website you came from, campaign tags in the link, your country, and your browser, operating system and device type. To count a visitor once a day without cookies, we keep a one-way code made from your internet address, your browser and a secret that changes every day, so a visit can&apos;t be linked to the next day&apos;s or turned back into your address. If your browser sends a Global Privacy Control signal, nothing is counted. When usage stats are allowed, the site also remembers on your device how you first found us, so a web app install can be credited to it.</p>

      <h2 className="mt-8 text-xl font-semibold">Health data</h2>
      <p className="mt-2">If you try the rep counter, the camera picture and motion sensor readings are analysed on your device as you lift and then thrown away. Nothing is recorded, saved or sent to us.</p>
      <p className="mt-2">With your permission the app reads weight, height, body fat and resting heart rate from Health Connect or Apple Health to fill in setup, bring in weigh-ins and body fat, and keep your TDEE (daily calories) current, and writes a finished workout&apos;s active calories and average heart rate back. These readings stay on your phone and are never part of usage stats. <a className="text-accent underline" href="/privacypolicy.html">More about health data</a>.</p>
      <p className="mt-2">{BRAND.name}&apos;s use of information received from Health Connect adheres to the <a className="text-accent underline" href="https://support.google.com/googleplay/android-developer/answer/12991134">Health Connect Permissions policy</a>, including the Limited Use requirements. Information from Apple Health is used the same way: only for the features above, never transferred to anyone, never used for advertising, credit or lending decisions, and never read by people.</p>

      <h2 className="mt-8 text-xl font-semibold">Reminders</h2>
      <p className="mt-2">Phone reminders are scheduled on your phone from your own data and send nothing to us. If you turn on email reminders, we keep your email address, which kinds of email you chose, when you agreed, and only what&apos;s needed to time them: your training days and time, time zone, days-a-week goal, when you finished setup, when your first and latest workouts were, how many days you trained this week, your streak and whether you have Pro. Never your weights, reps, heart rate or health data. Nothing is sent until you confirm the address, offers stay off unless you turn them on, and every email has a one-click unsubscribe link. Stop all email in Settings › Reminders, or erase this device, and we delete your address and its history.</p>
      <h2 className="mt-8 text-xl font-semibold">Feedback and bug reports</h2>
      <p className="mt-2">If you send feedback, we receive your message, your email if you give it, a screenshot if you attach one, and device details if you allow them. We use them only to answer you and fix problems.</p>

      <h2 className="mt-8 text-xl font-semibold">Who processes it</h2>
      <p className="mt-2">Usage stats and site visits are stored in our database (Turso), on servers run by Vercel. Emails go through Resend. None of them may use the data for their own purposes. We keep usage stats for up to 25 months.</p>

      <h2 className="mt-8 text-xl font-semibold">Your choices</h2>
      <p className="mt-2">Turn usage stats off in Settings. Erase everything on your device from Settings › Erase this device. To ask what we hold under your install id, or to have it deleted, send feedback from the app with your install id (shown under Settings › Usage stats) and we&apos;ll do it within 30 days.</p>

      <h2 className="mt-8 text-xl font-semibold">Contact</h2>
      <p className="mt-2">Questions about privacy or your data: <a className="text-accent underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also send feedback from the app (Settings › Send feedback or report a bug).</p>
    </main>
  );
}
