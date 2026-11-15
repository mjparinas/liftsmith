import type { Article } from "../articles";

// Blog: rehab that gets done (Melvin, 2026-11-15, from the rehab review: "Do 1, 4, 3, 5"; docs/decisions/trainer-mode.md
// "Rehab that gets done"). Only what ships, and no other app named (seo.test.ts).
export const BLOG_REHAB_DONE: Article[] = [
  {
    slug: "rehab-that-keeps-up-with-your-physio",
    kind: "blog",
    title: "Rehab that keeps up with your physio",
    description:
      "Your physio's program now waits on Today to be saved, knows its injury, follows the times a week they asked for and reminds you when it's due.",
    date: "2026-11-15",
    tag: "Workouts",
    cta: "injury",
    body: [
      {
        p: "Home exercises from a physio work when they get done, and the hard part is rarely the exercises themselves. It's remembering, finding the program again, and knowing whether today is a rehab day. Liftsmith now takes care of those parts, so the program your physio sent turns into sessions you actually do.",
      },
      { cta: "injury" },
      { h2: "It arrives where you'll see it" },
      {
        p: "When your physio or coach sends you a program, your phone gets a notification, and Today shows a card with their name and the program. One tap on Save it puts it in your routines. See it opens the full program first, and Not now leaves it in Coaching for later.",
      },
      { h2: "It knows which injury it's for" },
      {
        p: "A rehab program now carries the area it was made for, like the knee or the lower back. If you haven't logged that injury yet, saving the program adds it, so the pain checks between exercises, your reminders and what your physio sees all follow the right injury. You can switch that off on the program's page before you save it. If the injury is already logged, the program links to it.",
      },
      {
        p: "The pain check after each exercise now asks only about that injury. A knee program won't ask about your shoulder.",
      },
      { h2: "As often as your physio asked" },
      {
        p: "Physios usually say how many times a week to do the program. That number now comes with it. Up to three times a week, Liftsmith leaves a day between sessions; from four, it's daily until the week's count is met. Today says where you are, like 2 of 3 done in the last 7 days, as your physio asked.",
      },
      {
        p: "On a training day the rehab sits under the lifting, as its own part of the workout. On a rest day, or once today's workout is done, Today shows it as a card with Do it today, which sets it up as the day's workout with one Start button.",
      },
      { h2: "A reminder on the days it's due" },
      {
        p: "On the Android and iPhone apps, a notification at your usual workout time says when the rehab is due, on days without a workout reminder. It stops once the week's count is met or the injury is marked healed. Rehab reminders have their own switch in Settings › Reminders.",
      },
      {
        tip: "Liftsmith shows what you log and when the program is due. It doesn't diagnose or treat anything. If something hurts, stop and tell your physio.",
      },
    ],
  },
];
