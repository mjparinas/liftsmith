// The public FAQ: the home page shows it (and its FAQPage data), and the admin Inbox's "Draft with AI" answers
// from it (src/server/replyDraft.ts), so a drafted reply never says something the site doesn't.
import { BRAND } from "./brand";
import { FLAGS } from "./flags";
import { PRICES } from "./trial";

const TRIAL_DAYS = FLAGS.trialDays.default;
const name = BRAND.name;

export const FAQS = [
  {
    q: `Is ${name} free?`,
    a: `Yes. The workout logger, plate graphic, rest timer and lock-screen notification are free, and a classic 5×5 program is on its way to the free plan. Pro adds adaptive programming, readiness adjustments, the recovery map and advanced stats, for ${PRICES.monthly.price} a month or ${PRICES.annual.price} a year, with a ${TRIAL_DAYS}-day free trial.`,
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
    a: "No. Everything works on your phone without one. Sign in with Google or Apple when you want your workouts synced and backed up.",
  },
  { q: "How do I cancel?", a: "In two taps, from your Google Play or App Store subscriptions. No tricks and no countdowns." },
];
