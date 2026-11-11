// "Liftsmith for …" pages (/apps/<slug>/): one per kind of lifter or need. See src/content/landings.ts.
import type { Landing } from "../landings";

const END_PLAN = {
  title: "Your next workout, already planned",
  body: "Open the app and today's workout is ready: exercises, sets, weights and rest, picked for your gym, your recovery and your time.",
};

export const LANDINGS_APPS: Landing[] = [
  {
    slug: "workout-tracker",
    group: "apps",
    name: "Workout tracker",
    title: "Workout tracker app that plans your next set",
    description:
      "A workout tracker and gym log that logs a set in one tap, pre-fills the next one, starts the rest timer itself and plans tomorrow from today. Free, no ads.",
    h1: "The workout tracker that fills itself in",
    intro:
      "Most gym logs are a spreadsheet with a timer. Liftsmith logs a set in **one tap**, pre-fills the next, starts your rest on its own, and uses what you logged to plan your next workout.",
    screen: "workout",
    screenAlt: "The workout screen: the current set with its weight and reps, plates for each side and a Log set button",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Logging that keeps up with you",
        p: [
          "Every set arrives pre-filled with the weight and reps you planned. If you did them, tap **Log set** and you're resting. If you didn't, nudge the numbers with the − and + buttons (hold them to go faster) and log. You almost never type.",
          "The rest timer starts itself and counts down on your lock screen, so you can put the phone away. The next set is waiting when you pick it back up.",
        ],
        ul: [
          "Barbell sets show the plates for each side, from the plates your gym actually has",
          "Warm-up sets are added for you and kept out of your stats",
          "Drop sets and rest-pause sets are one tap during rest, and supersets link exercises in your routines",
          "Cardio logs time and distance, and timed holds log seconds",
        ],
      },
      {
        h2: "A log that does something with your sets",
        p: [
          "A workout log is only worth keeping if it changes what you do next. Liftsmith reads every set to estimate your max on each lift, count your hard sets per muscle each week, and spot lifts that have stalled. With Pro, it uses all of that to set the weight and reps for your next session.",
          "Every recommendation says why in a short line: you hit all your reps last time, your readiness is low today, or it's the last hard week before a deload.",
        ],
      },
      {
        h2: "Your history, your data",
        p: [
          "Everything works offline with no account. Sign in to sync between your phone, tablet and the [web dashboard](/me/). Export a CSV or a full backup any time, and bring your history in from another tracker's CSV export ([see how to switch](/compare/)).",
        ],
      },
    ],
    mid: {
      title: "Log your next workout in one tap a set",
      body: "Free to start, works offline, and no account needed.",
      button: "Start logging",
    },
    end: END_PLAN,
    faq: [
      [
        "Is the workout tracker free?",
        "Yes. Logging, the rest timer, plate math, the lock-screen countdown and every fixed program are free. Pro adds workouts planned for you, automatic weights and reps, the recovery map and advanced stats.",
      ],
      [
        "Does it work without internet?",
        "Yes. Everything is saved on your phone first and syncs when you're back online, so a gym in a basement is fine.",
      ],
      [
        "Can I use my own routines?",
        "Yes. Build routines from the 300-exercise library, share them as a link, or let Liftsmith plan each workout for you.",
      ],
      ["Can I import my old workouts?", "Yes, from another tracker's CSV export or a Liftsmith backup, in Settings › Data."],
    ],
    links: [
      { href: "/blog/how-to-track-your-workouts/", label: "how to track your workouts so they actually improve" },
      { href: "/exercises/", label: "the exercise library" },
      { href: "/pricing/", label: "pricing" },
    ],
  },
  {
    slug: "strength-training",
    group: "apps",
    name: "Strength training app",
    title: "Strength training app with progressive overload",
    description:
      "A weight lifting app that plans progressive overload for you: training blocks with reps in reserve, deloads, and the right weight for every set.",
    h1: "A strength training app that knows when to add weight",
    intro:
      "Getting stronger is simple on paper: lift a bit more over time, and back off before you burn out. Liftsmith does that arithmetic for every lift, every session, so you only have to lift.",
    screen: "today",
    screenAlt: "Today's planned workout with each exercise, its sets and the reason it was picked",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Progressive overload, worked out for you",
        p: [
          "When you hit the top of your rep range with reps to spare, the weight goes up next time, by a jump your plates can actually make. When you miss, it holds or comes down a little. That's [progressive overload](/guides/progressive-overload/), done set by set instead of by guesswork (Pro).",
          "Training runs in blocks: a few weeks where sets get harder (fewer [reps in reserve](/guides/reps-in-reserve/) each week), then a [deload week](/guides/deload-week/) to let fatigue drop so the strength shows. If you're more tired than the plan expected, a deload is offered early.",
        ],
      },
      {
        h2: "Built around the big lifts",
        p: [
          "Squats, presses, hinges and rows come first in each workout, with smaller lifts after. Every barbell set shows the plates for each side, and your estimated max on each lift updates from every set you log, no testing day needed.",
        ],
        ul: [
          "Fixed programs if you like a plan you can follow to the letter, from classic 5×5 up (free)",
          "Adaptive workouts that fit your gym, your time and your recovery (Pro)",
          "Strength standards and a DOTS score from your own lifts",
        ],
      },
      {
        h2: "Push, as planned or go easy",
        p: [
          "Some days you're flying and some days you slept four hours. With Pro, Liftsmith reads sleep, heart rate variability and resting heart rate from Health Connect or Apple Health, plus a quick how-do-you-feel, and makes today's call: push, as planned or go easy. The weights follow.",
        ],
      },
    ],
    mid: {
      title: "Get stronger without the spreadsheet",
      body: "Tell Liftsmith your equipment and your goal, and your first plan is ready in under a minute.",
      button: "Plan my training",
    },
    end: {
      title: "Lift more, guess less",
      body: "Liftsmith turns every set you log into the right weight for the next one, and backs off before fatigue catches up.",
    },
    faq: [
      [
        "How does the app decide how much weight to lift?",
        "From your recent sets: your estimated max on that lift, the rep range for the exercise and how many reps in reserve this week calls for. Your very first weights come from a short setup, or from lifts you already know.",
      ],
      [
        "Is it good for beginners?",
        "Yes. Beginners get bigger, faster jumps while they're adding weight every session, and the plan slows down as progress does.",
      ],
      [
        "How many days a week do I need?",
        "Two to six. Pick how many days and how long each workout should be, and the plan fits. See [how many days a week to lift](/blog/how-many-days-a-week-to-lift/).",
      ],
    ],
    links: [
      { href: "/guides/progressive-overload/", label: "progressive overload" },
      { href: "/tools/strength-standards/", label: "strength standards" },
      { href: "/blog/linear-vs-double-progression/", label: "linear vs double progression" },
    ],
  },
  {
    slug: "5x5",
    group: "apps",
    name: "Free 5×5 app",
    title: "Free 5x5 app: the classic program, tracked",
    description:
      "Run the classic 5x5 workout free: A and B days, automatic weight jumps, a deload after three misses, plates for every set and a lock-screen rest timer.",
    h1: "The classic 5×5, free, with every weight worked out",
    intro:
      "Three lifts a day, five sets of five, a little more weight each session. The **classic 5×5** is free in Liftsmith, with the jumps, the deloads and the plate math handled for you.",
    screen: "workout",
    screenAlt: "A squat set of five with the weight and the plates for each side of the bar",
    plan: "Free",
    sections: [
      {
        h2: "How the 5×5 runs in Liftsmith",
        p: [
          "You alternate two workouts. Workout A is squat, bench press and barbell row; workout B is squat, overhead press and deadlift (one set of five). Every lift goes up 2.5 kg (5 lb) each session you complete it, and the deadlift goes up 5 kg (10 lb).",
          "Miss your reps and you repeat the weight next time. Miss three sessions in a row and the lift comes down 10%, so you can build back up with better form. It's all automatic, so you just show up and lift what's on the screen.",
        ],
      },
      {
        h2: "Made for heavy sets of five",
        ul: [
          "Plates for each side of every set, from the plates your gym has, including small jumps",
          "Rest timer that starts itself and counts down on the lock screen",
          "Warm-up sets before each lift, ramping to your working weight",
          "Your estimated max on each lift climbing session by session",
        ],
        p: [
          "When the 5×5 stops moving, there are free programs to graduate to: a ramping 5×5 with heavy, light and top-set days, 5×5 with arm work, tiered progression and training max waves.",
        ],
      },
      {
        h2: "Where to start",
        p: [
          "If you're new, start light: an empty bar on the press and row is fine. Starting too heavy is the most common reason 5×5 stalls early. Our guide to [the 5×5 workout](/blog/5x5-workout-for-beginners/) walks through the first weeks, and the [warm-up calculator](/tools/warm-up-calculator/) shows what to do before your first heavy set.",
        ],
      },
    ],
    mid: {
      title: "Start your 5×5 today",
      body: "Pick the classic 5×5 in setup and your first workout, with every weight, is ready.",
      button: "Start the 5×5",
    },
    end: {
      title: "Five sets of five, nothing to work out",
      body: "Liftsmith tracks the jumps, the misses and the deloads, and puts the plates for each side on the screen.",
    },
    faq: [
      [
        "Is the 5x5 program really free?",
        "Yes. Every fixed program is free, with no limit on workouts. Pro is only for adaptive workouts, the recovery map and advanced stats.",
      ],
      [
        "What happens when I miss reps?",
        "You repeat the weight next session. After three missed sessions in a row on a lift, it drops 10% and builds back up.",
      ],
      [
        "Can I swap an exercise?",
        "Yes. A swap keeps the lift's progress, so swapping barbell rows for another row doesn't reset anything.",
      ],
    ],
    links: [
      { href: "/blog/5x5-workout-for-beginners/", label: "the 5×5 workout for beginners" },
      { href: "/blog/how-much-weight-should-i-lift/", label: "finding your starting weights" },
      { href: "/tools/plate-calculator/", label: "the plate calculator" },
    ],
  },
  {
    slug: "powerlifting",
    group: "apps",
    name: "Powerlifting app",
    title: "Powerlifting app: squat, bench, deadlift and DOTS",
    description:
      "Train the squat, bench and deadlift in blocks with reps in reserve and deloads, track estimated maxes and your DOTS score, and load the bar right every set.",
    h1: "For lifters who care about the big three",
    intro:
      "Squat, bench press and deadlift, trained in blocks, with your estimated max and **DOTS score** kept current from every set you log, not just on test day.",
    screen: "progress",
    screenAlt: "Progress screen with estimated one-rep max trends for each lift",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Strength numbers without a max-out day",
        p: [
          "Every set you log updates your estimated one-rep max for that lift, weighting recent sets and sets closer to failure more. Your total and [DOTS score](/tools/dots-calculator/) follow, so you can see a meet-style number climbing through a block.",
          "Advanced stats (Pro) chart each lift's estimated max over time and show which lifts are moving and which have stalled.",
        ],
      },
      {
        h2: "Programming that respects fatigue",
        p: [
          "Free programs include ramping 5×5, tiered progression and training max waves (a percentage-based monthly cycle). Or let Liftsmith plan each session (Pro): blocks where reps in reserve step down each week, then a deload, with an early deload offered when missed reps pile up.",
        ],
        ul: [
          "Plates for each side of every set, from your own plates, including fractional plates",
          "A rest timer that counts down on the lock screen, with +30 s when a heavy set needs it",
          "The [RPE chart](/tools/rpe-chart/) built in: set weights come from reps in reserve targets",
        ],
      },
      {
        h2: "When a lift stalls",
        p: [
          "No new best on a lift for three weeks? The plateau detective (Pro) suggests the likely cause and a three-week fix you can start in one tap, then tells you whether it worked. Several lifts stalling at once is fatigue, and gets a deload instead.",
        ],
      },
    ],
    mid: {
      title: "Track your total from every set",
      body: "Liftsmith estimates your squat, bench and deadlift from your training and keeps your DOTS score up to date.",
      button: "Start free",
    },
    end: {
      title: "Build a bigger total",
      body: "Blocks, deloads and the right weight for every set, so the squat, bench and deadlift keep moving.",
    },
    faq: [
      [
        "Does it support RPE and RIR?",
        "Yes. Liftsmith plans sets by reps in reserve (RIR), which is 10 minus RPE. You can mark how many reps you had left after any set.",
      ],
      ["Does it work in pounds?", "Yes, kilograms or pounds, with the plates your gym has in either."],
      [
        "Can I follow a percentage program?",
        "Yes. Training max waves runs a monthly cycle from a training max at 90% of your estimated max, and other fixed programs are free too.",
      ],
    ],
    links: [
      { href: "/blog/how-to-increase-your-squat/", label: "how to increase your squat" },
      { href: "/blog/how-to-increase-your-bench-press/", label: "your bench press" },
      { href: "/blog/how-to-increase-your-deadlift/", label: "your deadlift" },
    ],
  },
  {
    slug: "bodybuilding",
    group: "apps",
    name: "Bodybuilding app",
    title: "Bodybuilding app that counts sets per muscle",
    description:
      "Build muscle with weekly sets per muscle, double progression, a 3D recovery map and push pull legs or upper lower splits that adapt to your recovery.",
    h1: "Build muscle with every set counted",
    intro:
      "Muscle grows from enough hard sets, spread across the week, with more weight or reps over time. Liftsmith counts your **weekly sets per muscle** and plans the next workout to fill the gaps.",
    screen: "recovery",
    screenAlt: "The recovery map: a 3D figure with each muscle coloured by how recovered it is",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Volume you can see",
        p: [
          "Every hard set counts toward the muscles it trains: fully for the main movers, partly for the helpers. Advanced stats (Pro) show each muscle's sets this week against a sensible range, so you know if your back is getting 6 sets or 16. See [how many sets per week to build muscle](/blog/how-many-sets-per-week-to-build-muscle/).",
          "The 3D recovery map (Pro) shows which muscles are fresh and which are still recovering, and the planner trains the fresh ones first.",
        ],
      },
      {
        h2: "Splits that adapt",
        p: [
          "Pick [push pull legs](/blog/push-pull-legs-split/) or an [upper lower split](/blog/upper-lower-split/) and Liftsmith fills each day with exercises for that day's muscles, skipping any that haven't recovered (Pro). Or build your own routines and let the app set the weights.",
        ],
        ul: [
          "Double progression: add reps across the range, then add weight",
          "Drop sets and rest-pause sets in a tap during rest, and supersets in your routines",
          "300 exercises with 3D demos, including cables and machines",
          "Mark muscles as a priority to give them more sets",
        ],
      },
      {
        h2: "Your physique, tracked",
        p: [
          "Log body weight, body fat and tape measurements for nine sites, and keep progress photos on your phone. A coach's note speaks up when weight drops faster than 1% a week or body fat creeps up.",
        ],
      },
    ],
    mid: {
      title: "See your sets per muscle",
      body: "Liftsmith counts every hard set and plans more for the muscles that are behind.",
      button: "Start free",
    },
    end: {
      title: "More muscle, less guesswork",
      body: "Enough sets for every muscle, the right weight for every set, and a plan that waits for you to recover.",
    },
    faq: [
      [
        "How many sets per muscle should I do?",
        "Most people grow well on about 10 to 20 hard sets per muscle a week, split over two or more sessions. Start near the low end and add sets if a muscle lags.",
      ],
      ["Can I focus on one muscle?", "Yes. Mark it as a priority in Settings and it gets more weekly sets."],
      ["Does it track progress photos?", "Yes. Photos stay on your phone and never sync, and you can compare them side by side."],
    ],
    links: [
      { href: "/blog/how-many-reps-to-build-muscle/", label: "how many reps to build muscle" },
      { href: "/blog/drop-sets-and-rest-pause-sets/", label: "drop sets and rest-pause sets" },
      { href: "/muscles/", label: "exercises by muscle" },
    ],
  },
  {
    slug: "home-gym",
    group: "apps",
    name: "Home workout app",
    title: "Home workout app for dumbbells, bands or a rack",
    description:
      "A home workout app that only plans exercises your kit allows: dumbbells only, bands, a rack and barbell, or no equipment, with the right weight for each set.",
    h1: "Workouts for the equipment you actually own",
    intro:
      "Tell Liftsmith what's in your garage or spare room, down to which dumbbells you have, and every workout uses **only that kit**, with weights you can actually make.",
    screen: "today",
    screenAlt: "Today's workout planned for a home gym with dumbbells and a bench",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Set up your gym once",
        p: [
          "Choose a starting point (home gym, dumbbells only, or bodyweight), then tick off what you have: rack, bench, pull-up bar, bands, kettlebells, and the exact dumbbells and plates. Have a commercial gym too? Add both, and Liftsmith can pick the right one from your location.",
          "Weights are rounded to what you own, so a plan never asks for a 17 kg dumbbell you don't have. Adjustable dumbbells work too: pick their set and the planner uses the weights they make.",
        ],
      },
      {
        h2: "Less kit, still progressive",
        p: [
          "With lighter equipment, progress comes from reps, slower tempo, harder variations and single-leg work, not just bigger weights. The planner (Pro) moves you along those, and swaps in [alternatives](/exercises/bench-press/alternatives/) when an exercise needs gear you don't have.",
        ],
        ul: [
          "[Dumbbell exercises](/equipment/dumbbells/), [kettlebell exercises](/equipment/kettlebells/) and [resistance band exercises](/equipment/bands/)",
          "Bodyweight skill ladders, from push-ups to pistol squats (free)",
          "Short workouts: pick 20, 30 or 45 minutes and the plan fits",
        ],
      },
      {
        h2: "Building a home gym?",
        p: [
          "Our guide to a [home gym on a budget](/blog/home-gym-on-a-budget/) covers what to buy first. Start with adjustable dumbbells and a bench, and add a rack later.",
        ],
      },
    ],
    mid: {
      title: "Plan with my equipment",
      body: "Set up your home gym in a minute and your first workout uses only what you own.",
      button: "Set up my gym",
    },
    end: {
      title: "A real program for a small gym",
      body: "Liftsmith plans around your kit, your time and your recovery, and moves the weight or reps forward every session.",
    },
    faq: [
      [
        "Can I train with only dumbbells?",
        "Yes. Pick dumbbells only in setup and every exercise uses dumbbells and, if you have one, a bench.",
      ],
      [
        "What about no equipment at all?",
        "The bodyweight setup plans push-ups, squats, lunges, rows and core work with progressions, so you can train anywhere.",
      ],
      ["Can I have more than one gym?", "Yes. Add your home and a commercial gym; Liftsmith can switch based on where you are."],
    ],
    links: [
      { href: "/blog/home-gym-dumbbell-workout/", label: "dumbbell-only home workouts" },
      { href: "/blog/no-equipment-strength-workout/", label: "strength training with no equipment" },
      { href: "/blog/resistance-band-workout/", label: "a resistance band workout" },
    ],
  },
  {
    slug: "calisthenics",
    group: "apps",
    name: "Calisthenics app",
    title: "Calisthenics app with progressions you can follow",
    description:
      "Bodyweight training with skill ladders for pull-ups, push-ups, dips, squats and core: step up when you hit 3×8, with holds timed and 3D demos.",
    h1: "Bodyweight strength, one step at a time",
    intro:
      "Calisthenics gets hard by changing the exercise, not the weight. Liftsmith's **bodyweight skill ladders** tell you which step you're on and when you've earned the next one.",
    screen: "workout",
    screenAlt: "A bodyweight set with reps to do and the rest timer",
    plan: "Free",
    sections: [
      {
        h2: "Ladders for every movement",
        p: [
          "Each ladder runs from an easy version to a hard one: incline push-ups to one-arm work, assisted squats to [pistol squats](/exercises/pistol-squat/), negatives to [pull-ups](/exercises/pull-up/). You do 3 sets of 5 to 8, and once you hit 3×8 the next workout moves you up a step. Holds like the plank run 20 to 60 seconds before they step up.",
          "Ladders cover the pull-up, push-up, dip, squat, hinge, row and core. The program is free.",
        ],
      },
      {
        h2: "See every step done right",
        p: [
          "Every exercise has a 3D demo you can turn around, with the working muscles lit, so you can check a [push-up](/exercises/push-up/) or an [inverted row](/exercises/inverted-row/) from the side before you try it.",
        ],
        ul: [
          "Timed holds count down for you",
          "Weighted calisthenics: add a belt or vest and log the extra weight",
          "Mix in rings, a dip station or bands if you have them",
        ],
      },
      {
        h2: "Where to begin",
        p: [
          "Start each ladder where you can do 3 clean sets of 5. Our guide to [calisthenics progressions](/blog/calisthenics-progressions/) shows the steps from first push-up to pistol squat.",
        ],
      },
    ],
    mid: {
      title: "Start your first ladder",
      body: "Pick bodyweight skills in setup and Liftsmith finds your starting step on each movement.",
      button: "Start free",
    },
    end: {
      title: "Get strong anywhere",
      body: "No gym needed: a plan that moves you up a step whenever you've earned it.",
    },
    faq: [
      [
        "Is it good for complete beginners?",
        "Yes. Every ladder starts with an easy step, like wall or incline push-ups and assisted squats.",
      ],
      ["Can I add weight later?", "Yes. Log the extra weight for any bodyweight exercise, and it counts in your stats."],
      ["How often should I train?", "Three or four days a week works well, with each movement trained two or three times."],
    ],
    links: [
      { href: "/blog/calisthenics-progressions/", label: "calisthenics progressions" },
      { href: "/blog/no-equipment-strength-workout/", label: "strength training with no equipment" },
      { href: "/equipment/pullup-bar/", label: "pull-up bar exercises" },
    ],
  },
  {
    slug: "workout-generator",
    group: "apps",
    name: "Workout generator",
    title: "Workout generator that adapts to your recovery",
    description:
      "A workout generator that builds today's session from your equipment, recovery, readiness and time, with weights and reps for every set and a reason for each.",
    h1: "A workout generator that knows how you slept",
    intro:
      "Most workout generators hand you a random list. Liftsmith builds **today's workout** from what your muscles have recovered from, how ready you are, the equipment you have and the minutes you've got, and explains each choice.",
    screen: "today",
    screenAlt: "Today's generated workout with a short reason under each exercise",
    plan: "Pro",
    sections: [
      {
        h2: "What goes into each workout",
        ul: [
          "**Recovery:** muscles you trained hard two days ago wait; fresh ones go first",
          "**Readiness:** sleep, heart rate variability and resting heart rate from Health Connect or Apple Health, plus how you feel, decide push, as planned or go easy",
          "**Your gym:** only exercises your equipment allows, with weights your plates and dumbbells can make",
          "**Your time:** pick the length and the plan fits it, warm-ups and rest included",
          "**Your block:** which week of the training block it is, and whether a deload is due",
          "**Variety:** a setting for how much exercises change from week to week",
        ],
        p: [],
      },
      {
        h2: "Not a chatbot",
        p: [
          'Liftsmith isn\'t a language model writing workouts. It\'s a planner built on training rules from research: weekly sets per muscle, rep ranges, reps in reserve, recovery time and progressive overload. That makes it repeatable, and every recommendation comes with a short, honest reason, like "Chest is 90% recovered" or "You hit all your reps last time".',
        ],
      },
      {
        h2: "You stay in charge",
        p: [
          "Swap any exercise for one that trains the same muscles, change the length mid-workout, or skip a day and the plan reshuffles. Prefer a fixed plan? Every classic program is free, and your own routines get the same automatic weights.",
        ],
      },
    ],
    mid: {
      title: "Generate today's workout",
      body: "Answer a few questions about your gym and goals, and your first workout is ready in under a minute. Pro comes with a free trial.",
      button: "Generate my workout",
    },
    end: END_PLAN,
    faq: [
      [
        "Is it an AI workout generator?",
        "It's a planner built on training rules, not a chatbot. It uses your own data (recovery, readiness, history) to choose exercises and weights, and says why for each.",
      ],
      [
        "Do I need a smartwatch?",
        "No. Readiness works from a quick how-do-you-feel. A watch or ring that writes sleep and heart rate to Health Connect or Apple Health makes it sharper.",
      ],
      ["What if I don't like an exercise?", "Swap it in a tap for one that trains the same muscles with your equipment."],
    ],
    links: [
      { href: "/blog/hrv-and-training-readiness/", label: "HRV and training readiness" },
      { href: "/blog/how-long-do-muscles-take-to-recover/", label: "how long muscles take to recover" },
      { href: "/features/recovery-map/", label: "the recovery map" },
    ],
  },
  {
    slug: "beginners",
    group: "apps",
    name: "Gym app for beginners",
    title: "Gym app for beginners: know what to do every day",
    description:
      "New to the gym? Liftsmith tells you what to do each day, how much to lift and how to do each exercise, with 3D demos, warm-ups and starting weights.",
    h1: "New to the gym? Walk in knowing exactly what to do",
    intro:
      "No program to research, no weights to guess. Liftsmith gives a beginner **today's workout**, how to do each exercise, how heavy to go and how long to rest, then adjusts as you get stronger.",
    screen: "workout",
    screenAlt: "The workout screen with the current exercise, its weight and a How to button",
    plan: "Free and Pro",
    sections: [
      {
        h2: "Your first weeks, planned",
        p: [
          "Setup asks about your experience, equipment and how many days you can train. Starting weights come from your body weight and experience, and lean light on purpose: the first weeks are for learning the movements. Beginners then add weight quickly, often every session.",
          "Or pick a simple fixed program like the classic 5×5 or novice 3×5, free, and follow it exactly.",
        ],
      },
      {
        h2: "How to do every exercise",
        p: [
          "Tap **How to** on any exercise for its setup, three cues and a 3D demo you can turn around. The [exercise library](/exercises/) has all 300 on the web too.",
        ],
        ul: [
          "Warm-up sets added before heavy lifts",
          "Plates for each side of the bar, so you never do gym math",
          "A rest timer that starts itself",
          "Short reasons for every choice, so you learn why as you go",
        ],
      },
      {
        h2: "Making it a habit",
        p: [
          "A weekly goal, streaks with freezes for the weeks life gets in the way, achievements and gentle reminders on the days you planned. Miss a week and the next workout starts a little lighter so you ease back in.",
        ],
      },
    ],
    mid: {
      title: "Get your first workout",
      body: "A minute of setup, then a workout planned for your gym and your level.",
      button: "Start free",
    },
    end: {
      title: "Skip the confusion, start lifting",
      body: "Liftsmith plans each workout and shows you how to do every exercise, so day one feels like day thirty.",
    },
    faq: [
      [
        "How heavy should I start?",
        "Lighter than you think. Setup suggests starting weights, and our guide to [starting weights](/blog/how-much-weight-should-i-lift/) explains how to find yours.",
      ],
      [
        "How many days a week should a beginner lift?",
        "Two or three full-body days is plenty to start. Liftsmith fits whatever you choose.",
      ],
      [
        "Is it safe to train when I'm sore?",
        "Mild soreness is normal. Liftsmith trains recovered muscles first; see [training when sore](/blog/should-you-train-when-sore/).",
      ],
    ],
    links: [
      { href: "/blog/beginner-gym-workout-plan/", label: "your first 8 weeks in the gym" },
      { href: "/blog/how-to-warm-up-for-lifting/", label: "how to warm up" },
      { href: "/blog/strength-training-for-women/", label: "strength training for women" },
    ],
  },
];
