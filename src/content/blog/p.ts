import type { Article } from "../articles";

// Blog, part sixteen: the coach tools round (Melvin, 2026-11-13: "dont forget to add blog posts for this";
// docs/decisions/trainer-mode.md). The announcement of payments, booking, check-ins, nutrition targets and the
// personal trainer or coach choice, and a guide to weekly check-ins. Only what ships, and no other app named (seo.test.ts).
export const BLOG_P: Article[] = [
  {
    slug: "payments-booking-and-check-ins-for-coaches",
    kind: "blog",
    title: "New for personal trainers and coaches: payments, booking and check-ins",
    description:
      "Take client payments through your own Stripe account, let clients book sessions, send weekly check-ins and set nutrition targets, all in Liftsmith.",
    date: "2026-11-13",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "Coaching in Liftsmith started with seeing your clients' workouts and knowing who needs you this week. Today it covers the rest of the job: getting paid, booking sessions, checking in between them and setting what your clients eat. Everything is part of Liftsmith Pro for the coach, and free for the people you coach.",
      },
      { h2: "Personal trainer or coach: pick how you work" },
      {
        p: "Personal trainers and coaches don't work the same way, so Liftsmith now asks. Under **Settings › Coaching › Your clients**, choose **Personal trainer** if you mostly work one-on-one and in person, or **Coach** if you run groups, teams or remote programs. Your clients see the right word next to your name, and the tools you use most come first: sessions and a price per session for trainers, check-ins and a monthly fee for coaches. Every tool stays available either way.",
      },
      { h2: "Take payments through your own Stripe account" },
      {
        p: "Tap **Set up payments with Stripe** and Stripe walks you through your details and bank account on its own pages. Then set each client's price on their report, per session or monthly. Your client sees it under Coaching and pays on Stripe's secure page, and the money goes to your Stripe account. You're the merchant, so receipts, refunds and payouts are yours to manage in your Stripe dashboard. Liftsmith never sees a card number.",
      },
      {
        p: "Monthly plans renew on their own, and either of you can stop one at the end of the paid month. If a monthly payment doesn't go through, it shows at the top of that client's report with a nudge to send a quick message, the same way a client going quiet does.",
      },
      { h2: "Booking and scheduling sessions" },
      {
        p: "Open the times you're free with a few taps: a day, the start time, a length, and once or the same time every week for up to twelve weeks. Leave them open and your clients book them under Coaching, or book a client in yourself from their report. You both get a notification, a session coming up in the next day shows on Today, and **Add to calendar** puts it in the phone's calendar. If two clients reach for the same time, only one gets it, and nobody sees who else booked what.",
      },
      { h2: "Check-in forms and questionnaires" },
      {
        p: "Start a form from a template (a weekly check-in, or an intake questionnaire for new clients) or from blank, and change any question. Send it now or every week. Clients answer with taps: 1 to 5, yes or no, or a number. Only questions that ask for words need typing. Their answers sit on their report, and a score of 1 or 2, or a check-in left unanswered for three days, goes under **What to do first**. Our [guide to weekly check-ins](/blog/weekly-check-in-questions-for-clients/) has the questions worth asking.",
      },
      { cta: "coach" },
      { h2: "Nutrition targets" },
      {
        p: "Set a client's daily calories and protein on their report. They see the targets under Coaching, and their coach's notes judge their food week against your numbers instead of our estimate. Liftsmith still doesn't log food. When a client logs in a food app that writes to Health Connect or Apple Health and chooses to share body data with you, you see how their week compares, and a week well off target shows up on their report.",
      },
      { h2: "Where it works" },
      {
        p: "All of it is on Android, iPhone and the web app, in all six of the app's languages. Being someone's client is always free. Read [how to track your clients' workouts](/blog/how-to-track-client-workouts/) for the habits that make coaching in an app work, or see everything on the [features page](/features/).",
      },
    ],
    faq: [
      [
        "Does Liftsmith take a cut of my payments?",
        "No. Payments go to your own Stripe account. Stripe charges its usual card fees, and Liftsmith takes nothing on top.",
      ],
      [
        "Do my clients need Pro?",
        "No. Booking, paying, check-ins and targets are free for clients. Coaching clients is part of Pro for the coach.",
      ],
      [
        "Can clients pay inside the app?",
        "They pay on Stripe's secure checkout page, which opens in the browser from the app. Their receipt comes from Stripe by email.",
      ],
    ],
  },
  {
    slug: "weekly-check-in-questions-for-clients",
    kind: "blog",
    title: "Weekly check-in questions for personal training clients",
    description:
      "What to ask clients every week, how to keep a check-in short enough that they answer it, and what to do with a low score.",
    date: "2026-11-13",
    tag: "Coaching",
    cta: "coach",
    body: [
      {
        p: "A weekly check-in is the cheapest way to catch a problem before it costs you a client. Done well, it takes them a minute and tells you who needs a lighter week, who needs a push and who's about to drift away. Done badly, it's a twenty-question form nobody opens after week two.",
      },
      { h2: "Keep it to six questions or fewer" },
      {
        p: "Every extra question lowers the odds of getting any answers at all. Ask only what you'll act on. If you wouldn't change a client's plan or send them a message because of the answer, cut the question.",
      },
      { h2: "Questions worth asking every week" },
      {
        ul: [
          "**How well did you sleep this week?** (1 to 5). Poor sleep is the most common reason a good plan stops working.",
          "**How was your energy?** (1 to 5). A low score two weeks running is a reason to ease off before fatigue turns into missed sessions.",
          "**How closely did you follow the plan?** (1 to 5). Asked without judgment, it tells you whether the plan fits their life.",
          "**Your weight this morning** (a number), only if body weight matters for their goal.",
          "**What went well?** Wins are what keep people coming back, and you'll want to mention them.",
          "**Anything you'd like to change?** The one open question that catches what the others miss.",
        ],
      },
      { h2: "Use scales, not essays" },
      {
        p: "A 1-to-5 scale takes one tap and can be compared week to week. Save open questions for one or two things only words can answer. Clients on their phone between meetings will answer taps; they'll put off a text box until they forget.",
      },
      { h2: "Send it on the same day each week" },
      {
        p: "A check-in that arrives every Sunday becomes a habit. One that arrives whenever you remember gets treated as optional. In Liftsmith, the **Send this form every week** switch on a client's report sends it for you and keeps the last twelve weeks of answers side by side.",
      },
      { cta: "coach" },
      { h2: "What to do with a low score" },
      {
        p: "A 1 or a 2 is a conversation, not a data point. Message them before the next session, ask what's going on, and adjust: fewer sets that week, an easier day, or simply a reminder that one bad week doesn't undo a good month. Liftsmith puts a low score under **What to do first** on that client's report so it doesn't get lost among everyone else's.",
      },
      { h2: "Start new clients with an intake questionnaire" },
      {
        p: "Before the first session, ask for their main goal, how long they've trained, how many days a week they can train, whether they train at a gym, and any injuries or pain to work around. It saves the first session from being a form-filling exercise, and it tells you what equipment to plan around. Read [how to keep personal training clients consistent](/blog/keep-personal-training-clients-consistent/) for what to do once they've started.",
      },
    ],
    faq: [
      ["How many questions should a weekly check-in have?", "Six or fewer. Ask only what you'd change a plan or send a message about."],
      [
        "What day should I send check-ins?",
        "The same day every week, so it becomes a habit. The end of the week works well, while it's fresh.",
      ],
    ],
  },
];
