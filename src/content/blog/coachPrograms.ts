import type { Article } from "../articles";

// Blog: coaches' programs (Melvin, 2026-11-15: a program marketplace where coaches sell training programs;
// docs/decisions/coach-programs.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_COACH_PROGRAMS: Article[] = [
  {
    slug: "sell-your-training-programs",
    kind: "blog",
    title: "Coaches can now share and sell their training programs",
    description:
      "Turn your routines into a program with a level, a goal and a length, give it away or set a price, and get paid through your own Stripe account.",
    date: "2026-11-15",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Most coaches already have a few programs they hand out again and again: a beginner's first eight weeks, a block to bring up a bench, a plan for the off-season. Until now, the only way to give one to someone in Liftsmith was to coach them. Now any coach or personal trainer can turn their routines into a program anyone can follow, for free or for a price.",
      },
      { cta: "coach" },
      { h2: "A program is your routines, with a little more" },
      {
        p: "Under **Coaching › Programs**, tap **New program**. Pick up to seven of your routines as its days, in the order to do them, then give it a name, a few words about who it's for, a level, a goal and how many weeks to run it. That's it. The routines carry the exercises, the sets and any supersets, warm-ups and cool-downs, just like a shared routine link.",
      },
      {
        p: "There are no weights in it on purpose. The lifter's own progression picks the weights and reps from what they've lifted, so the same program fits a beginner and someone who's been training for years.",
      },
      { h2: "Free, or with a price" },
      {
        p: "Leave the price empty and the program is free: anyone with the link, or anyone browsing coaches' programs, saves its days to their routines in one tap.",
      },
      {
        p: "To charge for it, set up payments with Stripe under **Coaching › Payments** first, the same account you take client payments with. Then set a price. Lifters buy it on the Liftsmith website, on Stripe's secure checkout page, and the money goes to your Stripe account. You're the merchant, so receipts and refunds are yours in your Stripe dashboard, and a refund takes the program back. On the Pro plan Liftsmith keeps a small share of each sale; on the Coach plans it keeps nothing.",
      },
      {
        tip: "A paid program is bought on the website, not in the phone apps. Once someone has it, it's theirs in the app on every phone and computer they sign in on.",
      },
      { h2: "Share the link" },
      {
        p: "Each program has its own link. Tap **Share link** on the program and send it to your clients, put it in your bio or post it wherever your people are. **See it as a lifter** shows you exactly what they'll see. You can change a program any time, and take it off the list when it's run its course: people who already have it keep it.",
      },
      { h2: "For lifters" },
      {
        p: "Open **Settings › Program** and tap **Browse coaches' programs**. Each one says who made it, the level, the goal, how many weeks and how many days a week. When you have one, **Save all days to my routines** puts its days in your routines, and you pick one from Today like any other routine. Programs you have are listed under **From coaches** on the same screen.",
      },
      {
        p: "Free programs work at any age. Paid programs need an account for someone 18 or over, and only adults can share programs.",
      },
    ],
  },
];
