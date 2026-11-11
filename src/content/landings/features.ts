// One page per feature (/features/<slug>/). See src/content/landings.ts.
import type { Landing } from "../landings";

const END = {
  title: "Let the app handle the details",
  body: "Liftsmith plans the workout, loads the bar, times the rest and keeps score, so all you do is lift.",
};

export const LANDINGS_FEATURES: Landing[] = [
  {
    slug: "rest-timer",
    group: "features",
    name: "Lock-screen rest timer",
    title: "Rest timer app with a lock-screen countdown",
    description:
      "A rest timer that starts itself after each set and counts down on your lock screen with the next set, plates and a +30 s button. Free on Android and iPhone.",
    h1: "A rest timer you never have to start",
    intro:
      "Log a set and the rest starts on its own. Lock your phone and the **countdown keeps going on the lock screen**, with your next set and the plates to load.",
    screen: "rest",
    screenAlt: "The rest screen counting down, with the next set and its plates",
    plan: "Free",
    sections: [
      {
        h2: "On your lock screen, not in your way",
        p: [
          "On Android, Liftsmith shows an ongoing notification with the countdown, the next set, the plates, your heart rate and the workout's progress, with **Log set** and **+30 s** buttons. On Android 16 it's a Live Update with the time left in the status bar chip.",
          "On iPhone it's a Live Activity on the lock screen and in the Dynamic Island, with the same countdown, next set and buttons. When rest is over you get a chime and a buzz, even with the phone in your pocket.",
        ],
      },
      {
        h2: "The right rest for each set",
        p: [
          "Heavy compound lifts get longer rest than small isolation work, and you can set your own rest for any exercise. Short on time? Take less, and the plan knows. See [how long to rest between sets](/blog/how-long-to-rest-between-sets/).",
        ],
        ul: [
          "+30 s from the lock screen when you need a bit more",
          "A polite screen reader announcement at the start, at ten seconds left and at the end",
          "On your wrist too, with the Wear OS and Apple Watch apps",
        ],
      },
    ],
    mid: {
      title: "Try the lock-screen timer",
      body: "Free, with no account. Log a set and lock your phone.",
      button: "Start a workout",
    },
    end: END,
    faq: [
      ["Is the rest timer free?", "Yes, including the lock-screen countdown and the buttons."],
      [
        "Does it work with the screen off?",
        "Yes. The countdown runs on the lock screen and the rest-over alert sounds with the phone locked.",
      ],
      ["Can I change the rest time?", "Yes, per exercise, and +30 s from the lock screen during any rest."],
    ],
    links: [
      { href: "/blog/how-long-to-rest-between-sets/", label: "how long to rest between sets" },
      { href: "/features/watch-apps/", label: "the watch apps" },
      { href: "/features/heart-rate/", label: "heart rate while lifting" },
    ],
  },
  {
    slug: "recovery-map",
    group: "features",
    name: "Recovery map",
    title: "Muscle recovery tracker with a 3D body map",
    description:
      "See which muscles are recovered and which are still fatigued on a 3D body you can turn, built from your sets, with workouts that train fresh muscles first.",
    h1: "See which muscles are ready to train",
    intro:
      "Every hard set adds fatigue to the muscles it works, and it fades over the next few days. The **recovery map** shows where each muscle stands on a 3D body you can turn.",
    screen: "recovery",
    screenAlt: "The recovery map on a 3D figure, front and back, with a legend from recovered to fatigued",
    plan: "Pro",
    sections: [
      {
        h2: "Built from your own training",
        p: [
          "Recovery is worked out from the sets you logged: how many, how hard, and how long ago, for the main movers and the muscles that helped. Big muscles and hard sets take longer to come back. Tap a muscle to see how recovered it is.",
          "The map uses dots and stripes as well as colour, so it reads for colour-blind lifters too, and there's a colour-blind safe palette in Settings.",
        ],
      },
      {
        h2: "Workouts that wait for you",
        p: [
          "The planner uses the same numbers: fresh muscles go first, and muscles that are still well short of recovered wait for another day. That's how Liftsmith can plan a sensible workout any day of the week, without a fixed split. See [how long muscles take to recover](/blog/how-long-do-muscles-take-to-recover/).",
        ],
      },
    ],
    mid: {
      title: "See your recovery map",
      body: "Log a workout and the map fills in. Pro comes with a free trial.",
      button: "Start free",
    },
    end: END,
    faq: [
      [
        "How accurate is the recovery map?",
        "It's an estimate from your training, not a blood test. It's most useful for comparing muscles and seeing the trend, and it gets better the more you log.",
      ],
      [
        "Does soreness matter?",
        "Soreness isn't a reliable sign of recovery on its own. See [should you train when sore](/blog/should-you-train-when-sore/).",
      ],
      ["Is it free?", "The recovery map is part of Pro. The free plan includes the workout logger, timer and every fixed program."],
    ],
    links: [
      { href: "/blog/how-long-do-muscles-take-to-recover/", label: "muscle recovery times" },
      { href: "/apps/workout-generator/", label: "the workout generator" },
      { href: "/muscles/", label: "exercises by muscle" },
    ],
  },
  {
    slug: "sets-per-muscle",
    group: "features",
    name: "Sets per muscle",
    title: "Track sets per muscle group per week",
    description:
      "Hard sets per muscle each week, counted fully for main movers and partly for helpers, against a sensible range, with more work for muscles that fall behind.",
    h1: "Weekly sets per muscle, counted for you",
    intro:
      "Weekly hard sets per muscle are the best simple measure of training volume. Liftsmith counts them from every set you log and shows each muscle against **a sensible range**.",
    screen: "progress",
    screenAlt: "Progress screen with this week's sets for each muscle",
    plan: "Pro",
    sections: [
      {
        h2: "Counted the way muscles work",
        p: [
          "A bench press counts as a full set for your chest and half a set for the muscles that help, like your triceps and front delts. Warm-ups don't count. The total for each muscle sits against a range of roughly 10 to 20 sets a week.",
        ],
      },
      {
        h2: "Turned into action",
        p: [
          "A number on its own doesn't help much. When a big muscle is short of its sets for two weeks running, a coach's note says so and offers to make it a priority in one tap. The planner then gives it more sets. That note is free; the full weekly chart is Pro.",
        ],
      },
    ],
    mid: {
      title: "Count my sets",
      body: "Log your workouts in Liftsmith and the weekly count fills itself in.",
      button: "Start free",
    },
    end: END,
    faq: [
      [
        "How many sets per muscle per week?",
        "About 10 to 20 hard sets for most people, split over two or more sessions. See [how many sets per week to build muscle](/blog/how-many-sets-per-week-to-build-muscle/).",
      ],
      ["What counts as a hard set?", "A working set taken within a few reps of failure. Warm-ups and very easy sets don't count."],
      ["Can I give one muscle more volume?", "Yes. Mark it as a priority and it gets more sets each week."],
    ],
    links: [
      { href: "/blog/how-many-sets-per-week-to-build-muscle/", label: "sets per week to build muscle" },
      { href: "/apps/bodybuilding/", label: "Liftsmith for bodybuilding" },
      { href: "/guides/reps-in-reserve/", label: "reps in reserve" },
    ],
  },
  {
    slug: "warm-up-sets",
    group: "features",
    name: "Warm-up sets",
    title: "Automatic warm-up sets for every heavy lift",
    description:
      "Liftsmith adds warm-up sets before your heavy lifts, ramping from the empty bar to your working weight, with plates for each and fewer once a muscle is warm.",
    h1: "Warm-ups added for you, and only when you need them",
    intro:
      "Before your first heavy lift for a muscle, Liftsmith adds a **short ramp** from the empty bar to your working weight. A later lift for the same muscles gets one feeler set, or none.",
    screen: "workout",
    screenAlt: "A warm-up set on the workout screen, marked as a warm-up",
    plan: "Free",
    sections: [
      {
        h2: "Enough to get ready, not enough to tire you",
        p: [
          "Light working weights get the empty bar and one set. Heavier ones get two or three steps, with fewer reps as the weight climbs, ending near 85% for a single on the heaviest days. Each step is a weight your plates can make, with the plates shown.",
          "Warm-ups are kept apart from your working sets, so they never count toward your stats, records or streaks. Try the same ramp in the [warm-up calculator](/tools/warm-up-calculator/).",
        ],
      },
      {
        h2: "Stretching too",
        p: [
          "Turn on a short movement warm-up before each workout, and a cool-down card after. Each stretch has a 3D demo. See [dynamic vs static stretching](/blog/dynamic-vs-static-stretching/).",
        ],
      },
    ],
    mid: {
      title: "Warm up the easy way",
      body: "Start a workout and the warm-ups are already in it.",
      button: "Start free",
    },
    end: END,
    faq: [
      [
        "Do warm-ups change from one lift to the next?",
        "Yes. The first heavy lift for a muscle gets a full ramp; a later lift for muscles that are already warm gets one feeler set on the bar, or none.",
      ],
      ["Do warm-ups count toward my volume?", "No. They're logged separately and kept out of stats."],
      ["How long should I rest between warm-ups?", "About a minute. Liftsmith times it for you."],
    ],
    links: [
      { href: "/tools/warm-up-calculator/", label: "the warm-up calculator" },
      { href: "/blog/how-to-warm-up-for-lifting/", label: "how to warm up for lifting" },
      { href: "/features/plate-math/", label: "plate math" },
    ],
  },
  {
    slug: "plate-math",
    group: "features",
    name: "Plate math",
    title: "Plate calculator app: plates drawn for every set",
    description:
      "Every barbell set shows the plates for each side, drawn in their colours, from the plates your gym has. Free, in kg or lb, with the nearest weight if needed.",
    h1: "The plates for every set, already worked out",
    intro:
      "No more adding up plates between sets. Every barbell set in Liftsmith shows **which plates go on each side**, drawn on the bar, from the plates your gym actually has.",
    screen: "workout",
    screenAlt: "A barbell set with the plates for each side drawn on the bar",
    plan: "Free",
    sections: [
      {
        h2: "Your plates, your bar",
        p: [
          "Set up your gym's bars and plates once: an Olympic bar, a women's bar, a trap bar, an EZ bar, and how many of each plate. Planned weights are rounded to totals you can actually load, so the plan never asks for 101.25 kg with no 0.625 kg plates in sight.",
          "Kilograms or pounds, with the colours lifters expect, and a quick note of what's already on the bar so you change as few plates as possible.",
        ],
      },
      {
        h2: "On the web too",
        p: [
          "The same plate math is free in your browser in the [plate calculator](/tools/plate-calculator/). Our guide on [how to load a barbell](/blog/how-to-load-a-barbell/) covers the basics.",
        ],
      },
    ],
    mid: {
      title: "Stop doing plate math",
      body: "Set up your bar and plates once; every barbell set shows its plates.",
      button: "Start free",
    },
    end: END,
    faq: [
      ["Is the plate calculator free?", "Yes, in the app and on the web."],
      ["What if my gym has odd plates?", "Set exactly which plates and how many you have. The weights are planned around them."],
      ["Does it handle trap bars and EZ bars?", "Yes. Each exercise uses the right bar, with its own weight."],
    ],
    links: [
      { href: "/tools/plate-calculator/", label: "the plate calculator" },
      { href: "/blog/how-to-load-a-barbell/", label: "how to load a barbell" },
      { href: "/equipment/barbell/", label: "barbell exercises" },
    ],
  },
  {
    slug: "watch-apps",
    group: "features",
    name: "Watch apps",
    title: "Workout app for Apple Watch and Wear OS",
    description:
      "Your workout on your wrist: the set, weight and reps or the rest countdown, heart rate from the watch, and Log set and +30 s buttons on Apple Watch and Wear OS.",
    h1: "Your workout on your wrist",
    intro:
      "Leave the phone in your bag. The **Apple Watch and Wear OS apps** show the set, the weight and reps, the rest countdown and your heart rate, with Log set and +30 s on the watch.",
    screen: "rest",
    screenAlt: "The rest countdown that the watch apps mirror",
    plan: "Free",
    sections: [
      {
        h2: "What's on the watch",
        ul: [
          "The current set: exercise, weight and reps",
          "The rest countdown, with a tap when it's over",
          "Your heart rate from the watch's own sensor, sent back to the phone",
          "**Log set** and **+30 s** buttons",
        ],
        p: ["The phone stays in charge of the plan, so the watch is fast and simple. A Garmin watch app is on its way."],
      },
      {
        h2: "Heart rate that counts",
        p: [
          "Heart rate from the watch shows live on the phone and goes into the workout's heart rate trace. See [lifting with a smartwatch](/blog/lifting-with-a-smartwatch/) for what a watch is good for in the gym.",
        ],
      },
    ],
    mid: {
      title: "Lift with your watch",
      body: "Install Liftsmith on your phone; the watch app follows your workout.",
      button: "Start free",
    },
    end: END,
    faq: [
      ["Which watches work?", "Apple Watch and Wear OS watches. Any Bluetooth heart rate strap works with the phone too."],
      ["Do I need the phone nearby?", "Yes. The phone runs the workout and the watch shows it."],
      ["Does it cost extra?", "No. The watch apps are free."],
    ],
    links: [
      { href: "/blog/lifting-with-a-smartwatch/", label: "lifting with a smartwatch" },
      { href: "/features/heart-rate/", label: "heart rate while lifting" },
      { href: "/features/rest-timer/", label: "the lock-screen rest timer" },
    ],
  },
  {
    slug: "body-tracking",
    group: "features",
    name: "Body and photos",
    title: "Track body weight, measurements and progress photos",
    description:
      "Log weight, body fat and tape measurements at nine sites, keep progress photos private on your phone, and get a note if weight or body fat moves the wrong way.",
    h1: "Weight, measurements and photos in one place",
    intro:
      "The scale only tells part of the story. Liftsmith keeps **weight, body fat, nine tape measurements and progress photos** together, and tells you when something needs a change.",
    screen: "progress",
    screenAlt: "Progress screen with a weigh-in and body trends",
    plan: "Free",
    sections: [
      {
        h2: "Log it in seconds",
        p: [
          "Weigh-ins use − and + buttons from your last reading, so there's almost no typing, with an optional body fat box under it. Weigh-ins and body fat come in automatically from Health Connect or Apple Health, which covers most smart scales.",
          "Tape measurements cover nine sites, from neck and waist to arms and calves, in centimetres or inches. Our guide on [taking body measurements](/blog/how-to-take-body-measurements/) shows where to measure.",
        ],
      },
      {
        h2: "Photos that stay yours",
        p: ["Progress photos are kept only on your phone. They never sync and never leave it. Compare your first and latest side by side."],
      },
      {
        h2: "Notes, not just numbers",
        p: [
          "When weight drops faster than 1% a week, body fat creeps up, or your waist changes, a coach's note says what it saw and what to do about it, based on your goal. See [body recomposition](/blog/body-recomposition/) and [keeping strength while losing fat](/blog/lifting-on-a-cut/).",
        ],
      },
    ],
    mid: {
      title: "Start tracking your body",
      body: "Free, private, and connected to Health Connect or Apple Health.",
      button: "Start free",
    },
    end: END,
    faq: [
      ["Do my progress photos get uploaded?", "No. Photos stay on your phone and are never synced or backed up to our servers."],
      [
        "Can it read my smart scale?",
        "If your scale writes to Health Connect or Apple Health, Liftsmith reads weight and body fat from there.",
      ],
      ["Which measurements can I track?", "Nine sites, including neck, chest, waist, hips, arms, thighs and calves."],
    ],
    links: [
      { href: "/blog/how-to-take-body-measurements/", label: "how to take body measurements" },
      { href: "/tools/tdee-calculator/", label: "the TDEE calculator" },
      { href: "/blog/health-connect-and-apple-health-for-lifters/", label: "Health Connect and Apple Health for lifters" },
    ],
  },
  {
    slug: "heart-rate",
    group: "features",
    name: "Heart rate",
    title: "Heart rate monitor app for weight training",
    description:
      "Live heart rate while you lift, from a Bluetooth strap or your watch, on screen and on the lock screen, with a trace of each workout and recovery between sets.",
    h1: "Live heart rate while you lift",
    intro:
      "Pair any **Bluetooth heart rate strap** or use your Apple Watch or Wear OS watch, and your heart rate shows during the workout, on the lock screen and on the 3D figure's beating heart.",
    screen: "rest",
    screenAlt: "Rest screen with the live heart rate",
    plan: "Free",
    sections: [
      {
        h2: "During the workout",
        p: [
          "Your heart rate shows on the workout screen with its zone, and on the lock-screen notification or Live Activity during rest. After the workout you get a trace of the whole session, so you can see how hard the conditioning work was and how quickly you came down between sets.",
        ],
      },
      {
        h2: "Over time",
        p: [
          "Resting heart rate and heart rate variability from Health Connect or Apple Health feed your daily readiness (Pro), which decides whether today is a push day, an as-planned day or an easy one. See [what heart rate tells you during weight training](/blog/heart-rate-during-weight-training/).",
        ],
      },
    ],
    mid: {
      title: "Pair your heart rate strap",
      body: "Any standard Bluetooth chest strap or arm band works, free.",
      button: "Start free",
    },
    end: END,
    faq: [
      [
        "Which heart rate monitors work?",
        "Any Bluetooth strap or arm band that uses the standard heart rate profile, plus Apple Watch and Wear OS through the watch apps.",
      ],
      ["Does it keep reading with the screen off?", "Yes, during a workout."],
      ["Is heart rate free?", "Yes. Readiness from sleep, HRV and resting heart rate is part of Pro."],
    ],
    links: [
      { href: "/blog/heart-rate-during-weight-training/", label: "heart rate during weight training" },
      { href: "/blog/hrv-and-training-readiness/", label: "HRV and readiness" },
      { href: "/features/watch-apps/", label: "the watch apps" },
    ],
  },
  {
    slug: "injury-mode",
    group: "features",
    name: "Injury mode",
    title: "Workout around an injury: train what doesn't hurt",
    description:
      "Tell Liftsmith what hurts and it plans around it: moves that load the sore area are left out or eased, with a pain rating after each workout to show the trend.",
    h1: "Keep training when something hurts",
    intro:
      "A sore shoulder doesn't have to mean a lost month. Tell Liftsmith **what hurts** and it plans around it, leaving out or easing the exercises that load that area, and tracks how it's going.",
    screen: "today",
    screenAlt: "Today's plan adjusted around a sore shoulder",
    plan: "Free",
    sections: [
      {
        h2: "How it works",
        p: [
          "Pick the area (shoulder, elbow, wrist, lower back, hip, knee, ankle and more) and how bad it is. The planner leaves out exercises that load that area heavily and eases the rest, and flags anything risky before you start. After each workout, rate the pain on a slider, and you'll see the trend over the weeks.",
          "This isn't medical advice: if pain is sharp, getting worse, or comes with numbness or swelling, see a professional.",
        ],
      },
      {
        h2: "Back to normal, gradually",
        p: [
          "As the pain eases, exercises come back in. When you mark the injury as better, your normal plan returns, starting a little lighter if you've had time off. See [training around a sore shoulder, knee or back](/blog/training-around-an-injury/).",
        ],
      },
    ],
    mid: {
      title: "Plan around what hurts",
      body: "Tap Something hurts on Today and your workout changes to suit.",
      button: "Start free",
    },
    end: END,
    faq: [
      ["Is injury mode free?", "Yes."],
      ["Does it replace a physio?", "No. It helps you keep training sensibly around a niggle. For anything serious, see a professional."],
      ["Can I have more than one injury?", "Yes. Each area is tracked separately."],
    ],
    links: [
      { href: "/blog/training-around-an-injury/", label: "training around an injury" },
      { href: "/blog/getting-back-into-lifting/", label: "getting back into lifting" },
      { href: "/exercises/bench-press/alternatives/", label: "exercise alternatives" },
    ],
  },
  {
    slug: "programs",
    group: "features",
    name: "Classic programs",
    title: "Free lifting programs: 5x5, 3x5, waves and more",
    description:
      "Follow a classic program free: 5x5, novice 3x5, ramping 5x5, tiered progression, training max waves and bodyweight skills, with every weight worked out.",
    h1: "Proven programs, every weight worked out",
    intro:
      "Prefer a plan you can follow to the letter? Liftsmith runs **seven classic programs free**, following their own rules for jumps, misses and deloads.",
    screen: "today",
    screenAlt: "Today showing the next workout of a fixed program",
    plan: "Free",
    sections: [
      {
        h2: "The programs",
        ul: [
          "**Classic 5×5:** A and B days, a little more weight every session. See [the 5×5 app](/apps/5x5/).",
          "**Novice 3×5:** squat every session, with power cleans joining after six sessions",
          "**5×5 plus arms:** the 5×5 with arm work after",
          "**Ramping 5×5:** heavy, light and top-set days, ramping up each set",
          "**Tiered progression:** heavy, medium and light tiers that each progress on their own",
          "**Training max waves:** a monthly percentage cycle from a training max",
          "**Bodyweight skills:** ladders from easy to hard on seven movements",
        ],
        p: [
          "Each is based on a well-known program and credits the original in the app. They follow their published rules rather than readiness, so you always know what's coming.",
        ],
      },
      {
        h2: "Or let it adapt",
        p: [
          "Push pull legs and upper lower splits, and fully adaptive workouts that follow your recovery and readiness, are part of Pro. You can switch any time, and a program's progress is kept.",
        ],
      },
    ],
    mid: {
      title: "Pick a program",
      body: "Choose one in setup and your first workout, weights and all, is ready.",
      button: "Start free",
    },
    end: END,
    faq: [
      ["Are the programs really free?", "Yes, every fixed program, with no limit on workouts."],
      [
        "What happens if I miss a session?",
        "Nothing breaks. After a longer break, the next session starts a little lighter and builds back up.",
      ],
      ["Can I swap exercises in a program?", "Yes. Swaps keep the lift's progress."],
    ],
    links: [
      { href: "/blog/5x5-workout-for-beginners/", label: "the 5×5 workout" },
      { href: "/blog/push-pull-legs-split/", label: "push pull legs" },
      { href: "/blog/upper-lower-split/", label: "upper lower" },
    ],
  },
];
