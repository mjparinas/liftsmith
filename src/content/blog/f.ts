import type { Article } from "../articles";

// Blog, part six: what the newest features answer. Velocity-based training and camera rep counting
// (Labs), lifting with a smartwatch, drop sets and rest-pause, training to failure, body measurements,
// and getting your health data into one place.
export const BLOG_F: Article[] = [
  {
    slug: "velocity-based-training-with-your-phone",
    kind: "blog",
    title: "Velocity-based training with your phone camera",
    description:
      "What bar speed tells you about effort, how velocity loss predicts reps left in the tank, and how to measure it with only your phone's camera.",
    date: "2026-11-11",
    tag: "Strength",
    cta: "labs",
    body: [
      {
        p: "Velocity-based training (VBT) is a simple idea: the speed of the bar tells you how hard a set really is. When you're fresh, the first rep moves fast. As you tire, each rep slows down, and by the time you're one or two reps from failure the bar is crawling. Measure that slowdown and you get an honest read on effort, with no guessing.",
      },
      { h2: "Why bar speed beats feel" },
      {
        p: "Most programs ask you to judge effort yourself, often as [reps in reserve](/guides/reps-in-reserve/). That works, but people are notoriously bad at it, especially on sets of more than five reps or on lifts they're new to. Bar speed is a number you can't talk yourself out of. It also changes day to day with sleep and stress, so it doubles as a readiness check: if your warm-up sets are slower than usual, today isn't the day for a new best.",
      },
      { h2: "Velocity loss: the number that matters" },
      {
        p: "Absolute speed varies between lifters and lifts, so the most useful measure is how much a set slows down from its fastest rep. Research on squats and bench presses (for example, González-Badillo and Sánchez-Medina's work on velocity loss) has found that velocity loss tracks closely with how many reps you have left. As a rough guide:",
      },
      {
        ul: [
          "**Under 10% slower than your fastest rep:** plenty left in the tank. Good for power and technique work.",
          "**About 20% slower:** a few reps left. A sensible stopping point for most strength sets.",
          "**30% or more slower:** about one rep left. Ending the set here keeps most of the benefit and much less of the fatigue.",
        ],
      },
      { cta: "labs" },
      { h2: "You don't need a sensor any more" },
      {
        p: "VBT used to mean a clip-on sensor or a linear encoder on the bar, which most lifters never bought. Pose models that run on a phone have changed that. Prop the phone up side-on, and the camera can follow your joints through each rep, time the lifting part, and turn the distance moved into metres per second using your height for scale.",
      },
      {
        p: "In Liftsmith this lives in **Settings › Labs › Camera bar speed** (Labs is part of Pro). While the camera counts your reps, it shows the last full rep's speed, and from the third rep it tells you roughly how many reps are left. At 30% velocity loss it says it's a good place to end the set, with one buzz. Video is read on the phone frame by frame and dropped; nothing is recorded or uploaded.",
      },
      {
        tip: "Add your height in Your stats so the camera can measure in m/s. Without it you still get the slowdown as a share of your fastest rep, which is the part that predicts reps left.",
      },
      { h2: "Lifts it works best on" },
      { exercises: ["back-squat", "goblet-squat", "bench-press", "overhead-press", "romanian-deadlift", "db-row"] },
      {
        p: "Lifts with a clear up and down and joints the camera can see from the side give the cleanest numbers: squats, presses, rows and hinges. Holds and carries don't have reps to measure.",
      },
      { h2: "How to use it in your training" },
      {
        ol: [
          "**Set a stopping point.** For strength, end most sets at 20 to 30% velocity loss instead of grinding to failure.",
          "**Watch your first rep.** If it's clearly slower than usual at a weight you know, keep today's sets lighter.",
          "**Keep logging normally.** The reps the camera counts fill in your set, so Log set stays one tap and your [progression](/guides/progressive-overload/) carries on.",
        ],
      },
    ],
    faq: [
      [
        "What is a good bar speed for strength training?",
        "It depends on the lift and the lifter. Heavy sets near your max often move around 0.3 m/s or less, lighter sets faster. Velocity loss within a set is more useful than any single number.",
      ],
      [
        "Can a phone measure bar speed accurately?",
        "A phone camera filmed from the side gives a good estimate of rep speed and, more importantly, how much a set slows down. It isn't a lab encoder, so use it to compare reps and sessions rather than as an exact reading.",
      ],
    ],
  },
  {
    slug: "can-your-phone-count-your-reps",
    kind: "blog",
    title: "Can your phone count your reps? How camera counting works",
    description:
      "How on-phone pose tracking counts reps, spots partial and grinding reps, where to put the phone, and what it can and can't do yet.",
    date: "2026-11-11",
    tag: "Tracking",
    cta: "labs",
    body: [
      {
        p: "Counting reps sounds trivial until you're on rep nine of a hard set and can't remember whether it was nine or ten. A phone that counts for you, without anything strapped to your body, is now possible: small pose models can follow 33 points on your body in real time, right on the phone.",
      },
      { h2: "How camera rep counting works" },
      {
        p: "The camera finds your joints in each frame and works out the angle that matters for the lift: your knee for squats, your hip for hinges, your elbow for presses, rows and curls, your shoulder for raises. A rep is counted each time that angle leaves your starting position and comes back. Smoothing filters stop a wobble or a blink of lost tracking from being counted as a rep.",
      },
      {
        p: "Good counters do more than count. They also grade each rep: a **partial** rep that didn't reach most of your usual depth, a **grinder** that was much slower than the set's fastest rep or stalled on the way up, and a **failed** rep that didn't come back up.",
      },
      { cta: "labs" },
      { h2: "Where to put your phone" },
      {
        ol: [
          "**Side-on, about two to three metres away,** so your whole body is in the frame from head to feet.",
          "**At roughly hip height,** propped on a bench, a plate or a water bottle.",
          "**Good light from the front or side,** not a bright window behind you.",
          "**Check the dot.** In Liftsmith a dot on the camera preview turns green when your whole body is in view.",
        ],
      },
      { h2: "What it can and can't count" },
      { exercises: ["back-squat", "goblet-squat", "push-up", "overhead-press", "db-curl", "lateral-raise"] },
      {
        p: "Squats, lunges, presses, push-ups, rows, curls and raises all have a clear joint angle to follow. Holds like the [plank](/exercises/plank/), carries, shrugs and wrist curls don't, so the camera leaves those to you. Very cluttered gyms, baggy clothes and people walking through the frame can all throw it off.",
      },
      { h2: "Trying it in Liftsmith" },
      {
        p: "Camera rep counting is in **Settings › Labs**, the Pro section for features we're still testing. Turn it on and a **Count reps** button appears on the exercise demo during a workout. While it counts, the 3D figure follows your movement, with the camera beside it and the bones it sees drawn over you. The reps it counts fill in the reps box, so logging stays one tap, and you can still change the number.",
      },
      {
        tip: "Your video never leaves your phone. Each frame is read in memory and thrown away, and the pose model is part of the app, so counting works offline too.",
      },
    ],
    faq: [
      [
        "Does camera rep counting record video?",
        "Not in Liftsmith. Frames are read on the phone and dropped straight away; nothing is saved or uploaded.",
      ],
      ["Which camera should I use?", "The front camera is the default so you can see yourself, with a button to flip to the back camera."],
    ],
  },
  {
    slug: "lifting-with-a-smartwatch",
    kind: "blog",
    title: "Lifting with a smartwatch: what your watch is good for",
    description:
      "What a smartwatch adds to strength training: heart rate, rest alerts and logging sets from your wrist on Wear OS, Apple Watch and Garmin.",
    date: "2026-11-11",
    tag: "Tracking",
    cta: "watch",
    body: [
      {
        p: "Smartwatches were built for runners, and it shows: most of their workout screens care about pace and distance. For lifting, a watch is most useful for three small jobs: telling you when rest is over, showing what's next without unlocking your phone, and recording your heart rate. Done well, it means your phone can stay in your bag between sets.",
      },
      { h2: "1. Rest timing on your wrist" },
      {
        p: "Rest is where most workouts quietly go wrong. Scroll for a minute and three minutes of rest becomes six. A buzz on your wrist when rest ends keeps the session moving without you watching a clock. See [how long to rest between sets](/blog/how-long-to-rest-between-sets/) for how much rest each kind of set needs.",
      },
      { h2: "2. The next set at a glance" },
      {
        p: "Knowing what's next (the exercise, the weight, the reps and the plates to load) before you walk back to the bar saves time and stops loading mistakes. A watch that mirrors your workout puts that on your wrist.",
      },
      { cta: "watch" },
      { h2: "3. Heart rate without a chest strap" },
      {
        p: "Wrist heart rate is less precise than a chest strap during heavy, grip-intensive sets, but it's good enough to show how hard a session was overall and how well you recover between sets. Read more in [heart rate during weight training](/blog/heart-rate-during-weight-training/).",
      },
      { h2: "How it works in Liftsmith" },
      {
        ul: [
          "**Wear OS and Apple Watch:** the watch app opens itself when you start a workout on your phone and shows the set, weight, reps and plates, or a big rest countdown with the next set under it.",
          "**Log set and +30 s** on the watch do exactly what the buttons on your phone do, so a set is logged as planned in one tap.",
          "**Heart rate from the watch's own sensor** goes to your phone during the workout, and the finished workout is saved to Health Connect or Apple Health once, not twice.",
          "**A buzz when rest ends,** following the same setting as your phone.",
          "**Garmin:** a Connect IQ watch app with the same screens, driven by the watch's buttons, is on its way for recent Forerunner, fēnix, epix, Venu and vívoactive watches.",
        ],
      },
      {
        tip: "The phone stays the one place a workout is planned, so there's nothing to set up on the watch and nothing to merge afterwards.",
      },
      { h2: "Do you need a watch to lift?" },
      {
        p: "No. Everything the watch shows is also on your phone's lock screen: the rest countdown, the next set and the Log set button. A watch just saves you reaching for your phone. If you already own one, though, it's the easiest upgrade to your training there is.",
      },
    ],
    faq: [
      [
        "Is wrist heart rate accurate for weightlifting?",
        "It's usually fine for overall effort and recovery between sets, but less reliable during heavy sets where you grip hard. A chest strap is more accurate if heart rate matters to you.",
      ],
      [
        "Can I start a workout from my watch?",
        "In Liftsmith you start on your phone, then the watch opens itself and follows along. Logging sets and adding rest work from the watch.",
      ],
    ],
  },
  {
    slug: "drop-sets-and-rest-pause-sets",
    kind: "blog",
    title: "Drop sets and rest-pause sets: when they're worth it",
    description:
      "What drop sets and rest-pause sets are, how to do them, how much weight to drop and when they help you build muscle faster.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "log",
    body: [
      {
        p: "Drop sets and rest-pause sets are two ways to squeeze more hard reps out of a set you've just finished. Both push a muscle closer to its limit in very little time, which makes them popular for building muscle when time is short. Used sparingly they work; used on everything they just add fatigue.",
      },
      { h2: "What is a drop set?" },
      {
        p: "You finish a set, then immediately lower the weight, usually by about 20 to 30%, and do as many good reps as you can with no rest. Machines, cables and dumbbells make this easy because changing the weight takes seconds.",
      },
      { h2: "What is a rest-pause set?" },
      {
        p: "You finish a set, rest for 10 to 20 seconds, then do a few more reps with the same weight. Expect about a third of the reps you managed the first time. You can repeat the pause once or twice more.",
      },
      { cta: "log" },
      { h2: "Do they work?" },
      {
        p: "Studies comparing drop sets with normal sets (for example, Fink and colleagues, 2018) found similar muscle growth in less time. That's the real benefit: they save time. They don't build more muscle than the same amount of hard sets done normally. See [how many sets per week to build muscle](/blog/how-many-sets-per-week-to-build-muscle/) for how much total work you need.",
      },
      { h2: "Exercises that suit them" },
      { exercises: ["lateral-raise", "cable-curl", "cable-pushdown", "leg-extension", "lat-pulldown", "machine-chest-press"] },
      {
        p: "Pick isolation and machine exercises where failing a rep is safe. Avoid drop sets on heavy [squats](/exercises/back-squat/) and [deadlifts](/exercises/deadlift/): technique breaks down when you're that tired, and the fatigue carries into the rest of your week.",
      },
      { h2: "How to use them" },
      {
        ol: [
          "**Last set only.** Add one drop or rest-pause after the final set of an exercise.",
          "**One or two exercises a workout,** not every exercise.",
          "**Skip them in a deload week** and when you're short on recovery.",
        ],
      },
      { h2: "Logging them without messing up your plan" },
      {
        p: "Bonus sets shouldn't confuse your progression. In Liftsmith, an optional **Add a bonus set?** row appears during rest. **Drop set** picks about 75% of the weight you just lifted, rounded to what your gym has; **Rest-pause** keeps the weight after a 15-second pause, aiming for about a third of the reps. Bonus sets are tagged, count in your weekly volume, and are left out of the weight and rep targets for next time.",
      },
    ],
    faq: [
      ["How much weight should I drop on a drop set?", "About 20 to 30%. Enough that you can do several more good reps straight away."],
      [
        "Are rest-pause sets good for beginners?",
        "Beginners grow fine from normal sets, so there's no need. Once workouts start running long, they're a useful way to save time.",
      ],
    ],
  },
  {
    slug: "should-you-train-to-failure",
    kind: "blog",
    title: "Should you train to failure? What zero reps in reserve costs",
    description:
      "Training to failure explained: what it is, what the research says about muscle and strength, the fatigue it costs and when to use it.",
    date: "2026-11-11",
    tag: "Programming",
    cta: "rir",
    body: [
      {
        p: "Training to failure means doing reps until you can't complete another one with good form. In terms of [reps in reserve](/guides/reps-in-reserve/), it's zero: nothing left in the tank. It feels productive, and for some exercises it can be. But for most of your sets, stopping a rep or two short gets you nearly all the benefit for much less fatigue.",
      },
      { h2: "What the research says" },
      {
        p: "Reviews of the studies (such as Grgic and colleagues, 2022) found that sets taken to failure and sets stopped a few reps short build similar muscle and strength when the total work is matched. Getting close to failure matters; reaching it every time doesn't add much. What failure does add is fatigue, which slows recovery for your next session.",
      },
      { cta: "rir" },
      { h2: "The real cost of failure" },
      {
        ul: [
          "**Longer recovery.** Sets to failure leave you more tired for a day or two, which can cost reps in your next workout.",
          "**Worse sets after it.** Failing on your first set usually means fewer reps on every set after.",
          "**More risk on big lifts.** A failed rep on a heavy [squat](/exercises/back-squat/) or [bench](/exercises/bench-press/) needs safety bars or a spotter.",
        ],
      },
      { h2: "When failure is fine" },
      { exercises: ["lateral-raise", "db-curl", "cable-pushdown", "leg-extension", "push-up", "bw-calf-raise"] },
      {
        p: "Isolation, machine and bodyweight exercises are safe to take to failure, and doing so on the last set now and then teaches you what zero reps left really feels like. That makes your other effort ratings more honest.",
      },
      { h2: "A simple rule" },
      {
        ol: [
          "**Big lifts:** stop with 1 to 3 reps left.",
          "**Small lifts:** 0 to 2 reps left, failure on the last set if you like.",
          "**Later in a training block,** get closer to failure; then [deload](/guides/deload-week/).",
        ],
      },
      {
        p: "Liftsmith sets the reps to leave in the tank for each week of your block and adjusts from what you report after each set. A rating of 0 reps left is marked as a set to failure, in the app and in your exported sets, so you can see how often you really go there.",
      },
    ],
    faq: [
      [
        "Is training to failure necessary for muscle growth?",
        "No. Sets that end one to three reps short of failure build similar muscle when the total work is the same.",
      ],
      [
        "How often should I train to failure?",
        "Occasionally, on the last set of small exercises. Rarely, if ever, on heavy compound lifts.",
      ],
    ],
  },
  {
    slug: "how-to-take-body-measurements",
    kind: "blog",
    title: "How to take body measurements to track progress",
    description:
      "Where to measure your waist, hips, chest, arms and legs, how to measure the same way every time, and what the changes mean.",
    date: "2026-11-11",
    tag: "Nutrition",
    cta: "measure",
    body: [
      {
        p: "The scale tells you one number and hides the rest. If you're lifting while eating near maintenance, you can lose fat and gain muscle at the same time and weigh exactly the same. A tape measure catches what the scale misses, and it costs almost nothing.",
      },
      { h2: "Where to measure" },
      {
        ul: [
          "**Waist:** at your belly button, relaxed, after breathing out. The single most useful measurement.",
          "**Hips:** around the widest part of your buttocks, feet together.",
          "**Chest:** under the armpits and across the nipples, arms relaxed.",
          "**Shoulders:** around the widest point, arms by your sides.",
          "**Neck:** just below the Adam's apple.",
          "**Upper arm:** halfway between shoulder and elbow, relaxed.",
          "**Forearm:** around the widest part, relaxed.",
          "**Thigh:** halfway between hip and knee, standing.",
          "**Calf:** around the widest part, standing.",
        ],
      },
      { cta: "measure" },
      { h2: "Measure the same way every time" },
      {
        ol: [
          "**Same time of day,** ideally in the morning before eating.",
          "**Same side** for arms and legs.",
          "**Tape snug, not tight,** and level all the way round. Use a mirror for the waist.",
          "**Every two to four weeks.** Weekly changes are mostly noise.",
        ],
      },
      { h2: "What the numbers mean" },
      {
        ul: [
          "**Waist down, weight steady, lifts going up:** you're likely losing fat and building muscle. See [body recomposition](/blog/body-recomposition/).",
          "**Waist up while bulking:** some fat gain is normal; if it climbs fast, trim calories a little.",
          "**Arms and thighs up, waist steady:** muscle is going on where you want it.",
        ],
      },
      { h2: "Tracking it in Liftsmith" },
      {
        p: "Body and photos has a **Measurements** card: tap the site, bump the number up or down from last time (0.5 cm or 0.25 in steps), and log it. Each site shows its latest number and its change since the first. When you don't log body fat, your waist feeds a coach's note: **Your waist is growing**, with food advice for your goal, or **Waist down, strength holding**, when it's working. Pair it with the [TDEE calculator](/tools/tdee-calculator/) to set your calories.",
      },
    ],
    faq: [
      [
        "How often should I take body measurements?",
        "Every two to four weeks, at the same time of day. Daily or weekly changes are mostly water and food.",
      ],
      [
        "Which body measurement matters most?",
        "Waist. It tracks body fat closely, and a shrinking waist with steady or rising strength is a good sign.",
      ],
    ],
  },
  {
    slug: "health-connect-and-apple-health-for-lifters",
    kind: "blog",
    title: "Health Connect and Apple Health for lifters: what to sync",
    description:
      "What a lifting app should read from and write to Health Connect and Apple Health: weight, body fat, sleep, HRV, heart rate and workouts.",
    date: "2026-11-11",
    tag: "Recovery",
    cta: "health",
    body: [
      {
        p: "Your phone already knows a lot about your recovery: how you slept, your resting heart rate, your heart rate variability, your weight from a smart scale. Health Connect on Android and Apple Health on iPhone are where all of that collects, from watches, rings, scales and apps. A lifting app that reads it can plan around how you actually are today.",
      },
      { h2: "What's worth reading" },
      {
        ul: [
          "**Sleep:** a short night is the most common reason a heavy day feels awful.",
          "**HRV and resting heart rate:** compared with your own normal, they hint at how recovered you are. See [HRV and training readiness](/blog/hrv-and-training-readiness/).",
          "**Weight and body fat:** from a smart scale, so weigh-ins happen without typing.",
          "**Steps:** a big day on your feet affects how fresh your legs are.",
        ],
      },
      { cta: "health" },
      { h2: "What's worth writing back" },
      {
        p: "Your workouts should show up in your health app as real strength workouts, with their time, calories and heart rate, so your daily activity totals are right and other apps can see you trained. They should also be written once: a phone and a watch both saving the same workout counts it twice.",
      },
      { h2: "Where your devices come in" },
      {
        p: "Most watches, rings and scales already write to the health store on your phone, including Garmin, Fitbit, Oura and Samsung Health. That means one connection in your lifting app covers all of them. On Samsung phones, switch on Health Connect sharing in Samsung Health's settings.",
      },
      { h2: "How Liftsmith uses it" },
      {
        ol: [
          "**Settings › Connected apps** shows what's connected, when it last synced and exactly which readings are allowed, with **Sync now** and a way to change permissions.",
          "With Pro, sleep, HRV and resting heart rate feed today's call (push, as planned or an easy day), and the plan shows which readings it came from.",
          "Weigh-ins and body fat arrive on their own, one per day, so a re-import never duplicates them.",
          "Finished workouts are saved as strength training workouts with their sets in the notes, along with calories and heart rate.",
        ],
      },
      {
        tip: "Your health data stays yours. It's stored on your phone, kept out of phone backups, and only syncs to your own account if you sign in.",
      },
    ],
    faq: [
      [
        "Does Liftsmith work without Health Connect or Apple Health?",
        "Yes. It plans from your logged workouts alone; health readings just make the readiness call sharper.",
      ],
      [
        "Can I connect a Garmin or Oura?",
        "Yes, through Health Connect or Apple Health: let your Garmin or Oura app share to it, then connect Liftsmith to the same place.",
      ],
    ],
  },
];
