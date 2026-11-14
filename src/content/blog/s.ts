import type { Article } from "../articles";

// Blog, part nineteen: workouts with parts (stage 5 adds rehab beside the lifting and cardio parts) (Melvin, 2026-11-13; docs/decisions/sessions-with-parts.md). A workout runs
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
  {
    slug: "rehab-and-cardio-in-the-same-workout",
    kind: "blog",
    title: "Rehab and cardio, in the same workout as your lifting",
    description:
      "Your physio's rehab can now run right after your lifting on the days it's due, and cardio can follow it, all from one Start button.",
    date: "2026-11-13",
    tag: "Workouts",
    cta: "injury",
    body: [
      {
        p: "If your physio gave you a rehab program, you had two choices until now: do it as its own workout, or squeeze it in on a rest day. Most people training around an injury do both, lifting and rehab, on the same day. Now that's one workout. Your rehab runs right after the lifting, and cardio can follow it, with one Start button and one entry in History.",
      },
      { cta: "injury" },
      { h2: "Rehab beside the lifting" },
      {
        p: "When your physio or coach has given you a rehab routine, Today shows it under the lifting as a Rehab row with a switch and about how long it takes. It switches itself on when you have an injury logged and you haven't done the rehab today or yesterday, which keeps it to about every other day, or three times a week. The line under it says when you last did it. Flip it off for today if you'd rather not, or on if you want an extra session.",
      },
      {
        p: "The rehab exercises run as your physio wrote them: the same exercises and sets, with the reps you did last time, and the pain check after each one. Injury mode never changes them. Those sets are kept apart from your lifting, so a light set of glute bridges for your knee never holds back the glute bridges in your main program, and they don't count against your recovery.",
      },
      { h2: "Cardio after the lifting" },
      {
        p: "A Cardio row sits under the lifting too. Switch it on and pick the machine and how long, all by tap: a stationary bike, rower, treadmill, cross trainer or whatever your gym has, and 10, 15, 20 or 30 minutes. The first time it suggests 15 minutes; after that it starts from what you did last time. It logs like any cardio set, with distance where it means something, and a Bluetooth bike or rower can fill it in for you if you use that lab.",
      },
      {
        p: "Routines can carry cardio too. In the routine builder, turn on Cardio after and choose the machine and minutes. The routine's card reads Lifting → Cardio (Rowing machine), and the cardio travels in routine links and in routines from your coach.",
      },
      { h2: "One workout, in parts" },
      {
        p: "The workout screen says which part you're on, like Rehab · 2 of 3, and History shows how long each part took. If you're running short on time, Finish goes straight to your cool-down and leaves out the parts you didn't reach. Health Connect and Apple Health get the workout with each part in it, and a cardio part is filed as what it was: biking, rowing, running, walking and so on.",
      },
      {
        tip: "Rehab is never a reason to skip what your physio asked for. If something hurts, stop and tell them. Liftsmith shows what you logged; your physio decides what's next.",
      },
    ],
    faq: [
      [
        "Does the rehab have to come after the lifting?",
        "In one workout, yes: lifting, then rehab, then cardio, then the cool-down. You can still do the rehab routine on its own any day by picking it as the day's routine.",
      ],
      [
        "Does cardio after lifting count for my weekly goal?",
        "It's part of the same workout, so the workout counts once, as it always did.",
      ],
      ["Do I need a physio to use cardio parts?", "No. Cardio is open to everyone, free."],
    ],
  },
  {
    slug: "workout-length-is-the-whole-workout",
    kind: "blog",
    title: "Workout length now means the whole workout",
    description:
      "Set 45 minutes and you get 45 minutes: the warm-up, cardio and cool-down now take their time out of the lifting, and a thin bar shows where it goes.",
    date: "2026-11-14",
    tag: "Workouts",
    cta: "plan",
    body: [
      {
        p: "The Workout length slider on Today used to size only the lifting. Set it to 25 minutes, turn on a warm-up, some cardio and a cool-down, and you were really in for about 45. That's not what anyone means by a 25-minute workout, so we changed it. The slider now sets the whole workout, from the first stretch to the last.",
      },
      { cta: "plan" },
      { h2: "Parts take their minutes from the lifting" },
      {
        p: "Turn on a warm-up, cardio, your physio's rehab or a cool-down, and its minutes come out of the lifting. At 45 minutes with a 5-minute warm-up, 10 minutes of cardio and a 5-minute cool-down, the plan fills about 25 minutes with lifting. Turn the cardio off and the lifting gets those 10 minutes back. With nothing else on, the lifting gets the full length, as before.",
      },
      { h2: "A thin bar shows where the time goes" },
      {
        p: "Under the slider, a thin bar split by colour shows each part: warm-up, lifting, rehab, cardio and cool-down, with the minutes written underneath, like Warm-up 5 min · Lifting 25 min · Cardio 10 min · Cool-down 5 min. It only appears when something besides lifting is on, and it moves as you slide.",
      },
      { h2: "Lifting keeps at least 15 minutes" },
      {
        p: "If the other parts would squeeze the lifting below 15 minutes, the cardio shrinks first, never below 5 minutes, and a short line under the bar says so. If that still isn't enough, the lifting keeps its 15 minutes and the line tells you the workout will run a little longer than the slider. You can always shorten the cardio yourself with its minute chips, and the lifting gets the time back.",
      },
      {
        tip: "Short on time today? Slide the length down first, then switch off the parts you can skip. The lifting is planned around what's left, so the most useful exercises stay in.",
      },
    ],
    faq: [
      [
        "Does this change anything if I only lift?",
        "No. With no warm-up, cardio, rehab or cool-down switched on, the lifting gets the whole length, as it always did.",
      ],
      [
        "Do saved routines follow the slider?",
        "No. A routine runs the exercises and sets you saved, so its length is what it is. The slider sizes the adaptive plan.",
      ],
    ],
  },
];
