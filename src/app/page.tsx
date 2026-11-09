import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroLift } from "@/components/site/HeroLift";
import { DemoPicker } from "@/components/site/DemoPicker";
import { StoreBadges } from "@/components/site/StoreBadges";
import { visibleQuotes } from "@/content/testimonials";
import { BRAND } from "@/lib/brand";
import { EXERCISES } from "@/lib/exercises";
import { FLAGS } from "@/lib/flags";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { PRICES } from "@/lib/trial";

// The public home page. Every name on it comes from BRAND (src/lib/brand.ts), so a rename is one line.
// Screenshots are real: scripts/site-screenshots.mjs drives the app and writes public/screens/.
// Calls to action carry data-cta, which the site beacon counts.

const TRIAL_DAYS = FLAGS.trialDays.default;
const name = BRAND.name;

export const metadata: Metadata = {
  title: { absolute: `${name}: adaptive strength training for Android and iPhone` },
  description: `Workouts planned from your equipment, your recovery and your time. Progressive overload, RIR blocks and deloads, plate math for every barbell set, a lock-screen rest timer, and 3D exercise demos. Free to start, no ads, ever.`,
  alternates: { canonical: "/" },
  openGraph: { title: `${name}: your next set, already planned`, url: SITE_URL, type: "website" },
};

function Cta({ children, cta, className = "" }: { children: React.ReactNode; cta: string; className?: string }) {
  return (
    <Link href={APP_PATH} data-cta={cta} className={`press inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-7 text-lg font-semibold text-accent-ink shadow-[0_10px_40px_-10px_rgb(76_141_255/0.7)] ${className}`}>
      {children}
    </Link>
  );
}

function Ghost({ href, children, cta }: { href: string; children: React.ReactNode; cta?: string }) {
  return (
    <a href={href} data-cta={cta} className="press inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-surface px-6 text-lg font-semibold">
      {children}
    </a>
  );
}

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative rounded-[2.4rem] border border-[#2a3442] bg-[#0b0f15] p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.03)] ${className}`}>
      <Image src={src} alt={alt} width={780} height={1688} className="h-auto w-full rounded-[2rem]" sizes="(min-width: 1024px) 300px, 70vw" />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs font-semibold tracking-[0.18em] text-accent uppercase">{children}</p>;
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0 text-good">
      <path fill="currentColor" d="M8.2 14.6 3.9 10.3l1.4-1.4 2.9 2.9 6.5-6.5 1.4 1.4z" />
    </svg>
  );
}

const STEPS = [
  { title: "Tell it your gym", body: "Pick your equipment and the plates you own, in kilograms or pounds. Home, hotel and commercial gyms each get their own list." },
  { title: "Choose how long you have", body: "Slide from 15 to 90 minutes. The plan adds or drops exercises at the end instead of reshuffling everything." },
  { title: "Lift. Tap. Rest.", body: "One tap logs each set as planned. The rest timer starts itself and the next set is already filled in." },
];

const FEATURES = [
  {
    id: "plans",
    eyebrow: "Adaptive programming",
    title: "A plan for today, built from your last workouts",
    body: `${name} picks exercises your gym can do and your muscles are ready for, then sets every weight and rep from your history. A daily readiness score from recovery, missed reps and rep speed decides whether today is a push day, an easy day or business as usual, and it shows you why.`,
    points: ["Double progression on top of an RIR target", "4-week blocks that ease into a deload week", "Push, as planned, or go easy: you can always override"],
    shot: "/screens/today.webp",
    alt: "The Today screen: the readiness call with its reasons, the training week and RIR, a workout length slider and the planned exercises",
    cta: "See today's plan",
  },
  {
    id: "workout",
    eyebrow: "The workout screen",
    title: "Big numbers, one tap, plates already worked out",
    body: "Every barbell set shows exactly which plates go on each side, solved for the plates you own, so 45 lb and 20 kg sets stay exact. Log the set and the rest timer starts on its own, with the next set's plates on screen while you load.",
    points: ["Steppers for weight and reps, pre-filled every set", "Rest timer with +30 s and Skip", "Swap any exercise for one your gym can do"],
    shot: "/screens/workout.webp",
    alt: "The workout screen for a barbell lift: big weight and reps steppers, and a plate graphic showing what goes on each side",
    cta: "Try the workout screen",
  },
  {
    id: "lockscreen",
    eyebrow: "Phone in your pocket",
    title: "Your rest timer lives on the lock screen",
    body: "On Android, a live notification counts down your rest, shows the next set and its plates, and has Log set and +30 s buttons. On iPhone, a Live Activity does the same on the lock screen and in the Dynamic Island. When rest ends, your phone buzzes.",
    points: ["Live heart rate from any Bluetooth strap or watch that shares it", "The screen stays awake while you lift", "Siri, App Shortcuts and a Quick Settings tile to start or log"],
    shot: "/screens/rest.webp",
    alt: "The rest timer at 1:25 with +30 s and Skip rest buttons, and the next set's plates ready to load",
    cta: "Start a workout",
  },
  {
    id: "recovery",
    eyebrow: "Recovery map",
    title: "See which muscles are ready before you train them",
    body: "Each set adds fatigue to the muscles it works, and it fades over two to three days depending on the muscle. The front and back body map shows every muscle as Fresh, Ready, Recovering or Fatigued, and the plan steers clear of what isn't ready.",
    points: ["Colour plus a label and a percentage for every muscle", "Weekly sets per muscle against a growth target", "No reward, ever, for training a fatigued muscle"],
    shot: "/screens/recovery.webp",
    alt: "The recovery map: front and back body views coloured by recovery, with a legend for Fresh, Ready, Recovering and Fatigued",
    cta: "Check your recovery",
  },
  {
    id: "progress",
    eyebrow: "Progress and stats",
    title: "Numbers that show you're getting stronger",
    body: "Estimated one-rep max trends, PRs, volume, weekly sets per muscle, streaks and levels, all worked out on your phone from every set you log. Every set keeps its weight, reps, rest and heart rate, so the next plan has real data to go on.",
    points: ["Week streaks, so rest days never break them", "PR celebrations, levels and trophies like the plate club", "Export all your data whenever you want"],
    shot: "/screens/progress.webp",
    alt: "The Progress screen: level, workouts, week streak, sets and volume, with sets per muscle this week",
    cta: "Track your progress",
  },
];

const MORE = [
  { title: "Works offline", body: "Everything runs on your phone. No signal in the basement gym is fine." },
  { title: "Any gym, even none", body: `${EXERCISES.length} exercises, with bodyweight options for every major muscle for hotels and parks.` },
  { title: "Your plates, exactly", body: "Plate counts per gym, so every suggested weight is one you can actually load." },
  { title: "Health Connect and Apple Health", body: "Fill in your body weight in one tap and save finished workouts back." },
  { title: "Fits your calendar", body: "Training days go in your calendar and workouts fit around busy times." },
  { title: "No account needed", body: "Sign in with Google or Apple only if you want sync and backup." },
];

const FAQS = [
  { q: `Is ${name} free?`, a: `Yes. The workout logger, plate graphic, rest timer and lock-screen notification are free, and a classic 5×5 program is on its way to the free plan. Pro adds adaptive programming, readiness adjustments, the recovery map and advanced stats, for ${PRICES.monthly.price} a month or ${PRICES.annual.price} a year, with a ${TRIAL_DAYS}-day free trial.` },
  { q: "Are there ads?", a: "No, and there never will be. The subscription is the only way we make money." },
  { q: "Is it on Android and iPhone?", a: "Both apps are on the way to Google Play and the App Store and ship with the same features. Until then, the full app runs in your browser and works offline once it has loaded." },
  { q: "What equipment do I need?", a: "Whatever you have. Tell it your gym's equipment and plates, or choose bodyweight only, and every exercise it plans is one you can do there." },
  { q: "Does it work with my heart rate monitor?", a: "Any strap or watch that broadcasts standard Bluetooth heart rate works, including Polar and Wahoo straps, Garmin watches set to broadcast, Fitbit Charge 6 and Pixel Watch." },
  { q: "Do I need an account?", a: "No. Everything works on your phone without one. Sign in with Google or Apple when you want your workouts synced and backed up." },
  { q: "How do I cancel?", a: "In two taps, from your Google Play or App Store subscriptions. No tricks and no countdowns." },
];

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2 10h2V7h3v10H4v-3H2zm20 0h-2V7h-3v10h3v-3h2zM8 11h8v2H8z" />
            </svg>
          </span>
          {name}
        </Link>
        <nav aria-label="Site" className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <a href="#features" className="hidden rounded-lg px-3 py-2 hover:bg-surface md:inline">Features</a>
          <a href="#demos" className="hidden rounded-lg px-3 py-2 hover:bg-surface md:inline">3D demos</a>
          <a href="#pricing" className="hidden rounded-lg px-3 py-2 hover:bg-surface md:inline">Pricing</a>
          <a href="#faq" className="hidden rounded-lg px-3 py-2 hover:bg-surface lg:inline">FAQ</a>
          <Link href={APP_PATH} data-cta="header" className="press ml-1 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-accent-ink">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold">{name}</p>
          <p className="mt-2 max-w-sm text-sm text-muted">{BRAND.tagline} Adaptive strength training for Android, iPhone and the web. No ads, ever.</p>
          <StoreBadges className="mt-4" webLink={false} place="footer" />
        </div>
        <nav aria-label="Product">
          <p className="font-semibold">Product</p>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            <li><Link href={APP_PATH} className="hover:text-ink">Open the app</Link></li>
            <li><a href="#features" className="hover:text-ink">Features</a></li>
            <li><a href="#pricing" className="hover:text-ink">Pricing</a></li>
            <li><Link href="/me/" className="hover:text-ink">Your dashboard</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="font-semibold">Company</p>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            <li><a href="/privacypolicy.html" className="hover:text-ink">Privacy</a></li>
            <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
        © {new Date().getFullYear()} {name}. Google Play and the Google Play logo are trademarks of Google LLC. Apple, the Apple logo and iPhone are trademarks of Apple Inc. App Store is a service mark of Apple Inc.
      </p>
    </footer>
  );
}

export default function Home() {
  const quotes = visibleQuotes();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name,
      operatingSystem: "Android, iOS, Web",
      applicationCategory: "HealthApplication",
      description: metadata.description,
      url: SITE_URL,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: PRICES.monthly.price.replace("$", ""), priceCurrency: "USD", name: "Pro monthly" },
        { "@type": "Offer", price: PRICES.annual.price.replace("$", ""), priceCurrency: "USD", name: "Pro yearly" },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="overflow-x-clip">
        {/* Hero */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[640px] bg-[radial-gradient(ellipse_at_70%_30%,rgb(76_141_255/0.18),transparent_60%)]" />
          {/* Phones: headline, then the lifter, then the buttons. Wide screens: text left, lifter right. */}
          <div className="relative mx-auto grid max-w-6xl gap-x-12 gap-y-8 px-4 pt-10 pb-14 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:pt-16">
            <div className="lg:self-end">
              <Eyebrow>Adaptive strength training · Android, iPhone, web</Eyebrow>
              <h1 className="mt-4 text-[2.6rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl">
                Your next set, <span className="bg-gradient-to-r from-accent to-holo bg-clip-text text-transparent">already planned.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
                {name} builds every workout from your equipment, your recovery and the time you have, then gets out of the way. One tap logs a set. The plates, the rest and the next weight are worked out for you.
              </p>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
              <HeroLift />
            </div>
            <div>
              <div className="flex flex-wrap gap-3">
                <Cta cta="hero">Build my first workout</Cta>
                <Ghost href="#demos" cta="hero-demos">See the 3D demos</Ghost>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <li className="flex gap-1.5"><Check />Free to start</li>
                <li className="flex gap-1.5"><Check />No ads, ever</li>
                <li className="flex gap-1.5"><Check />Works offline</li>
                <li className="flex gap-1.5"><Check />{TRIAL_DAYS}-day Pro trial</li>
              </ul>
              <StoreBadges className="mt-7" place="hero" />
            </div>
          </div>
        </section>

        {/* Facts strip: things that are true of the app, not user counts we don't have yet */}
        <section aria-label="At a glance" className="border-y border-line bg-surface/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
            {[
              [`${EXERCISES.length}`, "exercises, with cues"],
              ["15–90", "minute workouts"],
              ["1 tap", "to log a set"],
              ["0", "ads, ever"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="num text-3xl font-bold sm:text-4xl">{v}</dd>
                <dd className="mt-1 text-sm text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-20">
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Three steps, then you just lift</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative overflow-hidden p-6">
                <span aria-hidden className="num absolute -top-4 right-3 text-8xl font-black text-white/[0.04]">{i + 1}</span>
                <span className="grid size-10 place-items-center rounded-full bg-accent/15 font-bold text-accent" aria-hidden>{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center">
            <Cta cta="how">Set up my gym in a minute</Cta>
          </div>
        </section>

        {/* Features, each with a real screenshot */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 pt-20">
            <Eyebrow>Features</Eyebrow>
            <h2 id="features-h" className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Everything a coach would work out, done between your sets</h2>
          </div>
          {FEATURES.map((f, i) => (
            <article key={f.id} id={f.id} aria-labelledby={`${f.id}-h`} className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:gap-16">
              <div className={i % 2 ? "md:order-2" : ""}>
                <Eyebrow>{f.eyebrow}</Eyebrow>
                <h3 id={`${f.id}-h`} className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{f.title}</h3>
                <p className="mt-4 text-lg text-muted">{f.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-2.5"><Check />{p}</li>
                  ))}
                </ul>
                <Link href={APP_PATH} data-cta={`feature-${f.id}`} className="mt-6 inline-flex min-h-11 items-center gap-1 font-semibold text-accent hover:underline">
                  {f.cta} <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="relative mx-auto w-full max-w-[300px]">
                <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-full bg-accent/10 blur-3xl" />
                <Phone src={f.shot} alt={f.alt} />
              </div>
            </article>
          ))}
        </section>

        {/* Mid-page call to action */}
        <section aria-labelledby="mid" className="mx-auto max-w-6xl px-4 py-10">
          <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-[#10213f] to-surface p-8 sm:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 id="mid" className="text-2xl font-bold sm:text-3xl">Your first workout is a minute away</h2>
                <p className="mt-2 text-muted">Answer three questions about your gym and goals. No account, no card.</p>
              </div>
              <div className="flex md:justify-end">
                <Cta cta="mid">Start free now</Cta>
              </div>
            </div>
          </div>
        </section>

        {/* 3D demos */}
        <section id="demos" aria-labelledby="demos-h" className="scroll-mt-20 border-t border-line bg-[#05080c]">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Eyebrow>3D exercise demos</Eyebrow>
            <h2 id="demos-h" className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">See every rep from every angle</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">
              Every exercise in the library has a 3D hologram you can spin, with the target muscles lit up, an X-ray skeleton and the bar path. Male and female figures share the same motion, it&apos;s built on your phone so it works offline, and with a heart rate monitor connected the figure&apos;s heart beats with yours. Try it: pick a lift and drag the figure.
            </p>
            <div className="mt-10">
              <DemoPicker />
            </div>
            <div className="mt-10 flex justify-center">
              <Cta cta="demos">Learn your lifts free</Cta>
            </div>
          </div>
        </section>

        {/* More features */}
        <section aria-labelledby="more" className="mx-auto max-w-6xl px-4 py-20">
          <Eyebrow>And the rest</Eyebrow>
          <h2 id="more" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Small things that add up</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MORE.map((m) => (
              <div key={m.title} className="card p-6">
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 text-muted">{m.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid items-center gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1fr_260px]">
            <div>
              <Eyebrow>Built for juice</Eyebrow>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">PRs get confetti. Rest days don&apos;t break your streak.</h3>
              <p className="mt-3 text-muted">XP for every set, levels, plate club trophies and weekly quests, all around your sets and never in the way of one. Streaks count weeks that hit your goal, so nobody is pushed to train sore.</p>
              <Link href={APP_PATH} data-cta="juice" className="mt-5 inline-flex min-h-11 items-center gap-1 font-semibold text-accent hover:underline">
                Earn your first PR <span aria-hidden>→</span>
              </Link>
            </div>
            <Phone src="/screens/done.webp" alt="The finish screen after a workout: new PRs, XP earned, time, sets, volume and the week streak" className="mx-auto w-full max-w-[260px]" />
          </div>
        </section>

        {/* Testimonials */}
        <section aria-labelledby="quotes" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Eyebrow>From the gym floor</Eyebrow>
            <h2 id="quotes" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What lifters say</h2>
            {quotes.length > 0 ? (
              <ul className="mt-10 grid gap-4 md:grid-cols-3">
                {quotes.map((q, i) => (
                  <li key={i} className="card flex flex-col gap-4 p-6">
                    {q.sample && <span className="self-start rounded-full bg-warn/15 px-3 py-1 text-xs font-bold text-warn">Sample quote, not a real user</span>}
                    <p aria-hidden className="text-gold">★★★★★</p>
                    <blockquote className="text-lg">&ldquo;{q.quote}&rdquo;</blockquote>
                    <p className="mt-auto text-sm">
                      <b>{q.name}</b> <span className="text-muted">· {q.about}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-dashed border-line p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted">
                <b className="text-ink">We&apos;re looking for our first lifters.</b> Try {name} free, tell us what you think from inside the app, and your words could be here.
              </p>
              <Cta cta="beta" className="shrink-0">Be one of the first</Cta>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 id="pricing-h" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Start free. Go Pro when you&apos;re ready.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">Plain prices, a {TRIAL_DAYS}-day free trial of Pro, cancel in two taps. No ads on any plan, ever.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="card flex flex-col p-7">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="mt-3"><span className="num text-5xl font-bold">$0</span> <span className="text-muted">forever</span></p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Workout logger with pre-filled sets", "Plate graphic for every barbell set", "Automatic rest timer", "Lock-screen notification and Live Activity", "Classic 5×5 program (coming soon)", "Works offline, no account needed"].map((x) => (
                  <li key={x} className="flex gap-2.5"><Check />{x}</li>
                ))}
              </ul>
              <Link href={APP_PATH} data-cta="pricing-free" className="press mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-raised text-lg font-semibold">
                Start free
              </Link>
            </div>
            <div className="relative flex flex-col rounded-[20px] border-2 border-accent bg-gradient-to-b from-[#112244] to-surface p-7 shadow-[0_20px_60px_-20px_rgb(76_141_255/0.5)]">
              <span className="absolute -top-3.5 left-7 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink uppercase">{TRIAL_DAYS} days free</span>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="mt-3">
                <span className="num text-5xl font-bold">{PRICES.annual.price}</span> <span className="text-muted">{PRICES.annual.per}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{PRICES.annual.note}, or {PRICES.monthly.price} {PRICES.monthly.per}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Everything in Free", "Adaptive workouts from your gym, time and history", "Automatic weights and reps, RIR blocks and deloads", "Daily readiness: push, as planned or go easy", "Recovery map", "Advanced stats: one-rep max trends, sets per muscle"].map((x) => (
                  <li key={x} className="flex gap-2.5"><Check />{x}</li>
                ))}
              </ul>
              <Cta cta="pricing-pro" className="mt-8 w-full">
                Start my {TRIAL_DAYS}-day free trial
              </Cta>
              <p className="mt-3 text-center text-xs text-muted">Billed through Google Play or the App Store. Cancel any time before the trial ends and you pay nothing.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20">
          <Eyebrow>FAQ</Eyebrow>
          <h2 id="faq-h" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions lifters ask</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group card p-5 open:border-accent/40">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <span aria-hidden className="text-2xl text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Last call to action */}
        <section aria-labelledby="final" className="relative overflow-hidden border-t border-line">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgb(76_141_255/0.22),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl px-4 py-24 text-center">
            <h2 id="final" className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Stop planning. Start lifting.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Your first workout is ready as soon as you tell {name} about your gym.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Cta cta="final">Build my first workout</Cta>
              <Ghost href="#pricing" cta="final-pricing">See pricing</Ghost>
            </div>
            <StoreBadges className="mt-8 justify-center" place="final" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
