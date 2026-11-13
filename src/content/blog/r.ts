import type { Article } from "../articles";

// Blog, part eighteen: coach plans (Melvin, 2026-11-13: "we need to make money but also be user centric";
// docs/decisions/money.md "Coach plans"). Why coaching is priced by client list, what each plan holds, and what stays
// free. Only what ships, and no other app named (seo.test.ts).
export const BLOG_R: Article[] = [
  {
    slug: "coach-plans-priced-by-your-client-list",
    kind: "blog",
    title: "Coach plans: priced by your client list, never by a cut of your pay",
    description:
      "Pro now covers 3 clients, Coach 25 and Coach Plus has no set limit. Clients train free, and Liftsmith takes nothing from what they pay you.",
    date: "2026-11-13",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Coaching in Liftsmith has grown from seeing a client's workouts into most of the job: reports that say who needs you, routines, chat, check-ins, booking, payments and nutrition targets. A coach with thirty clients now gets a lot more out of the app than one lifter does, so we've changed how coaching is priced. We wanted the price to grow with the value you get, stay low for lifters, and never take a slice of what your clients pay you.",
      },
      { h2: "Three plans, one difference: how many clients" },
      {
        p: "**Pro** ($39.99 a year or $6.99 a month, the same as before) now includes coaching for up to 3 clients. That's enough to try every tool with real people before you spend more. **Coach** ($199.99 a year or $19.99 a month) makes room for 25 clients. **Coach Plus** ($399.99 a year or $39.99 a month) has no set limit. Both coach plans include everything in Pro for your own training too.",
      },
      {
        p: "Every coaching tool works on every plan. A trainer with two clients gets the same reports, check-ins, booking and payments as one with two hundred. The plans only differ in how many people you can coach, because that's what changes the work, and it's how most coaches already think about their costs.",
      },
      { h2: "What stays free" },
      {
        p: "Your clients always train free, on Android, iPhone and the web. They never need Pro to follow your routines, answer a check-in, book a session or pay you. High school coaches who confirm a school email address still get Pro free, and so do their athletes aged 13 to 18, with room for whole teams. And Liftsmith takes nothing from what your clients pay you: payments go straight to your own Stripe account, less Stripe's usual card fees.",
      },
      { cta: "coach" },
      { h2: "When you reach your limit" },
      {
        p: "Under **Settings › Coaching › Your clients**, a card shows your plan and how many clients it allows. When it's full, the card says so and **See coach plans** opens the plans, each with its own button and its price from the store or Stripe. Nobody is ever unlinked by a limit: it only stops new clients joining. If someone tries to join a full list, they're told to let you know, and you get one notification that day so you can make room or move up.",
      },
      {
        p: "Moving up from Pro replaces your Pro subscription, so you only ever pay for one plan, and what's left of Pro is credited. On Android and iPhone it goes through Google Play or the App Store, and on the web app by card through Stripe. You can change or cancel any plan the same way you would Pro.",
      },
      { h2: "Already coaching more than three people?" },
      {
        p: "Coaches who already had more clients than Pro covers when coach plans started keep the old limit of 30 for 90 days, so nobody is caught out, and every client you have now stays linked for good. After that, adding new clients needs a coach plan. Read [how to track your clients' workouts](/blog/how-to-track-client-workouts/) for the habits that make coaching in an app work, see the [pricing page](/pricing/) for the plans side by side, or start on the [coaches page](/coaches/).",
      },
    ],
    faq: [
      [
        "Do my clients need to pay anything?",
        "No. Being a client is free on every plan. They need a free account so their workouts reach you.",
      ],
      [
        "Does Liftsmith take a percentage of my client payments?",
        "No. Client payments go to your own Stripe account. Stripe charges its usual card fees, and Liftsmith takes nothing on top.",
      ],
      [
        "What happens to my clients if I go back to Pro?",
        "They all stay linked and keep training with you. You just can't add new clients until you're under Pro's limit or back on a coach plan.",
      ],
      [
        "Are any coaching tools only on the coach plans?",
        "No. Every coaching tool works on Pro, Coach and Coach Plus. The plans differ only in how many clients you can have.",
      ],
    ],
  },
];
