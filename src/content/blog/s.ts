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
  {
    slug: "routines-with-a-warm-up-and-cool-down",
    kind: "blog",
    title: "Save a warm-up and cool-down with your routine",
    description:
      "A routine can now carry its own warm-up and cool-down, with the stretches you pick or ones chosen on the day. Share links and coaches pass them along.",
    date: "2026-11-13",
    tag: "Warm-up",
    cta: "stretch",
    body: [
      {
        p: "Workouts now run in parts: a warm-up, the lifting and a cool-down, from one Start button. The next step was obvious. If your leg day always starts with hip openers and ends with a hamstring stretch, you shouldn't have to switch them on every time. Now a saved routine can hold its own warm-up and cool-down.",
      },
      { h2: "Add them in the routine builder" },
      {
        p: "Under the exercises you'll find two switches: Warm-up first and Cool-down after. Turn one on and the app picks stretches on the day for the muscles you're about to train, or tap Choose stretches and pick your own from the library. Pick up to 12 for each. Routines with parts show them on their card, like Warm-up (4 stretches) → Lifting → Cool-down.",
      },
      { cta: "stretch" },
      { h2: "Start runs them" },
      {
        p: "Use the routine today and Today shows its warm-up and cool-down already switched on. Tap Start and the warm-up plays your stretches in order, then the lifting begins, then the cool-down after your last set. You can still turn either one off for a single workout, or Skip at any point.",
      },
      { h2: "Share links and coaches keep them" },
      {
        p: "Share a routine and the link carries its warm-up and cool-down, stretches included. Someone on an older version of the app still gets the exercises, so nothing breaks. Coaches and physios can assign a routine with parts too, and their client report shows how often each part gets done: a cool-down done in 1 of 4 workouts is a good thing to bring up at the next check-in.",
      },
      {
        p: "New to stretching around lifting? Start with [how to warm up for lifting](/blog/how-to-warm-up-for-lifting/) and the [stretches worth doing after lifting](/blog/stretches-after-lifting/).",
      },
    ],
    faq: [
      [
        "Can a routine have only a cool-down?",
        "Yes. Turn on Cool-down after and leave Warm-up first off. The workout runs the lifting, then the cool-down.",
      ],
      [
        "What if I pick no stretches?",
        "The app picks them on the day for the muscles that workout trains, the same way Today's warm-up does.",
      ],
      [
        "Does an older version of the app open a routine link with parts?",
        "Yes. It opens the exercises as a plain routine and leaves out the warm-up and cool-down.",
      ],
    ],
  },
  {
    slug: "rehab-pain-and-cool-down-heart-rate",
    kind: "blog",
    title: "Is your rehab working? Your workout now tells you",
    description:
      "Pain before and after rehab, and your heart rate in each part of a workout, now turn into coach's notes that say what to do next.",
    date: "2026-11-13",
    tag: "Recovery",
    cta: "injury",
    body: [
      {
        p: "Workouts now run in parts: a warm-up, the lifting or your rehab, and a cool-down. Each part already records something useful. Your heart rate keeps streaming through all of them, and when you're working around an injury you rate your pain between sets and at the end. Now the app reads those numbers part by part, and only speaks up when there's something to do about them.",
      },
      { cta: "injury" },
      { h2: "Pain before and after, on every workout" },
      {
        p: "If you rated an injury on the day before you trained, or more than once during the workout, History now shows the change under that workout, like Knee pain: 4 → 2. It's the quickest way to see whether a session helped or flared things up.",
      },
      {
        p: "Over a few weeks, the trend matters more than any one day. When the pain you finish with has dropped two points or more across three or more workouts, a coach's note tells you so, with the numbers, and suggests asking your physio whether you're ready for the next stage. If it's climbing instead, the note says so and suggests telling your physio and keeping the rehab easy until you've talked. Liftsmith never decides what's right for an injury. It shows you, and your physio, what you logged.",
      },
      { h2: "Your physio sees it too" },
      {
        p: "If you share pain and injuries with your coach or physio, their report on you now shows your latest rated workout's pain before and after, next to the trend and the ratings on each exercise.",
      },
      { h2: "A cool-down that actually cools you down" },
      {
        p: "With a heart rate monitor connected, the app cuts the stream at each part's start and end. If your heart rate in the last minute of the cool-down is still 100 bpm or more, and no lower than while you were lifting, in two of your last three cool-downs, you'll get a note suggesting a few more minutes and slow breathing until it settles.",
      },
      {
        p: "When the camera measures bar speed, each set now also saves the average speed of its full reps, next to the last rep's speed. Nothing new shows on screen yet; it's there so future advice on how hard a set was has better numbers to work from.",
      },
    ],
    faq: [
      [
        "Do I need to rate pain before every workout?",
        "No. If you rate it more than once during the workout, the first rating counts as before. A rating on the Injuries screen in the 12 hours before Start counts too.",
      ],
      ["Do I need a heart rate monitor?", "Only for the cool-down note. Pain before and after works without one."],
      [
        "Will the app tell me to move on to harder rehab?",
        "No. It tells you the numbers and suggests asking your physio. They decide what's next.",
      ],
    ],
  },
];
