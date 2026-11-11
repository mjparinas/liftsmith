// The public questions and answers. The home page shows FAQS (and its FAQPage data); /help/ shows every group in
// HELP (and FAQPage data for all of them); the admin Inbox's "Draft with AI" answers from ALL_FAQS
// (src/server/replyDraft.ts), so a drafted reply never says something the site doesn't.
import { BRAND } from "./brand";
import { REPLY_TIME } from "./contact";
import { FLAGS } from "./flags";
import { CONTACT_EMAIL } from "./site";
import { PRICES } from "./trial";

const TRIAL_DAYS = FLAGS.trialDays.default;
const name = BRAND.name;

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: `Is ${name} free?`,
    a: `Yes. The workout logger, plate graphic, rest timer, lock-screen notification and every fixed program (classic 5×5 and friends) are free. Pro adds adaptive programming, readiness adjustments, the recovery map and advanced stats, for ${PRICES.monthly.price} a month or ${PRICES.annual.price} a year, with a ${TRIAL_DAYS}-day free trial.`,
  },
  { q: "Are there ads?", a: "No, and there never will be. The subscription is the only way we make money." },
  {
    q: "Is it on Android and iPhone?",
    a: "Both apps are on the way to Google Play and the App Store and ship with the same features. Until then, the full app runs in your browser and works offline once it has loaded.",
  },
  {
    q: "What equipment do I need?",
    a: "Whatever you have. Tell it your gym's equipment and plates, or choose bodyweight only, and every exercise it plans is one you can do there.",
  },
  {
    q: "Does it work with my heart rate monitor?",
    a: "Any strap or watch that broadcasts standard Bluetooth heart rate works, including Polar and Wahoo straps, Garmin watches set to broadcast, Fitbit Charge 6 and Pixel Watch.",
  },
  {
    q: "Do I need an account?",
    a: "No. Everything works on your phone without one. Sign in with Google, Apple or your email when you want your workouts synced and backed up.",
  },
  { q: "How do I cancel?", a: "In two taps, from your Google Play or App Store subscriptions. No tricks and no countdowns." },
];

/** The help page's groups, in the order shown. Each group has its own anchor (`#<id>`). */
export const HELP: { id: string; title: string; faqs: Faq[] }[] = [
  { id: "basics", title: "The basics", faqs: FAQS },
  {
    id: "training",
    title: "How the training works",
    faqs: [
      {
        q: `How does ${name} pick my workout?`,
        a: "It starts from your gym's equipment, the time you have and the muscles that have recovered, then picks exercises, sets, reps and weights from your own logged sets and where you are in your training block. Every pick shows a short line saying why.",
      },
      {
        q: "What is RIR?",
        a: "Reps in reserve: how many more reps you could have done at the end of a set. A block starts with a few in reserve and works closer to your limit week by week, then a lighter deload week lets you recover before the next block.",
      },
      {
        q: "How does it choose my weights?",
        a: "From what you actually lifted last time and how hard it felt. Hit every rep with reps to spare and the weight goes up; miss reps and it holds or comes down. Barbell weights are rounded to plates you own, and the plate graphic shows what to load on each side.",
      },
      {
        q: "What is today's call?",
        a: "Each day the app reads your recent training and, if you allow it, sleep, resting heart rate and HRV from Health Connect or Apple Health. It then suggests pushing harder, training as planned or going easy, and says which signals led to it. You can always pick a different call.",
      },
      {
        q: "Can I follow a fixed program instead?",
        a: "Yes, and they're free. Classic 5×5, novice 3×5, 5×5 plus arms, ramping 5×5, tiered progression, training max waves and bodyweight skills all follow their own published rules. You can also build your own routines.",
      },
      {
        q: "I'm injured. Can it work around that?",
        a: "Tell it what hurts under Injuries and sore spots and it skips or lightens the exercises that load that area, swapping in ones that don't. It isn't medical advice, so see a professional for anything more than everyday soreness.",
      },
    ],
  },
  {
    id: "data",
    title: "Your data, accounts and sync",
    faqs: [
      {
        q: "Where are my workouts kept?",
        a: "On your phone first, so the app works with no signal in the gym. If you sign in, they're also synced to your account so your other devices and the web dashboard have them.",
      },
      {
        q: "How do I move to a new phone?",
        a: "Sign in on the new phone with the same Google, Apple or email sign-in and everything comes back. Without an account, make a backup file under Settings › Saving and backup and restore it on the new phone. App data isn't included in phone backups, so use one of these two ways.",
      },
      {
        q: "Does it read Health Connect or Apple Health?",
        a: "Only if you allow it. It can read weigh-ins and body fat (from smart scales, for example), sleep, resting heart rate, HRV and VO₂ max, and save your workouts there. You choose each permission, and you can turn them off at any time.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. Settings has a CSV of every working set for spreadsheets, and a full backup file under Saving and backup.",
      },
      {
        q: "How do I delete my account?",
        a: "In the app, open Settings › Account and sync and choose Delete my account. It's deleted straight away, along with everything synced to it. The delete account page on this site has the steps and what is kept.",
      },
      {
        q: "Which languages does it speak?",
        a: "The app is in English, Spanish, French, German, Italian and Japanese, and follows your phone's language unless you pick one in Settings. This site's home and pricing pages are in all six too.",
      },
    ],
  },
  {
    id: "billing",
    title: "Pro, trials and billing",
    faqs: [
      {
        q: "What does Pro cost?",
        a: `${PRICES.monthly.price} a month or ${PRICES.annual.price} a year (${PRICES.annual.note?.toLowerCase()}), in US dollars. The store shows the price in your own currency before you pay.`,
      },
      {
        q: "How does the free trial work?",
        a: `New lifters can try Pro free for ${TRIAL_DAYS} days. The store reminds you before it ends, and if you cancel before then you pay nothing. If you don't, the plan you picked starts when the trial ends.`,
      },
      {
        q: "Can my family share Pro?",
        a: "Yes, on the annual plan, through Google Play's or Apple's own family sharing. The monthly plan is for one person.",
      },
      {
        q: "How do I get a refund?",
        a: "Pro is bought through Google Play or the App Store, so refunds go through them: Google Play's order history, or Apple's Report a Problem page. If they can't help, write to us and we'll do what we can.",
      },
      {
        q: "I bought Pro but it isn't showing.",
        a: "Open Settings › Liftsmith Pro and tap Restore purchases, signed in to the same Google or Apple account you paid with. If it still doesn't show, write to us with the store's order number.",
      },
    ],
  },
  {
    id: "trouble",
    title: "Something isn't working",
    faqs: [
      {
        q: "The rest timer doesn't show on my lock screen.",
        a: "Allow notifications for the app. On Android the timer is an ongoing notification; on iPhone it's a Live Activity, so check that Live Activities are on in iPhone Settings › Liftsmith.",
      },
      {
        q: "My heart rate monitor won't connect.",
        a: "Make sure it's broadcasting (on many watches that's a setting), close other apps that might be connected to it, and keep it close to your phone. The app retries and tells you what went wrong if it can't connect.",
      },
      {
        q: "How do I report a bug?",
        a: `In the app, go to Settings › Send feedback or report a bug. You can add a screenshot and the device details that help us find it. Or use the contact page or email ${CONTACT_EMAIL}. A person replies within ${REPLY_TIME}.`,
      },
    ],
  },
];

/** Every question on the site, home page and help page together, each once. */
export const ALL_FAQS: Faq[] = HELP.flatMap((g) => g.faqs);

/** schema.org FAQPage data for a list of questions. */
export const faqJsonLd = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
