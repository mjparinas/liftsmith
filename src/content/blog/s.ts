import type { Article } from "../articles";

// Blog, part nineteen: workouts with parts (Melvin, 2026-11-13; docs/decisions/sessions-with-parts.md). A workout runs
// its warm-up, lifting and cool-down in order, the lock screen and watches show the part, and stretch days count for
// the streak. Only what ships, and no other app named (seo.test.ts).
export const BLOG_S: Article[] = [
  {
    slug: "workouts-with-a-warm-up-and-cool-down-built-in",
    kind: "blog",
    title: "Your workout now has parts: warm-up, lifting and cool-down in one go",
    description:
      "Start runs the warm-up, the lifting and the cool-down in order, with Skip between them. Your lock screen and watch show which part you're on.",
    date: "2026-11-13",
    tag: "Warm-up",
    cta: "stretch",
    body: [
      {
        p: "Until now, a warm-up and a cool-down sat next to your workout rather than inside it. You could do them, but they lived on their own screen, and the app had to guess afterwards which workout they belonged to. Now a workout can have parts: a warm-up, the lifting (or your rehab program) and a cool-down, run in that order from one Start button.",
      },
      { h2: "Pick the parts on Today" },
      {
        p: "Above today's exercises you'll see the parts the workout will run through. The warm-up and cool-down each have a switch, how long they take (usually four to six minutes) and a short line on why: the warm-up readies the muscles you're about to train, and the cool-down stretches them while they're still warm. The switches start from your choices in Settings › Workout, and flipping one only changes today.",
      },
      { cta: "stretch" },
      { h2: "Start runs them in order" },
      {
        p: "Tap Start and the warm-up plays first, one stretch at a time with a 3D demo and a countdown. When it ends, the lifting starts by itself. If you'd rather not, Skip goes straight to the bar. After your last set, Finish takes you on to the cool-down, and the workout ends when that's done, or when you tap Skip and finish.",
      },
      {
        p: "Your lock screen notification, the Live Activity on iPhone and your Wear OS, Apple Watch or Garmin watch all show the part you're on: the stretch, how far through you are and what comes next. While you stretch, the Log set button there does nothing, so a stray tap can't log a set you didn't do.",
      },
      { h2: "History and Health see the whole workout" },
      {
        p: "In History, each workout shows its parts with their times, so you can see that Tuesday was a five-minute warm-up, 48 minutes of lifting and a six-minute cool-down. Health Connect and Apple Health get one workout with a segment for each part, stretching and strength training, instead of separate entries.",
      },
      {
        p: "Older workouts need nothing from you. A warm-up done just before a workout, or a cool-down just after, joins it in History by time, exactly as before.",
      },
      { h2: "Stretch days keep your streak" },
      {
        p: "A stretch routine of 10 minutes or more on its own, on a rest day for example, now keeps your week streak going and earns XP. It doesn't count toward your weekly workout goal, because that goal is about training days. Read [how to warm up for lifting](/blog/how-to-warm-up-for-lifting/), the [stretches worth doing after lifting](/blog/stretches-after-lifting/) or a [rest day stretching routine](/blog/rest-day-stretching-routine/) that counts toward your streak.",
      },
    ],
    faq: [
      [
        "Do I have to do a warm-up or cool-down?",
        "No. Both are optional. Turn either off on Today for one workout, or in Settings › Workout for every workout, and Skip moves on at any point.",
      ],
      [
        "Does this change my old workouts?",
        "No. Nothing is rewritten. Older warm-ups and cool-downs are matched to the workout they were done next to when History is drawn.",
      ],
      [
        "Does stretching count toward my weekly goal?",
        "A stretch routine of 10 minutes or more keeps your streak and earns XP, but the weekly goal counts lifting workouts.",
      ],
    ],
  },
];
