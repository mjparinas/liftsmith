import type { Article } from "../articles";

// Blog: printable workout plans, one page per program or routine with a QR code (2026-11-27, traffic idea 5;
// docs/decisions/printable-plans.md). Only what ships, and no other app named (seo.test.ts).
export const BLOG_PRINTABLE_PLANS: Article[] = [
  {
    slug: "printable-workout-plans",
    kind: "blog",
    title: "Printable workout plans: every program on one page, free PDF",
    description:
      "Print any Liftsmith program or your own routine on one page, with sets, reps, rest, boxes to log four sessions and a QR code that opens it in the app.",
    date: "2026-11-27",
    tag: "Training",
    cta: "log",
    body: [
      {
        p: "Some lifters like paper. A sheet on a clipboard doesn't run out of battery, doesn't buzz with messages between sets and is easy to hand to a training partner. So every program on the website, and every routine you build in Liftsmith, now prints on one page.",
      },
      { h2: "What's on the page" },
      {
        ul: [
          "Every workout of the program, each exercise with its sets, reps and rest.",
          "Four columns to write in by hand, one per session, with a row for the date.",
          "How the program works, in a few short lines, so you know when to add weight.",
          "A QR code that opens the program in the app, for the days you'd rather not count plates in your head.",
        ],
      },
      {
        p: "Split programs like [push / pull / legs](/programs/ppl/print/) print with the muscles each day trains and blank rows to write in your own exercises. The sheet fits one page on Letter or A4, and a long program is scaled a touch smaller rather than spilling onto a second page.",
      },
      { h2: "Free PDFs of every program" },
      {
        p: "Open any program from the [programs page](/programs/) and tap **Print this program (free PDF)**. You can print it straight away, save it as a PDF from the print window, or download a ready PDF. Each one is there in ten languages, so the [classic 5×5](/programs/classic-5x5/print/) is as easy to print in Spanish or Japanese as in English.",
      },
      { cta: "log" },
      { h2: "Print your own routine from the app" },
      {
        p: "In the app, open one of your routines and tap **Print routine**. It works on Android, iPhone and the web app. Your sheet has one thing the website's can't: the weight the app plans for each exercise next time, worked out from your own history at your gym. Write what you actually lifted in the boxes and log it later, or just keep it as a record.",
      },
      {
        p: "The QR code on your sheet is the routine's share link, so anyone who scans it can add the same routine to their app. Only the exercises and sets travel with it, never your weights or notes.",
      },
      {
        tip: "On a phone, the print window has Save as PDF too. Handy for sending a routine to a friend who likes paper.",
      },
      { h2: "Paper or phone?" },
      {
        p: "Both work. Paper is quick and quiet. The app picks each weight for you, starts the rest timer, moves you up when you've earned a step and keeps every set for your progress. Many lifters print the plan for the gym wall and log in the app, and the QR code is there for the day you want to switch.",
      },
    ],
    faq: [
      [
        "Do the printable plans cost anything?",
        "No. Every program's PDF is free to download and print, and Print routine in the app is free too.",
      ],
      [
        "Will it fit on one page?",
        "Yes. Each sheet is laid out for Letter and A4, and a long program is scaled down a little to stay on one page.",
      ],
      ["Can I print a routine from the routine library?", "Yes. Every routine in the library has a Print this routine link on its page."],
    ],
  },
];
